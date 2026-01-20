import './render.js';
import DataBus from './databus.js'
import Ball from './game/ball.js'
import Obstacle from './game/obstacle.js'
import Camera from './game/camera.js'
import GameInfo from './game/gameinfo.js'
import Background from './game/background.js'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render.js';
import Guide from './game/guide.js'
import EventManager from './game/eventmanager.js'  // 导入事件管理器

// 子游戏（模块化）
import AwesomeCatGame from './game/subgames/awesome_cat_game.js'
import SpinDominoGame from './game/subgames/spin_domino_game.js'

const ctx = canvas.getContext('2d')
const databus = new DataBus()

let gameInfo = null
let background = null
let camera = null
let guide = null
let eventManager = null  // 事件管理器实例
let previewStartTime = 0
const PREVIEW_DURATION = 5000

// 障碍物颜色
const OBSTACLE_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff00ff', '#00ffff']

/**
 * 游戏主函数
 */
export default class Main {
  aniId = 0 // 用于存储动画帧的ID
  bg = null // 背景实例
  gameInfo = null // 游戏UI实例
  guide = null  // 新手引导
  eventManager = null  // 事件管理器

  // 子游戏：当前运行的子游戏实例（为 null 表示主游戏模式）
  subGame = null
  lastFrameTime = 0

  // ====== 背景音乐与音效 ======
  bgmAudio = null
  collisionAudio = null
  _lastCollisionTime = 0

  constructor() {
    this.init()
    this.loop()
  }

