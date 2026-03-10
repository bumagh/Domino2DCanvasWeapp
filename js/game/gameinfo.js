/**
 * 游戏信息显示类
 */
export default class GameInfo {
  constructor(databus, userInfo = null) {
    this.databus = databus; // 添加databus引用
    this.userInfo = userInfo; // 添加userInfo引用
    this.score = userInfo ? userInfo.score : (databus.score || 10)
    this.betAmount = 0
    this.selectedBall = null
    this.gameState = 'idle' // idle, preview, betting, running, paused, finished

     // ===== 本局统计（投入/获得）=====
     this.roundBetPoints = 0
     this.roundWinPoints = 0
 
     // ===== 结果粒子特效 =====
     this._particles = []
     this._particleBurstDone = false
    // 可选择的积分选项
    this.betOptions = [1, 2, 4, 8]
    // UI元素位置
    this.uiPositions = {
      // 状态栏（只显示积分）
      score: { x: 200, y: 120 },
      menuButton: { x: 20, y: 150, width: 80, height: 40 },
      startGameButton: { x: 110, y: 300, width: 140, height: 80 },//快速开始游戏按钮，放在屏幕中间
      awesomeCatGameButton: { x: 110, y: 400, width: 140, height: 80 },//多米诺连锁游戏按钮
      // 菜单弹窗
      menuModal: {
        visible: false,
        buttons: {
          claim: { x: 0, y: 0, width: 200, height: 50 },
          start: { x: 0, y: 60, width: 200, height: 50 },
          pause: { x: 0, y: 120, width: 200, height: 50 },
          restart: { x: 0, y: 180, width: 200, height: 50 },
          help: { x: 0, y: 240, width: 200, height: 50 },
          closeMenu: { x: 0, y: 300, width: 200, height: 50 }
        }
      },

      // 助力弹窗
      betModal: {
        visible: false
      },

      // 帮助弹窗
      helpModal: {
        visible: false,
        modalWidth: 400,
        modalHeight: 320,
        closeButton: {
          x: 0, // 会在绘制时计算
          y: 0, // 会在绘制时计算
          width: 200,
          height: 40
        }
      },

      // 结果弹窗
      resultModal: {
        visible: false,
        ranking: []
      }
    }

    // 当前选中的菜单项
    this.selectedMenuItem = null
    // 冷却时间相关
    this.lastClaimTime = databus.lastClaimTime || 0
    this.claimCooldown = databus.claimCooldown || 1800 // 30秒冷却
    this.claimAmount = databus.claimAmount || 10 // 每次领取的积分
    // 确保 betOptions 存在
    if (!this.betOptions) {
      this.betOptions = [1, 2, 4, 8]
    }

    // ===== 本局统计（投入/获得） =====
    this.roundBetPoints = 0
    this.roundWinPoints = 0 // 可按"净获得"或"奖励获得"存；由外部结算逻辑传入
    this._lastRoundSummary = null

    // ===== 结果粒子特效 =====
    this._particles = []
    this._particleBurstDone = false
  }

  /**
   * 更新积分显示
   */
  updateScore(score) {
    this.score = score
  }
  /**
 * 格式化时间为分:秒
 */
  formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  /**
  * 获取领取按钮的显示文字
  */
  getClaimButtonText() {
    if (!this.lastClaimTime) {
      return '领取积分'
    }

    const currentTime = Date.now()
    const timeSinceLastClaim = currentTime - this.lastClaimTime
    const remainingTime = this.claimCooldown - timeSinceLastClaim

    if (remainingTime <= 0) {
      return '领取积分'
    } else {
      // 格式化为秒，保留1位小数
      const minutesText = Math.floor(remainingTime / 60000)
      const secondsText = Math.ceil((remainingTime % 60000) / 1000)
      return `领取冷却中(${minutesText}分${secondsText}秒)`
    }
  }


  /**
   * 获取剩余冷却时间（毫秒）
   */
  getRemainingCooldown() {
    if (!this.lastClaimTime) {
      return 0
    }

    const currentTime = Date.now()
    const timeSinceLastClaim = currentTime - this.lastClaimTime
    const remainingTime = this.claimCooldown - timeSinceLastClaim

    return Math.max(0, remainingTime)
  }
  /**
   * 检查是否可领取积分
   */
  canClaimPoints() {
    if (!this.lastClaimTime) {
      return true
    }

    const currentTime = Date.now()
    const timeSinceLastClaim = currentTime - this.lastClaimTime
    return timeSinceLastClaim >= this.claimCooldown
  }

