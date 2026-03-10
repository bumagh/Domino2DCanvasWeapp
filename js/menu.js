/**
 * 菜单场景类
 * 用于显示主菜单界面，包含用户信息、功能按钮等
 */

export default class Menu {
  constructor(databus, userInfo) {
    this.databus = databus
    this.userInfo = userInfo
    
    // 刘海屏安全区域偏移量
    this.safeAreaTop = 50
    
    // UI位置配置（已适配刘海屏）
    this.uiPositions = {
      // 顶部栏
      settingsButton: { x: 20, y: 170, width: 60, height: 30 },
      mailButton: { x: 320, y: 170, width: 60, height: 30 },
      
      // 用户信息区域
      avatarArea: { x: 180, y: 270, size: 60 },
      userInfo: { x: 180, y: 340 },
      
      // 主要功能按钮
      startGameButton: { x: 130, y: 400, width: 140, height: 50 },
      quickChallengeButton: { x: 130, y: 460, width: 140, height: 50 },
      collectionButton: { x: 130, y: 520, width: 140, height: 50 },
      creativeWorkshopButton: { x: 130, y: 580, width: 140, height: 50 },
      myStudioButton: { x: 130, y: 640, width: 140, height: 50 },
      
      // 底部导航栏
      navButtons: {
        task: { x: 50, y: 720, width: 70, height: 40 },
        shop: { x: 145, y: 720, width: 70, height: 40 },
        friends: { x: 240, y: 720, width: 70, height: 40 },
        ranking: { x: 335, y: 720, width: 70, height: 40 }
      },
      
      // 每日签到区域
      dailySignIn: { x: 130, y: 780, width: 140, height: 60 }
    }
    
    // 按钮状态
    this.buttonStates = {
      startGame: { hovered: false, pressed: false },
      quickChallenge: { hovered: false, pressed: false },
      collection: { hovered: false, pressed: false },
      creativeWorkshop: { hovered: false, pressed: false },
      myStudio: { hovered: false, pressed: false },
      task: { hovered: false, pressed: false },
      shop: { hovered: false, pressed: false },
      friends: { hovered: false, pressed: false },
      ranking: { hovered: false, pressed: false },
      dailySignIn: { hovered: false, pressed: false }
    }
    
    // 每日签到数据
    this.dailySignInData = {
      consecutiveDays: 5,
      isSignedToday: true,
      rewards: [10, 15, 20, 25, 30, 35, 40] // 连续签到奖励
    }
    
    // 动画相关
    this.animations = {
      avatarRotation: 0,
      buttonScale: {},
      particles: []
    }
  }

  /**
   * 更新菜单逻辑
   */
  update(deltaTime) {
    // 更新头像旋转动画
    // this.animations.avatarRotation += 0.01
    
    // 更新按钮缩放动画
    for (let buttonName in this.buttonStates) {
      const state = this.buttonStates[buttonName]
      if (state.hovered) {
        this.animations.buttonScale[buttonName] = Math.min(1.1, this.animations.buttonScale[buttonName] || 1)
      } else {
        this.animations.buttonScale[buttonName] = Math.max(1, this.animations.buttonScale[buttonName] || 1)
      }
    }
    
    // 更新粒子效果
    this.updateParticles()
  }