  /**
   * 初始化游戏
   */
  init() {
    // 最简化转发功能（只需这3行）
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })

    // 设置默认分享内容
    wx.onShareAppMessage(() => {
      return {
        title: '一起来玩多米诺滚珠大赛！'
      }
    })
    // 设置canvas尺寸
    canvas.width = SCREEN_WIDTH
    canvas.height = SCREEN_HEIGHT

    // 初始化数据总线
    databus.reset()

    // 初始化各模块
    databus.mapHeight = canvas.height * 10
    this.bg = new Background(canvas.width, canvas.height, databus.mapHeight)
    this.gameInfo = new GameInfo(databus)
    camera = new Camera(canvas.width, canvas.height, databus.mapHeight)

    // 让子游戏可以复用主画布上下文
    this.ctx = ctx
    this.canvas = canvas

    // 初始化新手引导
    this.guide = new Guide()

    const that = this;
    // 初始化事件管理器
    this.eventManager = new EventManager({
      main: that,
      canvas: canvas,
      databus: databus,
      gameInfo: that.gameInfo,
      camera: camera,
      guide: that.guide
    });

    this.eventManager.init()

    // 检查是否需要显示引导
    if (!this.guide.hasCompleted()) {
      this.guide.start()
      console.log('开始新手引导')
    } else {
      console.log('新手引导已完成')
      this.guide.isActive = false;
    }

    // 初始化游戏对象
    this.initGameObjects()

    // 初始化音频
    this.initAudio()
  }

  initAudio() {
    // 微信小游戏环境
    if (typeof wx !== 'undefined' && wx.createInnerAudioContext) {
      this.bgmAudio = wx.createInnerAudioContext()
      this.bgmAudio.src = 'audio/ballbgm.mp3'
      this.bgmAudio.loop = true
      this.bgmAudio.volume = 0.2
      this.bgmAudio.autoplay = true
      this.bgmAudio.play()

      this.collisionAudio = wx.createInnerAudioContext()
      this.collisionAudio.src = 'audio/collision.mp3'
      this.collisionAudio.volume = 1
    } else if (typeof Audio !== 'undefined') {
      // H5调试环境
      this.bgmAudio = new Audio('audio/ballbgm.mp3')
      this.bgmAudio.loop = true
      this.bgmAudio.volume = 0.2
      this.bgmAudio.autoplay = true
      this.bgmAudio.play()

      this.collisionAudio = new Audio('audio/collision.mp3')
      this.collisionAudio.volume = 1
    }
  }

  /**
   * 初始化游戏对象
   */
  initGameObjects() {
    // 初始化滚珠
    databus.balls = []
    const centerX = canvas.width / 2
    const ballCount = 7 // 改成7个
    const baseSpacing = 80
    const randomOffsets = []

    // 计算滚珠水平分布位置
    const totalWidth = canvas.width * 0.8
    const startX = (canvas.width - totalWidth) / 2
    const spacing = totalWidth / (ballCount + 1)

    for (let i = 0; i < ballCount / 2; i++) {
      const offset = baseSpacing + Math.random() * 80
      randomOffsets.push(offset)
    }

    for (let i = 0; i < ballCount; i++) {
      const isLeftSide = i % 2 === 0
      const pairIndex = Math.floor(i / 2)
      const offset = randomOffsets[pairIndex] || baseSpacing
      const x = startX + spacing * (i + 1)

      const ball = new Ball(
        i,
        x,
        150,
        15,
        OBSTACLE_COLORS[i % OBSTACLE_COLORS.length]
      )

      // 给每个球一个显示用数字（1-7）
      ball.displayNumber = i + 1

      databus.balls.push(ball)
    }

    // 默认选中第一个滚珠
    if (databus.balls.length > 0) {
      databus.selectedBall = databus.balls[0]
      databus.selectedBall.selected = true
      databus.selectedBall.hasBet = false
      console.log('默认选中滚珠:', databus.selectedBall.id)
    }

    // 初始化障碍物
    databus.obstacles = []
    const rows = 25
    const startY = 250
    const endY = databus.mapHeight - 200
    const totalHeight = endY - startY
    const rowSpacing = totalHeight / rows
    for (let i = 0; i < rows; i++) {
      const y = startY + i * rowSpacing
      const width = canvas.width * 0.45

      // 确保角度大于30度且小于150度
      const angleBase = 60 * (Math.PI / 180) // 从45度改为60度作为基准
      const angleVariation = (Math.sin(i * 0.8) * 30) * (Math.PI / 180) // 增加变化范围到±30度

      // 计算基础角度并确保在30-150度范围内
      let baseAngle = angleBase + angleVariation

      // 转换到0-180度范围
      let angleDeg = baseAngle * (180 / Math.PI)

      // 调整角度确保在30-150度范围内
      if (angleDeg < 30) {
        angleDeg = 30 + Math.random() * 10
      } else if (angleDeg > 70) {
        angleDeg = 70 - Math.random() * 10
      } else if (Math.abs(angleDeg - 90) < 5) {
        // 避免太接近垂直（85-95度），稍微偏移
        angleDeg = 90 + (Math.random() > 0.5 ? 10 : -10)
      }

      // 确保角度在30-150度范围内
      angleDeg = Math.max(30, Math.min(70, angleDeg))

      // 重新转换为弧度
      const finalAngle = angleDeg * (Math.PI / 180)

      // 随机选择颜色
      const colorIndex = i % OBSTACLE_COLORS.length
      const obstacleColor = OBSTACLE_COLORS[colorIndex]

      // 两侧障碍物
      databus.obstacles.push(new Obstacle(
        width * 0.1,
        y,
        width,
        20,
        finalAngle,
        0.9,
        obstacleColor
      ))

      databus.obstacles.push(new Obstacle(
        canvas.width - width * 0.1,
        y,
        width,
        20,
        -finalAngle, // 对称角度
        0.9,
        obstacleColor
      ))

      // 中间障碍物
      if (i % 3 === 1) {
        // 中间障碍物角度也在30-150度范围内，避免水平
        let centerAngleDeg = 30 + Math.random() * 120 // 30-150度

        // 避免太接近水平或垂直
        if (centerAngleDeg < 35) centerAngleDeg = 35
        if (centerAngleDeg > 145) centerAngleDeg = 145
        if (Math.abs(centerAngleDeg - 90) < 10) {
          // 如果太接近垂直，偏移到60-70度或110-120度
          centerAngleDeg = 90 + (Math.random() > 0.5 ? 25 : -25)
        }

        const centerAngle = centerAngleDeg * (Math.PI / 180)
        const centerWidth = 80 + Math.random() * 60
        const centerColor = OBSTACLE_COLORS[(colorIndex + 2) % OBSTACLE_COLORS.length]

        databus.obstacles.push(new Obstacle(
          centerX,
          y + rowSpacing * 0.5,
          centerWidth,
          20,
          centerAngle,
          1.2,
          centerColor
        ))
      }
    }

    // 设置终点线
    databus.finishLine = {
      x: 0,
      y: databus.mapHeight - 80,
      width: canvas.width,
      height: 20
    }

    camera.reset()
  }

  /**
   * 碰撞检测
   */
  collisionDetection() {
    // 滚珠与障碍物碰撞检测
    databus.balls.forEach(ball => {
      if (ball.finished) return

      databus.obstacles.forEach(obstacle => {
        const collided = obstacle.checkCollision(ball, databus.bounceDamping)
        // 只对当前选中球播放碰撞音效，且加简单节流
        if (ball === databus.selectedBall && collided) {
          const now = Date.now()
          if (!this._lastCollisionTime || now - this._lastCollisionTime > 120) {
            if (this.collisionAudio) {
              try {
                this.collisionAudio.stop?.()
                this.collisionAudio.currentTime = 0
                this.collisionAudio.play()
              } catch (e) {
                try { this.collisionAudio.play() } catch (e2) {}
              }
            }
            this._lastCollisionTime = now
          }
        }
      })
    })
  }

  /**
   * 边界碰撞检测
   */
  boundaryDetection() {
    databus.balls.forEach(ball => {
      if (ball.finished) return

      // 左右边界
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius
        ball.vx *= -databus.bounceDamping
      } else if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius
        ball.vx *= -databus.bounceDamping
      }

      // 底部边界
      if (ball.y + ball.radius > databus.mapHeight) {
        ball.y = databus.mapHeight - ball.radius
        ball.vy *= -databus.bounceDamping
        ball.vx *= databus.friction
      }
    })
  }

  /**
   * 终点检测
   */
  finishDetection() {
    databus.balls.forEach(ball => {
      if (ball.finished) return

      if (ball.y + ball.radius > databus.finishLine.y &&
        ball.y - ball.radius < databus.finishLine.y + databus.finishLine.height &&
        ball.x > databus.finishLine.x &&
        ball.x < databus.finishLine.x + databus.finishLine.width) {
        ball.finished = true
        ball.finishTime = Date.now()
        ball.vy *= 0.5
        ball.vx *= 0.5
      }
    })
  }

  /**
   * 游戏结束检查
   */
  checkGameFinish() {
    const finishedBalls = databus.balls.filter(b => b.finished)

    if (finishedBalls.length === databus.balls.length && databus.gameState === 'running') {
      databus.gameState = 'finished'

      // 排序（到终点先后）
      finishedBalls.sort((a, b) => a.finishTime - b.finishTime)

      // 计算奖励
      const playerRank = finishedBalls.findIndex(b => b.id === databus.selectedBall?.id) + 1
      if (playerRank === 1) {
        this.gameInfo.setRoundSummary(databus.betAmount, databus.betAmount * 2)

        databus.score += databus.betAmount * 2
      } else if (playerRank === 2) {
        this.gameInfo.setRoundSummary(databus.betAmount, databus.betAmount)

        databus.score += databus.betAmount
      }
      this.gameInfo.score = databus.score
      this.gameInfo.setRoundSummary(databus.betAmount, 0)

      // 显示结果 + 幸运数字（按到达顺序）
      const luckyNumbers = finishedBalls.map(b => b.displayNumber ?? (b.id + 1))
      this.gameInfo.uiPositions.resultModal.visible = true
      this.gameInfo.uiPositions.resultModal.ranking = finishedBalls
      this.gameInfo.uiPositions.resultModal.luckyNumbers = luckyNumbers
    }
  }

  /**
   * 更新游戏逻辑
   */
  update() {
    // 子游戏模式时：由子游戏接管 update
    if (this.subGame) {
      const now = Date.now()
      const dt = this.lastFrameTime ? (now - this.lastFrameTime) : 16
      this.lastFrameTime = now
      this.subGame.update(dt)
      return
    }

    // 如果引导正在显示，暂停游戏逻辑更新
    if (this.guide && this.guide.isActive) {
      // 引导期间只更新相机预览（如果有）
      if (databus.gameState === 'preview') {
        const elapsed = Date.now() - previewStartTime
        if (elapsed >= PREVIEW_DURATION) {
          databus.gameState = 'betting'
          this.gameInfo.uiPositions.betModal.visible = true
        }
      }

      // 更新相机
      if (camera) {
        camera.update(
          databus.balls,
          databus.selectedBall,
          databus.gameState,
          PREVIEW_DURATION,
          databus.gameState === 'preview' ? Date.now() - previewStartTime : 0
        )
      }
      return
    }

    if (databus.gameState === 'running') {
      // 更新滚珠物理状态
      databus.balls.forEach(ball => {
        ball.update(databus.gravity, databus.friction, databus.airResistance)
      })

      this.collisionDetection() // 碰撞检测
      this.boundaryDetection() // 边界检测
      this.finishDetection() // 终点检测
      this.checkGameFinish() // 游戏结束检查

    } else if (databus.gameState === 'preview') {
      const elapsed = Date.now() - previewStartTime

      // 预览结束后自动进入助力选择
      if (elapsed >= PREVIEW_DURATION) {
        databus.gameState = 'betting'
        this.gameInfo.uiPositions.betModal.visible = true
        // 触发引导步骤5：助力选择弹窗显示
        if (this.guide && this.guide.isActive) {
          this.guide.next()
        }
      }
    }

    // 更新相机
    if (camera) {
      camera.update(
        databus.balls,
        databus.selectedBall,
        databus.gameState,
        PREVIEW_DURATION,
        databus.gameState === 'preview' ? Date.now() - previewStartTime : 0
      )
    }
  }

  /**
   * canvas重绘函数
   */
  render() {
    // 子游戏模式时：由子游戏接管 render
    if (this.subGame) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      this.subGame.render()
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制背景
    this.bg.render(ctx, camera.offsetY)

    // 保存状态并应用相机变换
    ctx.save()

    // 应用相机偏移
    ctx.translate(0, -camera.offsetY)

    // 绘制终点线
    ctx.fillStyle = '#44ff44'
    ctx.shadowColor = 'rgba(68, 255, 68, 0.8)'
    ctx.shadowBlur = 20
    ctx.fillRect(
      databus.finishLine.x,
      databus.finishLine.y,
      databus.finishLine.width,
      databus.finishLine.height
    )
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('终点线', canvas.width / 2, databus.finishLine.y - 10)

    // 绘制所有障碍物
    databus.obstacles.forEach(obstacle => {
      obstacle.render(ctx)
    })

    // 绘制所有滚珠
    databus.balls.forEach(ball => {
      ball.render(ctx)

      // 在球上绘制数字（叠加层，不侵入 Ball 类）
      const num = ball.displayNumber ?? (ball.id + 1)
      ctx.save()
      // ctx.translate(0, -camera.offsetY)

      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 3
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.fillStyle = '#ffffff'

      // 为避免与球颜色混淆，描边+填充
      ctx.strokeText(String(num), ball.x, ball.y)
      ctx.fillText(String(num), ball.x, ball.y)

      ctx.restore()
    })

    ctx.restore()

    // 绘制游戏UI
    if (this.gameInfo && typeof this.gameInfo.render === 'function') {
      this.gameInfo.render(ctx, canvas.width, canvas.height)
    }

    // 如果结果弹窗打开，额外显示幸运数字（不依赖 GameInfo 内部实现）
    if (this.gameInfo?.uiPositions?.resultModal?.visible && this.gameInfo.uiPositions.resultModal.luckyNumbers) {
      const nums = this.gameInfo.uiPositions.resultModal.luckyNumbers
      const text = `本局幸运数字：${nums.join(' - ')}`

      ctx.save()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      ctx.fillRect(canvas.width / 2 - 180, canvas.height * 0.18, 360, 42)

      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.strokeRect(canvas.width / 2 - 180, canvas.height * 0.18, 360, 42)

      ctx.fillStyle = '#ffffff'
      ctx.font = '18px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, canvas.width / 2, canvas.height * 0.18 + 21)
      ctx.restore()
    }

    // 在预览状态显示提示信息
    if (databus.gameState === 'preview') {
      this.drawPreviewInfo()
    }

    // 绘制新手引导（如果有）
    if (this.guide && this.guide.isActive) {
      const uiElements = {
        menuButton: this.gameInfo.uiPositions.menuButton,
        menuModal: this.gameInfo.uiPositions.menuModal,
        betModal: this.gameInfo.uiPositions.betModal,
        startGameButton: this.gameInfo.uiPositions.startGameButton,
        cameraOffsetY: camera ? camera.offsetY : 0,
      }

      this.guide.render(
        ctx,
        databus.gameState,
        uiElements,
        databus.selectedBall,
        canvas.width,
        canvas.height
      )
    }
  }

  /**
   * 绘制预览状态提示信息
   */
  drawPreviewInfo() {
    const elapsed = Date.now() - previewStartTime
    const remaining = Math.max(0, PREVIEW_DURATION - elapsed)
    const seconds = (remaining / 1000).toFixed(1)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(canvas.width / 2 - 150, 150, 300, 80)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(canvas.width / 2 - 150, 150, 300, 80)

    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('赛道预览中...', canvas.width / 2, 180)

    ctx.font = '16px Arial'
    ctx.fillText(`${seconds}秒后选择助力积分`, canvas.width / 2, 210)

    // 绘制进度条
    const progress = elapsed / PREVIEW_DURATION
    const barWidth = 260
    const barHeight = 10
    const barX = canvas.width / 2 - barWidth / 2
    const barY = 220

    // 进度条背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(barX, barY, barWidth, barHeight)

    // 进度条前景
    ctx.fillStyle = '#44ff44'
    ctx.fillRect(barX, barY, barWidth * progress, barHeight)

    // 进度条边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(barX, barY, barWidth, barHeight)
  }

  /**
   * 游戏主循环
   */
  loop() {
    this.update() // 更新游戏逻辑
    this.render() // 渲染游戏画面

    // 请求下一帧动画
    this.aniId = requestAnimationFrame(this.loop.bind(this))
  }

  /**
   * 开始地图预览
   */
  startMapPreview() {
    databus.gameState = 'preview'
    previewStartTime = Date.now()

    // 重置相机预览状态
    camera.previewProgress = 0
    camera.previewDirection = 1

    console.log('开始地图预览，总时长:', PREVIEW_DURATION, 'ms')
  }

  /**
   * 确认助力
   */
  confirmBet(betAmount) {
    console.log('确认助力: 滚珠', databus.selectedBall.id, '积分', betAmount)

    if (!databus.selectedBall) {
      wx.showToast({
        title: '请先选择一个滚珠！',
        icon: 'none'
      })
      return
    }

    if (betAmount <= 0) {
      wx.showToast({
        title: '积分必须大于0！',
        icon: 'none'
      })
      return
    }

    if (betAmount > databus.score) {
      wx.showToast({
        title: '积分不足！',
        icon: 'none'
      })
      return
    }

    // 下注
    databus.balls.forEach(b => b.hasBet = false)
    databus.selectedBall.hasBet = true
    databus.betAmount = betAmount
    databus.score -= betAmount
    this.gameInfo.score = databus.score
    this.gameInfo.betAmount = betAmount

    // 开始游戏
    this.gameInfo.uiPositions.betModal.visible = false
    databus.gameState = 'running'

    // 给滚珠初始速度
    setTimeout(() => {
      databus.balls.forEach(ball => {
        ball.vy = 2
        ball.vx = (Math.random() - 0.5) * 1.0
      })
    }, 1000)

    // 显示助力成功的提示
    wx.showToast({
      title: `助力成功！投入${betAmount}积分`,
      icon: 'success',
      duration: 2000
    })
  }

  /**
   * 取消助力
   */
  cancelBet() {
    this.gameInfo.uiPositions.betModal.visible = false
    databus.gameState = 'idle'
    this.restartGame();
  }

  /**
   * 切换暂停/继续
   */
  togglePause() {
    if (databus.gameState === 'running') {
      databus.gameState = 'paused'
      wx.showToast({
        title: '游戏已暂停',
        icon: 'none'
      })
    } else if (databus.gameState === 'paused') {
      databus.gameState = 'running'
      wx.showToast({
        title: '游戏继续',
        icon: 'none'
      })
    }
  }

  /**
   * 开始助力流程
   */
  startBetting() {
    if (databus.gameState === 'idle') {
      if (!databus.selectedBall) {
        wx.showToast({
          title: '请先点击选择一个滚珠进行助力！',
          icon: 'none'
        })
        return
      }

      // 检查积分是否足够
      const hasEnoughScore = this.gameInfo.betOptions.some(amount => amount <= databus.score)
      if (!hasEnoughScore) {
        wx.showToast({
          title: '积分不足，请先领取积分！',
          icon: 'none'
        })
        return
      }

      this.startMapPreview()
    }
  }

  /**
   * 进入子游戏（通用入口）
   * @param {import('./game/subgames/subgame_base.js').default} subGameInstance
   */
  enterSubGame(subGameInstance) {
    //关闭著游戏音乐
    this.bgmAudio?.stop?.()
    // 退出引导/UI弹窗，避免叠加
    if (this.guide) this.guide.isActive = false
    if (this.gameInfo?.uiPositions) {
      this.gameInfo.uiPositions.menuModal.visible = false
      this.gameInfo.uiPositions.betModal.visible = false
      this.gameInfo.uiPositions.helpModal.visible = false
      this.gameInfo.uiPositions.resultModal.visible = false
    }

    // 标记状态（可选：保留原 gameState，但子游戏会覆盖 update/render）
    databus.gameState = 'subgame'

    this.subGame = subGameInstance
    this.lastFrameTime = 0
    this.subGame.init()

    // 让事件管理器把触摸转发给子游戏（如果支持）
    if (this.eventManager) {
      this.eventManager.setSubGame(this.subGame)
    }
  }

  /**
   * 退出子游戏，回到主游戏
   */
  exitSubGame() {
    if (!this.subGame) return

    try {
      this.subGame.destroy?.()
    } catch (e) {
      console.error('子游戏销毁失败:', e)
    }

    this.subGame = null
    this.lastFrameTime = 0

    // 恢复主游戏状态
    databus.gameState = 'idle'
    //恢复背景音乐
    this.bgmAudio?.play?.()
    if (this.eventManager) {
      this.eventManager.setSubGame(null)
    }
  }

  /**
   * 运行 AwesomeCat 子游戏（可在此处自由替换为你的子游戏实现）
   */
  startAwesomeCatGame() {
    const sub = new AwesomeCatGame({
      main: this,
      canvas: canvas,
      databus: databus,
      gameInfo: this.gameInfo,
      camera: camera
    })

    this.enterSubGame(sub)
  }

  /**
   * 运行旋转多米诺子游戏
   */
  startSpinDominoGame() {
    const sub = new SpinDominoGame({
      main: this,
      canvas: canvas,
      databus: databus,
      gameInfo: this.gameInfo,
      camera: camera
    })

    this.enterSubGame(sub)
  }

  /**
   * 领取积分
   */
  claimPoints() {
    if (this.gameInfo.claimPoints()) {
      // 领取成功
      wx.showToast({
        title: `领取成功！获得${this.gameInfo.claimAmount}积分`,
        icon: 'success'
      })
    } else {
      // 领取失败（冷却中）
      const remainingTime = this.gameInfo.claimCooldown - (Date.now() - this.gameInfo.lastClaimTime)
      const seconds = Math.ceil(remainingTime / 1000)

      wx.showToast({
        title: `冷却时间未到，还需${seconds}秒`,
        icon: 'none'
      })
    }
  }

  /**
   * 重新开始游戏
   */
  restartGame() {
    databus.gameState = 'idle'
    databus.selectedBall = null
    databus.betAmount = 0
    this.gameInfo.selectedBall = null
    this.gameInfo.betAmount = 0

    this.gameInfo.uiPositions.menuModal.visible = false
    this.gameInfo.uiPositions.betModal.visible = false
    this.gameInfo.uiPositions.helpModal.visible = false
    this.gameInfo.uiPositions.resultModal.visible = false

    this.initGameObjects()

    wx.showToast({
      title: '游戏已重置',
      icon: 'success'
    })
  }
}

// InputManager 类保持不变
class InputManager {
  constructor() {
    this.isKeyboardShowing = false
    this.currentValue = ''
  }

  showInput(initialValue = '', callback) {
    wx.showKeyboard({
      defaultValue: initialValue,
      maxLength: 10,
      multiple: false,
      confirmHold: false,
      confirmType: 'done',
      success: (res) => {
        this.isKeyboardShowing = true
      }
    })

    wx.onKeyboardInput((res) => {
      this.currentValue = res.value
    })

    wx.onKeyboardConfirm((res) => {
      callback && callback(this.currentValue)
      this.hideInput()
    })

    wx.onKeyboardComplete((res) => {
      this.hideInput()
    })
  }

  hideInput() {
    this.isKeyboardShowing = false
    wx.hideKeyboard()
    wx.offKeyboardInput()
    wx.offKeyboardConfirm()
    wx.offKeyboardComplete()
  }
}