  /**
  * 领取积分
  */
  claimPoints() {
    if (!this.canClaimPoints()) {
      return false
    }

    this.score += this.claimAmount
    this.lastClaimTime = Date.now()

    // 更新databus中的积分
    if (this.databus) {
      this.databus.score = this.score
      this.databus.lastClaimTime = this.lastClaimTime
    }

    // 更新UserInfo中的积分
    if (this.userInfo) {
      this.userInfo.updateScore(this.score)
    }

    return true
  }
  /**
   * 渲染游戏UI
   * @param {CanvasRenderingContext2D} ctx - canvas上下文
   * @param {number} canvasWidth - canvas宽度
   * @param {number} canvasHeight - canvas高度
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!ctx) return
    // 绘制状态栏背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.fillRect(0, 0, canvasWidth, 120)

    // 绘制积分
    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.fillText(`积分: ${this.score}`, this.uiPositions.score.x, this.uiPositions.score.y)

    // 绘制菜单按钮
    this.drawButton(ctx, '菜单', this.uiPositions.menuButton)

    // 绘制快速开始游戏按钮（仅在空闲状态显示）
    if (this.databus.gameState == 'idle') {
      
      this.drawButton(ctx, '开始游戏', this.uiPositions.startGameButton)
      this.drawButton(ctx, '多米诺连锁', this.uiPositions.awesomeCatGameButton)
    }

    // 绘制菜单弹窗
    if (this.uiPositions.menuModal.visible) {
      this.drawMenuModal(ctx, canvasWidth, canvasHeight)
    }

    // 绘制助力弹窗
    if (this.uiPositions.betModal.visible) {
      this.drawBetModal(ctx, canvasWidth, canvasHeight)
    }

    // 绘制帮助弹窗
    if (this.uiPositions.helpModal.visible) {
      this.drawHelpModal(ctx, canvasWidth, canvasHeight)
    }

       // 绘制结果弹窗
       if (this.uiPositions.resultModal.visible) {
        // 弹窗首次出现时触发一次粒子爆发
        if (!this._particleBurstDone) {
          this._spawnResultParticles(canvasWidth, canvasHeight)
          this._particleBurstDone = true
        }
 
        // 先画粒子，再画弹窗（粒子在弹窗后方更自然）
        this._updateParticles()
        this._renderParticles(ctx)
 
        this.drawResultModal(ctx, canvasWidth, canvasHeight)
      } else {
        // 弹窗关闭：允许下次再触发
        this._particleBurstDone = false
        this._particles.length = 0
      }
  }

  /**
 * 设置本局统计（在游戏结算时调用）
 * @param {number} betPoints 本局投入
 * @param {number} winPoints 本局获得（你可传"净变化"或"奖励获得"，自行统一）
 */
  setRoundSummary(betPoints = 0, winPoints = 0) {
    this.roundBetPoints = Number(betPoints) || 0
    this.roundWinPoints = Number(winPoints) || 0
  }

  /**
   * 开始新一局时可调用
   */
  resetRoundSummary() {
    this.roundBetPoints = 0
    this.roundWinPoints = 0
  }