  /**
   * 渲染菜单界面
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!ctx) return
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    
    // 绘制背景
    this.drawBackground(ctx, canvasWidth, canvasHeight)
    
    // 绘制标题区域（新增）
    this.drawTitleArea(ctx, canvasWidth)
    
    // 绘制装饰骨牌动画（新增）
    this.drawMenuDominoes(ctx, canvasWidth)
    
    // 绘制顶部栏
    this.drawTopBar(ctx, canvasWidth)
    
    // 绘制用户信息区域
    this.drawUserInfo(ctx)
    
    // 绘制主要功能按钮
    this.drawMainButtons(ctx)
    
    // 绘制底部导航栏
    this.drawBottomNavigation(ctx)
    
    // 绘制每日签到区域
    this.drawDailySignIn(ctx)
    
    // 绘制粒子效果
    this.renderParticles(ctx)
  }

  /**
   * 绘制背景
   */
  drawBackground(ctx, width, height) {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f3460')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // 装饰性网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1
    for (let i = 0; i < width; i += 30) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i < height; i += 30) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }
    
    // 装饰性背景粒子
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    for (let i = 0; i < 25; i++) {
      const x = (i * 37 + Date.now() * 0.008) % width
      const y = (i * 53) % height
      const size = 2 + (i % 3)
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 绘制顶部栏
   */
  drawTopBar(ctx, canvasWidth) {
    // 设置按钮
    this.drawTopBarButton(ctx, '⚙️', this.uiPositions.settingsButton)
    
    // 邮件按钮
    this.drawTopBarButton(ctx, '📧', this.uiPositions.mailButton)
    
    // 如果有未读邮件，显示红点
    if (this.hasUnreadMail()) {
      ctx.fillStyle = '#ff4444'
      ctx.beginPath()
      ctx.arc(this.uiPositions.mailButton.x + this.uiPositions.mailButton.width - 5, 
              this.uiPositions.mailButton.y + 5, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 绘制顶部栏按钮
   */
  drawTopBarButton(ctx, icon, position) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(position.x, position.y, position.width, position.height)
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.strokeRect(position.x, position.y, position.width, position.height)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, position.x + position.width / 2, position.y + position.height / 2)
  }

  /**
   * 绘制标题区域（新增）
   */
  drawTitleArea(ctx, canvasWidth) {
    const centerX = canvasWidth / 2
    const offsetY = this.safeAreaTop  // 刘海屏偏移
    
    // 主标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 42px Arial'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 20
    ctx.fillText('🎯 多米诺骨牌', centerX, 55 + offsetY)
    ctx.shadowBlur = 0
    
    // 副标题
    ctx.fillStyle = '#e0e0e0'
    ctx.font = '16px Arial'
    ctx.fillText('摆放骨牌，创造连锁反应！', centerX, 85 + offsetY)
    
    // 装饰分隔线
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX - 100, 105 + offsetY)
    ctx.lineTo(centerX + 100, 105 + offsetY)
    ctx.stroke()
  }
  
  /**
   * 绘制装饰骨牌动画（新增）
   */
  drawMenuDominoes(ctx, canvasWidth) {
    const colors = ['#ff6b6b', '#4ecdc4', '#f9ca24', '#6ab04c', '#e056fd']
    const time = Date.now() * 0.001
    const centerX = canvasWidth / 2
    const offsetY = this.safeAreaTop  // 刘海屏偏移
    
    for (let i = 0; i < 5; i++) {
      ctx.save()
      const baseX = centerX - 80 + i * 40
      const baseY = 145 + offsetY
      const angle = Math.sin(time + i * 0.5) * 0.1 + i * 0.1
      
      ctx.translate(baseX, baseY)
      ctx.rotate(angle)
      
      // 骨牌阴影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(-3, -28, 8, 32)
      
      // 骨牌主体
      ctx.fillStyle = colors[i % colors.length]
      ctx.fillRect(-5, -30, 10, 35)
      
      // 骨牌高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(-5, -30, 3, 35)
      
      // 骨牌边框
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.strokeRect(-5, -30, 10, 35)
      
      // 骨牌点数装饰
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(0, -18, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, -8, 2, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    }
  }

  /**
   * 绘制用户信息区域
   */
  drawUserInfo(ctx) {
    const { avatarArea, userInfo } = this.uiPositions
    
    // 绘制头像背景圆圈
    ctx.save()
    ctx.translate(avatarArea.x, avatarArea.y)
    ctx.rotate(this.animations.avatarRotation)
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.arc(0, 0, avatarArea.size / 2, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 绘制头像或默认图标
    if (this.userInfo?.profile?.avatarUrl) {
      ctx.fillStyle = '#666666'
      ctx.font = '30px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('👤', 0, 0)
    } else {
      ctx.fillStyle = '#666666'
      ctx.font = '30px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('👤', 0, 0)
    }
    
    ctx.restore()
    
    // 绘制等级徽章
    const level = this.userInfo?.getLevel() || { level: 1, name: '新手', color: '#888888' }
    ctx.fillStyle = level.color
    ctx.fillRect(avatarArea.x + avatarArea.size / 2 - 20, avatarArea.y + avatarArea.size / 2 - 20, 40, 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Lv.${level.level}`, avatarArea.x + avatarArea.size / 2, avatarArea.y + avatarArea.size / 2 - 10)
    
    // 绘制用户名
    const nickname = this.userInfo?.profile?.nickName || '游客'
    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(nickname, userInfo.x, userInfo.y)
    
    // 绘制积分信息
    const score = this.userInfo?.score || 0
    ctx.fillStyle = '#00ffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`💎 ${score}`, userInfo.x - 60, userInfo.y + 25)
    
    // 这里可以添加其他货币显示
    ctx.fillStyle = '#ffd700'
    ctx.fillText(`🪙 4567`, userInfo.x + 20, userInfo.y + 25)
  }

  /**
   * 绘制主要功能按钮
   */
  drawMainButtons(ctx) {
    const buttons = [
      { key: 'startGame', text: '📖 关卡模式', pos: this.uiPositions.startGameButton, color1: '#4CAF50', color2: '#388E3C' },
      { key: 'quickChallenge', text: '🎮 自由模式', pos: this.uiPositions.quickChallengeButton, color1: '#2196F3', color2: '#1565C0' },
      { key: 'collection', text: '我的图鉴', pos: this.uiPositions.collectionButton },
      { key: 'creativeWorkshop', text: '创意工坊', pos: this.uiPositions.creativeWorkshopButton },
      { key: 'myStudio', text: '我的工作室', pos: this.uiPositions.myStudioButton }
    ]
    
    buttons.forEach(button => {
      if (button.color1) {
        this.drawColoredButton(ctx, button.text, button.pos, this.buttonStates[button.key], button.color1, button.color2)
      } else {
        this.drawMainButton(ctx, button.text, button.pos, this.buttonStates[button.key], this.animations.buttonScale[button.key] || 1)
      }
    })
  }
  
  /**
   * 绘制彩色按钮（新增）
   */
  drawColoredButton(ctx, text, position, state, color1, color2) {
    const centerX = position.x + position.width / 2
    const centerY = position.y + position.height / 2
    
    // 按钮渐变背景
    const gradient = ctx.createLinearGradient(position.x, position.y, position.x, position.y + position.height)
    gradient.addColorStop(0, color1)
    gradient.addColorStop(1, color2)
    ctx.fillStyle = gradient
    
    // 圆角矩形
    const radius = 8
    ctx.beginPath()
    ctx.moveTo(position.x + radius, position.y)
    ctx.lineTo(position.x + position.width - radius, position.y)
    ctx.quadraticCurveTo(position.x + position.width, position.y, position.x + position.width, position.y + radius)
    ctx.lineTo(position.x + position.width, position.y + position.height - radius)
    ctx.quadraticCurveTo(position.x + position.width, position.y + position.height, position.x + position.width - radius, position.y + position.height)
    ctx.lineTo(position.x + radius, position.y + position.height)
    ctx.quadraticCurveTo(position.x, position.y + position.height, position.x, position.y + position.height - radius)
    ctx.lineTo(position.x, position.y + radius)
    ctx.quadraticCurveTo(position.x, position.y, position.x + radius, position.y)
    ctx.closePath()
    ctx.fill()
    
    // 按钮边框高光
    ctx.strokeStyle = state.hovered ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 按钮文字
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, centerX, centerY)
  }

  /**
   * 绘制主要按钮
   */
  drawMainButton(ctx, text, position, state, scale = 1) {
    const centerX = position.x + position.width / 2
    const centerY = position.y + position.height / 2
    
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    ctx.translate(-centerX, -centerY)
    
    // 按钮背景
    const gradient = ctx.createLinearGradient(position.x, position.y, position.x, position.y + position.height)
    if (state.pressed) {
      gradient.addColorStop(0, '#2a2a4a')
      gradient.addColorStop(1, '#1a1a3a')
    } else if (state.hovered) {
      gradient.addColorStop(0, '#3a3a5a')
      gradient.addColorStop(1, '#2a2a4a')
    } else {
      gradient.addColorStop(0, '#2a2a4a')
      gradient.addColorStop(1, '#1a1a3a')
    }
    
    ctx.fillStyle = gradient
    ctx.fillRect(position.x, position.y, position.width, position.height)
    
    // 按钮边框
    ctx.strokeStyle = state.hovered ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(position.x, position.y, position.width, position.height)
    
    // 按钮文字
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, centerX, centerY)
    
    ctx.restore()
  }

  /**
   * 绘制底部导航栏
   */
  drawBottomNavigation(ctx) {
    const navButtons = [
      { key: 'task', text: '任务', icon: '📋', pos: this.uiPositions.navButtons.task },
      { key: 'shop', text: '商店', icon: '🛒', pos: this.uiPositions.navButtons.shop },
      { key: 'friends', text: '好友', icon: '👥', pos: this.uiPositions.navButtons.friends },
      { key: 'ranking', text: '排行', icon: '🏆', pos: this.uiPositions.navButtons.ranking }
    ]
    
    navButtons.forEach(button => {
      this.drawNavButton(ctx, button.text, button.icon, button.pos, this.buttonStates[button.key])
    })
  }

  /**
   * 绘制导航按钮
   */
  drawNavButton(ctx, text, icon, position, state) {
    // 按钮背景
    ctx.fillStyle = state.hovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(position.x, position.y, position.width, position.height)
    
    // 图标
    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, position.x + position.width / 2, position.y + position.height / 2 - 5)
    
    // 文字
    ctx.font = '10px Arial'
    ctx.fillText(text, position.x + position.width / 2, position.y + position.height / 2 + 12)
  }

  /**
   * 绘制每日签到区域
   */
  drawDailySignIn(ctx) {
    const { dailySignIn } = this.uiPositions
    const data = this.dailySignInData
    
    // 背景框
    ctx.fillStyle = data.isSignedToday ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(dailySignIn.x, dailySignIn.y, dailySignIn.width, dailySignIn.height)
    
    ctx.strokeStyle = data.isSignedToday ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(dailySignIn.x, dailySignIn.y, dailySignIn.width, dailySignIn.height)
    
    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('每日签到', dailySignIn.x + dailySignIn.width / 2, dailySignIn.y + 20)
    
    // 签到状态
    ctx.font = '12px Arial'
    if (data.isSignedToday) {
      ctx.fillStyle = '#00ff00'
      ctx.fillText(`连续登录第${data.consecutiveDays}天✅`, dailySignIn.x + dailySignIn.width / 2, dailySignIn.y + 40)
    } else {
      ctx.fillStyle = '#ffff00'
      ctx.fillText(`连续登录第${data.consecutiveDays}天`, dailySignIn.x + dailySignIn.width / 2, dailySignIn.y + 40)
    }
  }

  /**
   * 处理鼠标移动事件
   */
  handleMouseMove(x, y) {
    // 重置所有按钮状态
    for (let buttonName in this.buttonStates) {
      this.buttonStates[buttonName].hovered = false
    }
    
    // 检查鼠标悬停
    this.checkButtonHover(x, y)
  }

  /**
   * 检查按钮悬停状态
   */
  checkButtonHover(x, y) {
    // 检查主要按钮
    const mainButtons = [
      { key: 'startGame', pos: this.uiPositions.startGameButton },
      { key: 'quickChallenge', pos: this.uiPositions.quickChallengeButton },
      { key: 'collection', pos: this.uiPositions.collectionButton },
      { key: 'creativeWorkshop', pos: this.uiPositions.creativeWorkshopButton },
      { key: 'myStudio', pos: this.uiPositions.myStudioButton }
    ]
    
    mainButtons.forEach(button => {
      if (this.isPointInButton(x, y, button.pos)) {
        this.buttonStates[button.key].hovered = true
      }
    })
    
    // 检查导航按钮
    for (let navKey in this.uiPositions.navButtons) {
      if (this.isPointInButton(x, y, this.uiPositions.navButtons[navKey])) {
        this.buttonStates[navKey].hovered = true
      }
    }
    
    // 检查每日签到
    if (this.isPointInButton(x, y, this.uiPositions.dailySignIn)) {
      this.buttonStates.dailySignIn.hovered = true
    }
  }

  /**
   * 处理鼠标点击事件
   */
  handleClick(x, y) {
    // 检查主要按钮点击
    if (this.isPointInButton(x, y, this.uiPositions.startGameButton)) {
      return 'startGame'
    }
    if (this.isPointInButton(x, y, this.uiPositions.quickChallengeButton)) {
      return 'quickChallenge'
    }
    if (this.isPointInButton(x, y, this.uiPositions.collectionButton)) {
      return 'collection'
    }
    if (this.isPointInButton(x, y, this.uiPositions.creativeWorkshopButton)) {
      return 'creativeWorkshop'
    }
    if (this.isPointInButton(x, y, this.uiPositions.myStudioButton)) {
      return 'myStudio'
    }
    
    // 检查导航按钮点击
    if (this.isPointInButton(x, y, this.uiPositions.navButtons.task)) {
      return 'task'
    }
    if (this.isPointInButton(x, y, this.uiPositions.navButtons.shop)) {
      return 'shop'
    }
    if (this.isPointInButton(x, y, this.uiPositions.navButtons.friends)) {
      return 'friends'
    }
    if (this.isPointInButton(x, y, this.uiPositions.navButtons.ranking)) {
      return 'ranking'
    }
    
    // 检查每日签到点击
    if (this.isPointInButton(x, y, this.uiPositions.dailySignIn)) {
      return this.handleDailySignIn()
    }
    
    // 检查顶部按钮
    if (this.isPointInButton(x, y, this.uiPositions.settingsButton)) {
      return 'settings'
    }
    if (this.isPointInButton(x, y, this.uiPositions.mailButton)) {
      return 'mail'
    }
    
    return null
  }

  /**
   * 处理每日签到
   */
  handleDailySignIn() {
    if (!this.dailySignInData.isSignedToday) {
      this.dailySignInData.isSignedToday = true
      this.dailySignInData.consecutiveDays++
      
      // 发放奖励
      const reward = this.dailySignInData.rewards[Math.min(this.dailySignInData.consecutiveDays - 1, 6)]
      if (this.userInfo) {
        this.userInfo.addScore(reward)
      }
      
      // 添加签到成功特效
      this.spawnSignInParticles()
      
      return 'dailySignInSuccess'
    }
    return 'dailySignInAlready'
  }

  /**
   * 检查点是否在按钮内
   */
  isPointInButton(x, y, button) {
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height
  }

  /**
   * 检查是否有未读邮件
   */
  hasUnreadMail() {
    // 这里可以检查实际的邮件数据
    return Math.random() > 0.5 // 模拟随机未读邮件
  }

  /**
   * 生成签到粒子特效
   */
  spawnSignInParticles() {
    const { dailySignIn } = this.uiPositions
    const centerX = dailySignIn.x + dailySignIn.width / 2
    const centerY = dailySignIn.y + dailySignIn.height / 2
    
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      const speed = 2 + Math.random() * 3
      this.animations.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: `hsl(${120 + Math.random() * 60}, 100%, 50%)`
      })
    }
  }

  /**
   * 更新粒子效果
   */
  updateParticles() {
    for (let i = this.animations.particles.length - 1; i >= 0; i--) {
      const particle = this.animations.particles[i]
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.2 // 重力
      particle.life--
      
      if (particle.life <= 0) {
        this.animations.particles.splice(i, 1)
      }
    }
  }

  /**
   * 渲染粒子效果
   */
  renderParticles(ctx) {
    this.animations.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife
      ctx.fillStyle = particle.color.replace('50%)', `50%, ${alpha})`)
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  /**
   * 重置菜单状态
   */
  reset() {
    for (let buttonName in this.buttonStates) {
      this.buttonStates[buttonName].hovered = false
      this.buttonStates[buttonName].pressed = false
    }
    this.animations.particles = []
  }
}
