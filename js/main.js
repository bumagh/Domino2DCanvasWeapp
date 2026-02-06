import './render.js';
import DataBus from './databus.js'
import Camera from './game/camera.js'
import GameInfo from './game/gameinfo.js'
import Background from './game/background.js'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render.js';
import EventManager from './game/eventmanager.js'  // 导入事件管理器
import UserInfo from './userinfo.js'
import Menu from './menu.js'

// 子游戏（模块化）
import DominoChainGame from './game/subgames/domino_chain_game.js'

const ctx = canvas.getContext('2d')
const databus = new DataBus()

let camera = null

/**
 * 游戏主函数
 */
export default class Main {
  aniId = 0 // 用于存储动画帧的ID
  bg = null // 背景实例
  gameInfo = null // 游戏UI实例
  guide = null  // 新手引导
  eventManager = null  // 事件管理器
  userInfo = null  // 用户信息实例
  menu = null  // 菜单实例

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
    this.userInfo = new UserInfo(databus)
    this.menu = new Menu(databus, this.userInfo)
    this.gameInfo = new GameInfo(databus, this.userInfo)
    camera = new Camera(canvas.width, canvas.height, databus.mapHeight)

    // 让子游戏可以复用主画布上下文
    this.ctx = ctx
    this.canvas = canvas

    // 初始化新手引导

    const that = this;
    // 初始化事件管理器
    this.eventManager = new EventManager({
      main: that,
      canvas: canvas,
      databus: databus,
      gameInfo: that.gameInfo,
      camera: camera,
      guide: null,
      menu: that.menu
    });

    this.eventManager.init()
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

    // 更新菜单
    if (this.menu && typeof this.menu.update === 'function') {
      this.menu.update(16) // 传入deltaTime
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

    // 根据游戏状态渲染不同内容
    if (databus.gameState === 'menu') {
      // 菜单状态：渲染菜单界面
      if (this.menu && typeof this.menu.render === 'function') {
        this.menu.render(ctx, canvas.width, canvas.height)
      }
    } else {
      // 游戏状态：渲染游戏界面
      // 绘制背景
      this.bg.render(ctx, camera.offsetY)

      // 绘制游戏UI
      if (this.gameInfo && typeof this.gameInfo.render === 'function') {
        this.gameInfo.render(ctx, canvas.width, canvas.height)
      }

      // 绘制用户信息
      if (this.userInfo && typeof this.userInfo.render === 'function') {
        this.userInfo.render(ctx, canvas.width, canvas.height)
      }
    }
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
    // 从菜单状态切换到游戏状态
    databus.gameState = 'idle'
    
    try {
      wx.requirePrivacyAuthorize({
        success: res => {
          // 非标准API的方式处理用户个人信息
          console.log('隐私授权成功', res)
          wx.getSetting({
            success(res) {
              if (res.authSetting['scope.userInfo'] === true) {
                wx.getUserInfo({
                  success: (res) => {
                    // 已经授权，直接获取用户信息
                    console.log(res);
                      wx.setStorageSync('userInfo', res.userInfo);
                  },
                });
              } else {
                const button = wx.createUserInfoButton({
                  type: 'text',
                  text: '获取用户信息',
                  style: {
                    left: 10,
                    top: 76,
                    width: 200,
                    height: 40,
                    lineHeight: 40,
                    backgroundColor: '#ff0000',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontSize: 16,
                    borderRadius: 4
                  }
                });
                button.onTap((res) => {
                  if (res.errMsg.indexOf(':ok') > -1 && !!res.rawData) {
                    // 获取用户信息
                    console.log(res);
                    wx.setStorageSync('userInfo', res.userInfo);
                  }
                });
              }
            },
          });
        },
        fail: (e) => {
          console.log('隐私授权失败', e)
        },
        complete: (e) => {
          console.log('隐私授权完成', e)
          if (e.errno == 104) {
            // 如果用户拒绝了隐私授权，这里会执行
            wx.showToast({
              title: '需要隐私授权才能继续游戏',
              icon: 'none'
            })
            //使用游客信息体验
          }
        }
      });
    } catch (error) {
      console.error('隐私授权异常', error)
    }

    // if (databus.gameState === 'idle') {
    //   if (!databus.selectedBall) {
    //     wx.showToast({
    //       title: '请先点击选择一个滚珠进行助力！',
    //       icon: 'none'
    //     })
    //     return
    //   }

    //   // 检查积分是否足够
    //   const hasEnoughScore = this.gameInfo.betOptions.some(amount => amount <= databus.score)
    //   if (!hasEnoughScore) {
    //     wx.showToast({
    //       title: '积分不足，请先领取积分！',
    //       icon: 'none'
    //     })
    //     return
    //   }

    //   this.startMapPreview()
    // }
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

    // 恢复菜单状态
    databus.gameState = 'menu'
    //恢复背景音乐
    this.bgmAudio?.play?.()
    if (this.eventManager) {
      this.eventManager.setSubGame(null)
    }
  }

  /**
   * 运行多米诺连锁游戏
   */
  startDominoChainGame() {
    const sub = new DominoChainGame({
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