  // ================= 粒子特效（结果弹窗）=================
  _spawnResultParticles(canvasWidth, canvasHeight) {
    const cx = canvasWidth / 2
    const cy = canvasHeight / 2

    const count = 80
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 4.5
      this._particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 1.5),
        r: 1.5 + Math.random() * 2.5,
        life: 40 + Math.floor(Math.random() * 40),
        maxLife: 80,
        color: `rgba(${200 + Math.floor(Math.random() * 55)}, ${140 + Math.floor(Math.random() * 115)}, ${20 + Math.floor(Math.random() * 60)}, 1)`
      })
    }
  }

  _updateParticles() {
    if (!this._particles || this._particles.length === 0) return

    const gravity = 0.08
    const damping = 0.99

    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i]
      p.vx *= damping
      p.vy = p.vy * damping + gravity
      p.x += p.vx
      p.y += p.vy
      p.life -= 1
      if (p.life <= 0) this._particles.splice(i, 1)
    }
  }

  _renderParticles(ctx) {
    if (!this._particles || this._particles.length === 0) return

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const p of this._particles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife))
      ctx.fillStyle = p.color.replace(', 1)', `, ${alpha})`)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  /**
   * 绘制按钮
   */
  drawButton(ctx, text, position, isSelected = false) {
    // 按钮背景
    ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(position.x, position.y, position.width, position.height)

    // 按钮边框
    ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'
    ctx.strokeRect(position.x, position.y, position.width, position.height)

    // 按钮文字
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, position.x + position.width / 2, position.y + position.height / 2)
  }

  /**
   * 绘制菜单弹窗
   */
  drawMenuModal(ctx, canvasWidth, canvasHeight) {
    const modalWidth = 240
    const modalHeight = 480
    const x = (canvasWidth - modalWidth) / 2
    const y = (canvasHeight - modalHeight) / 2

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
    ctx.fillRect(x, y, modalWidth, modalHeight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.strokeRect(x, y, modalWidth, modalHeight)

    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('游戏菜单', canvasWidth / 2, y + 35)

    // 更新按钮位置
    const buttons = this.uiPositions.menuModal.buttons
    buttons.claim.x = x + 20
    buttons.claim.y = y + 60
    buttons.start.x = x + 20
    buttons.start.y = y + 120
    buttons.pause.x = x + 20
    buttons.pause.y = y + 180
    buttons.restart.x = x + 20
    buttons.restart.y = y + 240
    buttons.help.x = x + 20
    buttons.help.y = y + 300
    buttons.closeMenu.x = x + 20
    buttons.closeMenu.y = y + 360
    const canClaim = this.canClaimPoints()
    const isSelected = this.selectedMenuItem === 'claim'
    // 绘制菜单按钮
    // 领取积分按钮（根据冷却状态显示不同颜色）
    if (canClaim) {
      // 可以领取时正常显示
      this.drawButton(ctx, '领取积分', buttons.claim, isSelected)
    } else {
      // 冷却中时显示灰色
      this.drawCoolingButton(ctx, this.getClaimButtonText(), buttons.claim, isSelected)
    }
    this.drawButton(ctx, '开始游戏', buttons.start, this.selectedMenuItem === 'start')

    // 根据游戏状态显示暂停/继续按钮文字
    const pauseText = this.gameState === 'running' ? '暂停游戏' : '继续游戏'
    this.drawButton(ctx, pauseText, buttons.pause, this.selectedMenuItem === 'pause')

    this.drawButton(ctx, '重新开始', buttons.restart, this.selectedMenuItem === 'restart')
    this.drawButton(ctx, '游戏帮助', buttons.help, this.selectedMenuItem === 'help')
    this.drawButton(ctx, '关闭菜单', buttons.closeMenu, this.selectedMenuItem === 'closeMenu')
  }
  /**
   * 绘制冷却中的按钮
   */
  drawCoolingButton(ctx, text, position, isSelected = false) {
    // 按钮背景（灰色表示不可用）
    ctx.fillStyle = isSelected ? 'rgba(100, 100, 100, 0.3)' : 'rgba(100, 100, 100, 0.2)'
    ctx.fillRect(position.x, position.y, position.width, position.height)

    // 按钮边框（灰色表示不可用）
    ctx.strokeStyle = isSelected ? 'rgba(150, 150, 150, 0.4)' : 'rgba(150, 150, 150, 0.2)'
    ctx.strokeRect(position.x, position.y, position.width, position.height)

    // 按钮文字（灰色表示不可用）
    ctx.fillStyle = '#aaaaaa'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, position.x + position.width / 2, position.y + position.height / 2)
  }
  /**
   * 绘制助力弹窗
   */
  drawBetModal(ctx, canvasWidth, canvasHeight) {
    const modalWidth = 320
    const modalHeight = 280
    const x = (canvasWidth - modalWidth) / 2
    const y = (canvasHeight - modalHeight) / 2

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
    ctx.fillRect(x, y, modalWidth, modalHeight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.strokeRect(x, y, modalWidth, modalHeight)

    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('选择助力积分', canvasWidth / 2, y + 40)

    // 当前积分显示
    ctx.fillStyle = '#ffff88'
    ctx.font = '16px Arial'
    ctx.fillText(`当前积分: ${this.score}`, canvasWidth / 2, y + 75)

    // 绘制积分选择按钮
    const buttonWidth = 60
    const buttonHeight = 50
    const gap = 20
    const totalWidth = this.betOptions.length * buttonWidth + (this.betOptions.length - 1) * gap
    const startX = x + (modalWidth - totalWidth) / 2

    this.betButtons = []
    this.betOptions.forEach((amount, index) => {
      const buttonX = startX + index * (buttonWidth + gap)
      const buttonY = y + 120

      // 检查积分是否足够
      const canBet = amount <= this.score

      // 按钮背景
      ctx.fillStyle = canBet ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 0, 0, 0.15)'
      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight)

      // 按钮边框
      ctx.strokeStyle = canBet ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 0, 0, 0.3)'
      ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight)

      // 按钮文字
      ctx.fillStyle = canBet ? '#ffffff' : '#ff6666'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(amount.toString(), buttonX + buttonWidth / 2, buttonY + buttonHeight / 2)

      // 保存按钮信息用于点击检测
      this.betButtons.push({
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        amount: amount,
        canBet: canBet
      })
    })

    // 确认和取消按钮
    const confirmButtonX = x + 20
    const confirmButtonY = y + 200
    const cancelButtonX = x + modalWidth - 120
    const cancelButtonY = y + 200
    const actionButtonWidth = 100
    const actionButtonHeight = 40

    // 确认按钮
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'
    ctx.fillRect(confirmButtonX, confirmButtonY, actionButtonWidth, actionButtonHeight)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'
    ctx.strokeRect(confirmButtonX, confirmButtonY, actionButtonWidth, actionButtonHeight)
    ctx.fillStyle = '#00ff00'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('确认', confirmButtonX + actionButtonWidth / 2, confirmButtonY + actionButtonHeight / 2)

    // 取消按钮
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'
    ctx.fillRect(cancelButtonX, cancelButtonY, actionButtonWidth, actionButtonHeight)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.strokeRect(cancelButtonX, cancelButtonY, actionButtonWidth, actionButtonHeight)
    ctx.fillStyle = '#ff6666'
    ctx.fillText('取消', cancelButtonX + actionButtonWidth / 2, cancelButtonY + actionButtonHeight / 2)

    // 保存按钮信息
    this.betButtons.push(
      {
        x: confirmButtonX,
        y: confirmButtonY,
        width: actionButtonWidth,
        height: actionButtonHeight,
        type: 'confirm'
      },
      {
        x: cancelButtonX,
        y: cancelButtonY,
        width: actionButtonWidth,
        height: actionButtonHeight,
        type: 'cancel'
      }
    )
  }

  /**
   * 处理助力弹窗点击
   */
  handleBetModalClick(x, y, canvasWidth, canvasHeight) {
    if (!this.uiPositions.betModal.visible) return null

    const modalWidth = 320
    const modalHeight = 280
    const modalX = (canvasWidth - modalWidth) / 2
    const modalY = (canvasHeight - modalHeight) / 2

    // 检查是否点击了按钮
    for (const button of this.betButtons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        if (button.type === 'confirm') {
          // 确认按钮
          const selectedAmount = this.betButtons.find(b => b.amount && b.canBet)?.amount
          if (selectedAmount) {
            this.uiPositions.betModal.visible = false
            return { type: 'bet', amount: selectedAmount }
          }
        } else if (button.type === 'cancel') {
          // 取消按钮
          this.uiPositions.betModal.visible = false
          return { type: 'cancel' }
        } else if (button.amount && button.canBet) {
          // 积分按钮
          this.selectedBetAmount = button.amount
        }
        
        break
      }
    }

    return null
  }

  /**
   * 绘制帮助弹窗
   */
  drawHelpModal(ctx, canvasWidth, canvasHeight) {
    const modal = this.uiPositions.helpModal
    const x = (canvasWidth - modal.modalWidth) / 2
    const y = (canvasHeight - modal.modalHeight) / 2

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
    ctx.fillRect(x, y, modal.modalWidth, modal.modalHeight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.strokeRect(x, y, modal.modalWidth, modal.modalHeight)

    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('游戏帮助', canvasWidth / 2, y + 40)

    // 帮助内容
    ctx.font = '16px Arial'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'

    const helpText = [
      '1. 点击滚珠选择你的幸运球',
      '2. 点击菜单选择助力积分',
      '3. 点击开始游戏开始挑战',
      '4. 滚珠掉落获得相应积分',
      '5. 积分可以用来助力下次游戏'
    ]

    helpText.forEach((text, index) => {
      ctx.fillText(text, x + 30, y + 80 + index * 30)
    })

    // 关闭按钮
    const closeButton = modal.closeButton
    closeButton.x = x + (modal.modalWidth - closeButton.width) / 2
    closeButton.y = y + modal.modalHeight - 60

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.strokeRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height)

    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('关闭', closeButton.x + closeButton.width / 2, closeButton.y + closeButton.height / 2)
  }

  /**
   * 绘制结果弹窗
   */
  drawResultModal(ctx, canvasWidth, canvasHeight) {
    const modalWidth = 400
    const modalHeight = 450  // 增加高度以容纳分享按钮
    const x = (canvasWidth - modalWidth) / 2
    const y = (canvasHeight - modalHeight) / 2

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
    ctx.fillRect(x, y, modalWidth, modalHeight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.strokeRect(x, y, modalWidth, modalHeight)

    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('游戏结束', canvasWidth / 2, y + 50)

    // 显示本局统计
    ctx.font = '20px Arial'
    ctx.fillStyle = '#ffff88'
    ctx.fillText(`本局投入: ${this.roundBetPoints} 积分`, canvasWidth / 2, y + 120)
    
    ctx.fillStyle = this.roundWinPoints >= 0 ? '#88ff88' : '#ff8888'
    ctx.fillText(`本局获得: ${this.roundWinPoints} 积分`, canvasWidth / 2, y + 160)

    const netChange = this.roundWinPoints - this.roundBetPoints
    ctx.fillStyle = netChange >= 0 ? '#88ff88' : '#ff8888'
    ctx.fillText(`净变化: ${netChange > 0 ? '+' : ''}${netChange} 积分`, canvasWidth / 2, y + 200)

    // 当前总积分
    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.fillText(`当前总积分: ${this.score}`, canvasWidth / 2, y + 250)

    // 分享按钮
    const shareButtonX = x + 100
    const shareButtonY = y + 290
    const shareButtonWidth = 200
    const shareButtonHeight = 50

    // 保存分享按钮位置用于点击检测
    this.uiPositions.resultModal.shareButton = {
      x: shareButtonX,
      y: shareButtonY,
      width: shareButtonWidth,
      height: shareButtonHeight
    }

    ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'
    ctx.fillRect(shareButtonX, shareButtonY, shareButtonWidth, shareButtonHeight)
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)'
    ctx.strokeRect(shareButtonX, shareButtonY, shareButtonWidth, shareButtonHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('📤 分享成绩', shareButtonX + shareButtonWidth / 2, shareButtonY + shareButtonHeight / 2 + 6)

    // 确认按钮（位置下移）
    const resultButtonX = x + 100
    const resultButtonY = y + 360
    const resultButtonWidth = 200
    const resultButtonHeight = 50

    // 保存确认按钮位置用于点击检测
    this.uiPositions.resultModal.retryButton = {
      x: resultButtonX,
      y: resultButtonY,
      width: resultButtonWidth,
      height: resultButtonHeight
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(resultButtonX, resultButtonY, resultButtonWidth, resultButtonHeight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.strokeRect(resultButtonX, resultButtonY, resultButtonWidth, resultButtonHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('确定', resultButtonX + resultButtonWidth / 2, resultButtonY + resultButtonHeight / 2 + 6)
  }

  /**
   * 处理菜单按钮点击
   */
  handleMenuButtonClick(x, y) {
    const button = this.uiPositions.menuButton
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height
  }

  /**
   * 处理开始游戏按钮点击
   */
  handleStartGameButtonClick(x, y) {
    const button = this.uiPositions.startGameButton
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height
  }

  /**
   * 处理多米诺连锁游戏按钮点击
   */
  handleDominoChainGameButtonClick(x, y) {
    const dominoChainGameButton = this.uiPositions.awesomeCatGameButton
    return this.isPointInButton(x, y, dominoChainGameButton)
  }

  /**
   * 处理菜单弹窗点击
   */
  handleMenuModalClick(x, y) {
    if (!this.uiPositions.menuModal.visible) return null

    const buttons = this.uiPositions.menuModal.buttons
    for (const [action, button] of Object.entries(buttons)) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        this.selectedMenuItem = action
        return action
      }
    }

    return null
  }

  /**
   * 处理结果弹窗点击
   * @returns {string|null} 'share' | 'retry' | null
   */
  handleResultModalClick(x, y) {
    if (!this.uiPositions.resultModal.visible) return null

    // 检查分享按钮点击
    const shareButton = this.uiPositions.resultModal.shareButton
    if (shareButton && this.isPointInButton(x, y, shareButton)) {
      return 'share'
    }

    // 检查确认按钮点击
    const retryButton = this.uiPositions.resultModal.retryButton
    if (retryButton && this.isPointInButton(x, y, retryButton)) {
      return 'retry'
    }

    return null
  }

  /**
   * 判断点是否在按钮内
   */
  isPointInButton(x, y, button) {
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height
  }
}
