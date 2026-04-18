/**
 * 菜单场景类
 * 用于显示主菜单界面，包含用户信息、功能按钮等
 */

export default class Menu {
  constructor(databus, userInfo, main = null, signInManager = null, taskManager = null, shopManager = null, settingsManager = null, announcementManager = null, inventoryManager = null, guideManager = null, tutorialManager = null, feedbackManager = null) {
    this.databus = databus
    this.userInfo = userInfo
    this.main = main  // 添加 main 引用，用于访问广告管理器
    this.signInManager = signInManager  // 添加签到管理器
    this.taskManager = taskManager  // 添加任务管理器
    this.shopManager = shopManager  // 添加商店管理器
    this.settingsManager = settingsManager  // 添加设置管理器
    this.announcementManager = announcementManager  // 添加公告管理器
    this.inventoryManager = inventoryManager  // 添加背包管理器
    this.guideManager = guideManager  // 添加引导管理器
    this.tutorialManager = tutorialManager  // 添加教程管理器
    this.feedbackManager = feedbackManager  // 添加反馈管理器

    // 刘海屏安全区域偏移量
    this.safeAreaTop = 50

    // 渲染性能优化
    this.dirtyRects = [] // 脏矩形列表
    this.lastRenderTime = 0
    this.renderThrottle = 16 // 16ms = ~60fps
    
    // UI位置配置（已适配刘海屏）
    this.uiPositions = {
      // 顶部栏
      settingsButton: { x: 20, y: 170, width: 60, height: 30 },
      mailButton: { x: 320, y: 170, width: 60, height: 30 },
      
      // 用户信息区域
      avatarArea: { x: 180, y: 270, size: 60 },
      userInfo: { x: 180, y: 340 },
      
      // 主要功能按钮（3行2列布局）
      startGameButton: { x: 50, y: 400, width: 140, height: 50 },
      quickChallengeButton: { x: 210, y: 400, width: 140, height: 50 },
      collectionButton: { x: 50, y: 480, width: 140, height: 50 },
      creativeWorkshopButton: { x: 210, y: 480, width: 140, height: 50 },
      myStudioButton: { x: 50, y: 560, width: 140, height: 50 },
      inventoryButton: { x: 210, y: 560, width: 140, height: 50 },
      
      // 底部导航栏
      navButtons: {
        task: { x: 50, y: 720, width: 70, height: 40 },
        shop: { x: 145, y: 720, width: 70, height: 40 },
        friends: { x: 240, y: 720, width: 70, height: 40 },
        ranking: { x: 335, y: 720, width: 70, height: 40 }
      },
      
      // 每日签到区域
      dailySignIn: { x: 130, y: 650, width: 140, height: 60 }
    }

    // 签到弹窗配置
    this.signInModal = {
      visible: false,
      position: { x: 30, y: 150, width: 340, height: 500 },
      closeButton: { x: 340, y: 160, width: 30, height: 30 },
      signInButton: { x: 130, y: 450, width: 140, height: 40 },
      rewardItems: [] // 将在初始化时计算
    }

    // 计算奖励项位置（两行布局）
    const rewards = this.signInManager ? this.signInManager.getSignInRewards() : []
    const itemWidth = 70
    const itemHeight = 80
    const gap = 15
    const startX = 50
    const startY = 200
    const cols = 4
    const rows = 2

    rewards.forEach((reward, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      this.signInModal.rewardItems.push({
        x: startX + col * (itemWidth + gap),
        y: startY + row * (itemHeight + gap),
        width: itemWidth,
        height: itemHeight,
        reward: reward
      })
    })

    // 任务弹窗配置
    this.taskModal = {
      visible: false,
      position: { x: 30, y: 100, width: 340, height: 550 },
      closeButton: { x: 340, y: 110, width: 30, height: 30 },
      tabDaily: { x: 50, y: 150, width: 140, height: 40 },
      tabAchievement: { x: 210, y: 150, width: 140, height: 40 },
      currentTab: 'daily', // daily 或 achievement
      taskItems: [] // 将在渲染时动态计算
    }

    // 商店弹窗配置
    this.shopModal = {
      visible: false,
      position: { x: 30, y: 100, width: 340, height: 550 },
      closeButton: { x: 340, y: 110, width: 30, height: 30 },
      tabItems: { x: 40, y: 150, width: 90, height: 35 },
      tabSkins: { x: 145, y: 150, width: 90, height: 35 },
      tabEffects: { x: 250, y: 150, width: 90, height: 35 },
      currentTab: 'items', // items, skins, effects
      productItems: [] // 将在渲染时动态计算
    }

    // 设置弹窗配置
    this.settingsModal = {
      visible: false,
      position: { x: 60, y: 150, width: 280, height: 400 },
      closeButton: { x: 310, y: 160, width: 30, height: 30 },
      settingItems: [] // 将在渲染时动态计算
    }

    // 公告弹窗配置
    this.announcementModal = {
      visible: false,
      position: { x: 30, y: 80, width: 340, height: 580 },
      closeButton: { x: 340, y: 90, width: 30, height: 30 },
      tabSystem: { x: 50, y: 140, width: 90, height: 35 },
      tabActivity: { x: 155, y: 140, width: 90, height: 35 },
      tabUpdate: { x: 260, y: 140, width: 90, height: 35 },
      currentTab: 'system', // system, activity, update
      announcementItems: [] // 将在渲染时动态计算
    }

    // 背包弹窗配置
    this.inventoryModal = {
      visible: false,
      position: { x: 30, y: 80, width: 340, height: 580 },
      closeButton: { x: 340, y: 90, width: 30, height: 30 },
      tabItems: { x: 40, y: 140, width: 90, height: 35 },
      tabSkins: { x: 145, y: 140, width: 90, height: 35 },
      tabEffects: { x: 250, y: 140, width: 90, height: 35 },
      currentTab: 'items', // items, skins, effects
      inventoryItems: [] // 将在渲染时动态计算
    }

    // 教程弹窗配置
    this.tutorialModal = {
      visible: false,
      position: { x: 30, y: 80, width: 340, height: 580 },
      closeButton: { x: 340, y: 90, width: 30, height: 30 },
      tutorialList: [] // 将在渲染时动态计算
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
      dailySignIn: { hovered: false, pressed: false },
      inventory: { hovered: false, pressed: false },
      tutorial: { hovered: false, pressed: false }
    }

    // 动画相关
    this.animations = {
      avatarRotation: 0,
      buttonScale: {},
      buttonOpacity: {},
      particles: [],
      animationStartTime: Date.now()
    }

    // 粒子对象池
    this.particlePool = []
    this.maxPoolSize = 100

    // 静态元素缓存
    this.staticCache = {
      background: null,
      title: null
    }
    this.needsCacheUpdate = true

    // 初始化按钮动画状态
    const buttonKeys = ['startGame', 'quickChallenge', 'collection', 'creativeWorkshop', 'myStudio', 'inventory']
    buttonKeys.forEach((key, index) => {
      this.animations.buttonScale[key] = 0
      this.animations.buttonOpacity[key] = 0
    })
  }

  /**
   * 更新菜单逻辑
   */
  update(deltaTime) {
    // 更新头像旋转动画
    // this.animations.avatarRotation += 0.01

    // 更新按钮入场动画
    const elapsed = Date.now() - this.animations.animationStartTime
    const buttonKeys = ['startGame', 'quickChallenge', 'collection', 'creativeWorkshop', 'myStudio', 'inventory']

    buttonKeys.forEach((key, index) => {
      const delay = index * 100 // 每个按钮延迟100ms
      const duration = 500 // 动画持续时间500ms
      const animationProgress = Math.max(0, Math.min(1, (elapsed - delay) / duration))

      // 使用easeOutBack缓动函数
      const easeOutBack = (t) => {
        const c1 = 1.70158
        const c3 = c1 + 1
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
      }

      const scale = easeOutBack(animationProgress)
      const opacity = animationProgress

      this.animations.buttonScale[key] = scale
      this.animations.buttonOpacity[key] = opacity
    })

    // 更新粒子效果
    this.updateParticles()
  }

  /**
   * 更新菜单动画
   */
  updateAnimations() {
    // 更新头像旋转动画
    this.animations.avatarRotation += 0.01

    // 更新按钮缩放动画（悬停效果）
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

    // 渲染节流（避免过度渲染）
    const now = Date.now()
    if (now - this.lastRenderTime < this.renderThrottle) {
      return
    }
    this.lastRenderTime = now

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

    // 绘制教程按钮
    this.drawTutorialButton(ctx)

    // 绘制签到弹窗
    if (this.signInModal.visible) {
      this.drawSignInModal(ctx)
    }

    // 绘制任务弹窗
    if (this.taskModal.visible) {
      this.drawTaskModal(ctx)
    }

    // 绘制商店弹窗
    if (this.shopModal.visible) {
      this.drawShopModal(ctx)
    }

    // 绘制设置弹窗
    if (this.settingsModal.visible) {
      this.drawSettingsModal(ctx)
    }

    // 绘制公告弹窗
    if (this.announcementModal.visible) {
      this.drawAnnouncementModal(ctx)
    }

    // 绘制背包弹窗
    if (this.inventoryModal.visible) {
      this.drawInventoryModal(ctx)
    }

    // 绘制新手引导
    if (this.guideManager) {
      this.guideManager.drawGuide(ctx, this.databus.canvasWidth, this.databus.canvasHeight)
    }

    // 绘制教程弹窗
    if (this.tutorialModal.visible) {
      if (this.tutorialManager) {
        this.tutorialManager.drawTutorialModal(ctx, this.databus.canvasWidth, this.databus.canvasHeight)
      }
    }

    // 绘制粒子效果
    this.renderParticles(ctx)

    // 绘制反馈效果
    if (this.feedbackManager) {
      this.feedbackManager.render(ctx)
    }
  }

  /**
   * 绘制背景
   */
  drawBackground(ctx, width, height) {
    // 使用缓存的背景（如果可用）
    if (this.staticCache.background && !this.needsCacheUpdate) {
      ctx.drawImage(this.staticCache.background, 0, 0)
      return
    }

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

    // 如果需要更新缓存，创建离屏canvas缓存背景
    if (this.needsCacheUpdate && typeof OffscreenCanvas !== 'undefined') {
      try {
        const offscreen = new OffscreenCanvas(width, height)
        const offCtx = offscreen.getContext('2d')
        offCtx.drawImage(ctx.canvas, 0, 0)
        this.staticCache.background = offscreen
        this.needsCacheUpdate = false
      } catch (e) {
        // OffscreenCanvas不支持，跳过缓存
      }
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
      { key: 'myStudio', text: '我的工作室', pos: this.uiPositions.myStudioButton },
      { key: 'inventory', text: '🎒 背包', pos: this.uiPositions.inventoryButton, color1: '#FF9800', color2: '#F57C00' }
    ]

    buttons.forEach(button => {
      // 添加入场动画
      const scale = this.animations.buttonScale[button.key] || 1
      const opacity = this.animations.buttonOpacity[button.key] || 1

      if (button.color1) {
        this.drawColoredButton(ctx, button.text, button.pos, this.buttonStates[button.key], button.color1, button.color2, scale, opacity)
      } else {
        this.drawMainButton(ctx, button.text, button.pos, this.buttonStates[button.key], scale, opacity)
      }
    })
  }
  
  /**
   * 绘制彩色按钮（新增）
   */
  drawColoredButton(ctx, text, position, state, color1, color2, scale = 1, opacity = 1) {
    const centerX = position.x + position.width / 2
    const centerY = position.y + position.height / 2

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    ctx.translate(-centerX, -centerY)
    
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
   * 绘制主按钮
   */
  drawMainButton(ctx, text, position, state, scale = 1, opacity = 1) {
    const centerX = position.x + position.width / 2
    const centerY = position.y + position.height / 2

    ctx.save()
    ctx.globalAlpha = opacity
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
    const status = this.signInManager ? this.signInManager.getSignInStatus() : null
    const currentReward = this.signInManager ? this.signInManager.getCurrentReward() : null

    if (!status || !currentReward) return

    // 背景框
    ctx.fillStyle = status.isSignedToday ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(dailySignIn.x, dailySignIn.y, dailySignIn.width, dailySignIn.height)

    ctx.strokeStyle = status.isSignedToday ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 215, 0, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(dailySignIn.x, dailySignIn.y, dailySignIn.width, dailySignIn.height)

    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('七日签到', dailySignIn.x + dailySignIn.width / 2, dailySignIn.y + 20)

    // 签到状态
    ctx.font = '12px Arial'
    if (status.isSignedToday) {
      ctx.fillStyle = '#00ff00'
      ctx.fillText(`已签到 第${status.consecutiveDays}天✅`, dailySignIn.x + dailySignIn.width / 2, dailySignIn.y + 40)
    } else {
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`签到+${currentReward.reward}积分`, dailySignIn.x + dailySignIn.width / 2, dailySignIn.y + 40)
    }
  }

  /**
   * 绘制七日签到弹窗
   */
  drawSignInModal(ctx) {
    const modal = this.signInModal
    const status = this.signInManager ? this.signInManager.getSignInStatus() : null

    // 全屏遮罩层（防止穿透）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 弹窗背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 边框
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('七日签到奖励', modal.position.x + modal.position.width / 2, modal.position.y + 30)

    // 关闭按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.fillText('✕', modal.closeButton.x + modal.closeButton.width / 2, modal.closeButton.y + modal.closeButton.height / 2)

    // 绘制七日奖励项
    modal.rewardItems.forEach((item, index) => {
      const dayIndex = status ? status.consecutiveDays % 7 : 0
      const isCurrentDay = index === dayIndex
      const isPastDay = status && index < dayIndex

      // 背景
      if (isPastDay) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'
      } else if (isCurrentDay) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      }
      ctx.fillRect(item.x, item.y, item.width, item.height)

      // 边框
      ctx.strokeStyle = isPastDay ? 'rgba(0, 255, 0, 0.5)' :
                        isCurrentDay ? 'rgba(255, 215, 0, 0.5)' :
                        'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = isCurrentDay ? 2 : 1
      ctx.strokeRect(item.x, item.y, item.width, item.height)

      // 天数
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`第${item.reward.day}天`, item.x + item.width / 2, item.y + 15)

      // 奖励图标
      ctx.font = '20px Arial'
      ctx.fillText(item.reward.icon, item.x + item.width / 2, item.y + 30)

      // 奖励数值
      ctx.font = 'bold 14px Arial'
      ctx.fillStyle = isPastDay ? '#00ff00' : '#FFD700'
      ctx.fillText(`${item.reward.reward}`, item.x + item.width / 2, item.y + 52)

      // 奖励类型文字
      ctx.font = '10px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('积分', item.x + item.width / 2, item.y + 70)
    })

    // 连续签到信息
    if (status) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px Arial'
      ctx.fillText(`已连续签到 ${status.consecutiveDays} 天`, modal.position.x + modal.position.width / 2, modal.position.y + 380)
      ctx.font = '12px Arial'
      ctx.fillStyle = '#aaaaaa'
      ctx.fillText(`累计签到 ${status.totalSignInDays} 天`, modal.position.x + modal.position.width / 2, modal.position.y + 400)
    }

    // 签到按钮
    if (status && status.canSignIn) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
      ctx.fillRect(modal.signInButton.x, modal.signInButton.y, modal.signInButton.width, modal.signInButton.height)
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
      ctx.lineWidth = 2
      ctx.strokeRect(modal.signInButton.x, modal.signInButton.y, modal.signInButton.width, modal.signInButton.height)
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 16px Arial'
      ctx.fillText('立即签到', modal.signInButton.x + modal.signInButton.width / 2, modal.signInButton.y + modal.signInButton.height / 2)
    } else if (status && status.isSignedToday) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'
      ctx.fillRect(modal.signInButton.x, modal.signInButton.y, modal.signInButton.width, modal.signInButton.height)
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'
      ctx.lineWidth = 2
      ctx.strokeRect(modal.signInButton.x, modal.signInButton.y, modal.signInButton.width, modal.signInButton.height)
      ctx.fillStyle = '#00ff00'
      ctx.font = 'bold 16px Arial'
      ctx.fillText('今日已签到', modal.signInButton.x + modal.signInButton.width / 2, modal.signInButton.y + modal.signInButton.height / 2)
    }
  }

  /**
   * 绘制任务弹窗
   */
  drawTaskModal(ctx) {
    const modal = this.taskModal
    const tasks = this.taskManager ? this.taskManager.getTasks(modal.currentTab) : []

    // 全屏遮罩层（防止穿透）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 弹窗背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 边框
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('任务中心', modal.position.x + modal.position.width / 2, modal.position.y + 30)

    // 关闭按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.fillText('✕', modal.closeButton.x + modal.closeButton.width / 2, modal.closeButton.y + modal.closeButton.height / 2)

    // 标签页
    const tabDailyColor = modal.currentTab === 'daily' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    const tabAchievementColor = modal.currentTab === 'achievement' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'

    ctx.fillStyle = tabDailyColor
    ctx.fillRect(modal.tabDaily.x, modal.tabDaily.y, modal.tabDaily.width, modal.tabDaily.height)
    ctx.strokeStyle = modal.currentTab === 'daily' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.tabDaily.x, modal.tabDaily.y, modal.tabDaily.width, modal.tabDaily.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.fillText('每日任务', modal.tabDaily.x + modal.tabDaily.width / 2, modal.tabDaily.y + modal.tabDaily.height / 2)

    ctx.fillStyle = tabAchievementColor
    ctx.fillRect(modal.tabAchievement.x, modal.tabAchievement.y, modal.tabAchievement.width, modal.tabAchievement.height)
    ctx.strokeStyle = modal.currentTab === 'achievement' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.strokeRect(modal.tabAchievement.x, modal.tabAchievement.y, modal.tabAchievement.width, modal.tabAchievement.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('成就任务', modal.tabAchievement.x + modal.tabAchievement.width / 2, modal.tabAchievement.y + modal.tabAchievement.height / 2)

    // 绘制任务列表
    let startY = 210
    tasks.forEach((task, index) => {
      const taskY = startY + index * 90
      const itemHeight = 80

      // 任务背景
      ctx.fillStyle = task.completed ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(modal.position.x + 15, taskY, modal.position.width - 30, itemHeight)
      ctx.strokeStyle = task.completed ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(modal.position.x + 15, taskY, modal.position.width - 30, itemHeight)

      // 任务图标
      ctx.font = '24px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(task.icon, modal.position.x + 25, taskY + itemHeight / 2)

      // 任务名称
      ctx.font = 'bold 14px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(task.name, modal.position.x + 60, taskY + 25)

      // 任务描述
      ctx.font = '11px Arial'
      ctx.fillStyle = '#aaaaaa'
      ctx.fillText(task.description, modal.position.x + 60, taskY + 45)

      // 进度条
      const progressWidth = modal.position.width - 100
      const progressHeight = 6
      const progressX = modal.position.x + 60
      const progressY = taskY + 60
      const progressPercent = Math.min(task.currentProgress / task.target, 1)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.fillRect(progressX, progressY, progressWidth, progressHeight)
      ctx.fillStyle = task.completed ? '#00ff00' : '#FFD700'
      ctx.fillRect(progressX, progressY, progressWidth * progressPercent, progressHeight)

      // 进度文字
      ctx.font = '10px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'right'
      ctx.fillText(`${task.currentProgress}/${task.target}`, modal.position.x + modal.position.width - 20, progressY + 3)

      // 领取按钮
      if (task.completed && !task.claimed) {
        const claimButton = {
          x: modal.position.x + modal.position.width - 80,
          y: taskY + 20,
          width: 60,
          height: 30
        }
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
        ctx.fillRect(claimButton.x, claimButton.y, claimButton.width, claimButton.height)
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
        ctx.lineWidth = 1
        ctx.strokeRect(claimButton.x, claimButton.y, claimButton.width, claimButton.height)
        ctx.fillStyle = '#FFD700'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('领取', claimButton.x + claimButton.width / 2, claimButton.y + claimButton.height / 2)
      } else if (task.claimed) {
        ctx.fillStyle = '#00ff00'
        ctx.font = '12px Arial'
        ctx.textAlign = 'right'
        ctx.fillText('已领取', modal.position.x + modal.position.width - 20, taskY + 25)
      }
    })
  }

  /**
   * 绘制商店弹窗
   */
  drawShopModal(ctx) {
    const modal = this.shopModal
    const products = this.shopManager ? this.shopManager.getProducts(modal.currentTab) : []
    const userScore = this.userInfo ? this.userInfo.score : 0

    // 全屏遮罩层（防止穿透）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 弹窗背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 边框
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('商店', modal.position.x + modal.position.width / 2, modal.position.y + 30)

    // 用户积分显示
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`积分: ${userScore}`, modal.position.x + modal.position.width - 10, modal.position.y + 30)

    // 关闭按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('✕', modal.closeButton.x + modal.closeButton.width / 2, modal.closeButton.y + modal.closeButton.height / 2)

    // 标签页
    const tabItemsColor = modal.currentTab === 'items' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    const tabSkinsColor = modal.currentTab === 'skins' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    const tabEffectsColor = modal.currentTab === 'effects' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'

    ctx.fillStyle = tabItemsColor
    ctx.fillRect(modal.tabItems.x, modal.tabItems.y, modal.tabItems.width, modal.tabItems.height)
    ctx.strokeStyle = modal.currentTab === 'items' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.tabItems.x, modal.tabItems.y, modal.tabItems.width, modal.tabItems.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('道具', modal.tabItems.x + modal.tabItems.width / 2, modal.tabItems.y + modal.tabItems.height / 2)

    ctx.fillStyle = tabSkinsColor
    ctx.fillRect(modal.tabSkins.x, modal.tabSkins.y, modal.tabSkins.width, modal.tabSkins.height)
    ctx.strokeStyle = modal.currentTab === 'skins' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.strokeRect(modal.tabSkins.x, modal.tabSkins.y, modal.tabSkins.width, modal.tabSkins.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('皮肤', modal.tabSkins.x + modal.tabSkins.width / 2, modal.tabSkins.y + modal.tabSkins.height / 2)

    ctx.fillStyle = tabEffectsColor
    ctx.fillRect(modal.tabEffects.x, modal.tabEffects.y, modal.tabEffects.width, modal.tabEffects.height)
    ctx.strokeStyle = modal.currentTab === 'effects' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.strokeRect(modal.tabEffects.x, modal.tabEffects.y, modal.tabEffects.width, modal.tabEffects.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('特效', modal.tabEffects.x + modal.tabEffects.width / 2, modal.tabEffects.y + modal.tabEffects.height / 2)

    // 绘制商品列表（两列布局）
    let startY = 210
    const cols = 2
    products.forEach((product, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const itemX = modal.position.x + 25 + col * 155
      const itemY = startY + row * 145
      const itemWidth = 145
      const itemHeight = 135

      // 商品背景
      ctx.fillStyle = product.owned ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(itemX, itemY, itemWidth, itemHeight)
      ctx.strokeStyle = product.owned ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(itemX, itemY, itemWidth, itemHeight)

      // 商品图标
      ctx.font = '32px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(product.icon, itemX + itemWidth / 2, itemY + 35)

      // 商品名称
      ctx.font = 'bold 13px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(product.name, itemX + itemWidth / 2, itemY + 65)

      // 商品描述
      ctx.font = '10px Arial'
      ctx.fillStyle = '#aaaaaa'
      ctx.fillText(product.description, itemX + itemWidth / 2, itemY + 82)

      // 价格
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 14px Arial'
      ctx.fillText(`${product.price}积分`, itemX + itemWidth / 2, itemY + 100)

      // 购买/已拥有按钮
      if (product.owned) {
        ctx.fillStyle = '#00ff00'
        ctx.font = '14px Arial'
        ctx.fillText('已拥有', itemX + itemWidth / 2, itemY + 125)
      } else {
        const buyButton = {
          x: itemX + itemWidth / 2 - 45,
          y: itemY + 105,
          width: 90,
          height: 32
        }
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
        ctx.fillRect(buyButton.x, buyButton.y, buyButton.width, buyButton.height)
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
        ctx.lineWidth = 2
        ctx.strokeRect(buyButton.x, buyButton.y, buyButton.width, buyButton.height)
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 14px Arial'
        ctx.fillText('购买', itemX + itemWidth / 2, itemY + 121)
      }
    })
  }

  /**
   * 绘制设置弹窗
   */
  drawSettingsModal(ctx) {
    const modal = this.settingsModal
    const settings = this.settingsManager ? this.settingsManager.getAllSettings() : []

    // 全屏遮罩层（防止穿透）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 弹窗背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 边框
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('设置', modal.position.x + modal.position.width / 2, modal.position.y + 30)

    // 关闭按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✕', modal.closeButton.x + modal.closeButton.width / 2, modal.closeButton.y + modal.closeButton.height / 2)

    // 绘制设置项列表
    let startY = 80
    settings.forEach((setting, index) => {
      const itemY = modal.position.y + startY + index * 70
      const itemHeight = 60

      // 设置项背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(modal.position.x + 15, itemY, modal.position.width - 30, itemHeight)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(modal.position.x + 15, itemY, modal.position.width - 30, itemHeight)

      // 设置图标
      ctx.font = '28px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(setting.icon, modal.position.x + 30, itemY + itemHeight / 2)

      // 设置名称
      ctx.font = 'bold 14px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(setting.name, modal.position.x + 70, itemY + 20)

      // 设置描述
      ctx.font = '11px Arial'
      ctx.fillStyle = '#aaaaaa'
      ctx.fillText(setting.description, modal.position.x + 70, itemY + 40)

      // 开关按钮
      const switchButton = {
        x: modal.position.x + modal.position.width - 60,
        y: itemY + 15,
        width: 50,
        height: 30
      }

      // 开关背景
      ctx.fillStyle = setting.value ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)'
      ctx.fillRect(switchButton.x, switchButton.y, switchButton.width, switchButton.height)
      ctx.strokeStyle = setting.value ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(switchButton.x, switchButton.y, switchButton.width, switchButton.height)

      // 开关滑块
      const sliderX = setting.value ? switchButton.x + 30 : switchButton.x + 5
      ctx.fillStyle = setting.value ? '#00ff00' : '#ffffff'
      ctx.beginPath()
      ctx.arc(sliderX + 10, switchButton.y + 15, 10, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  /**
   * 绘制公告弹窗
   */
  drawAnnouncementModal(ctx) {
    const modal = this.announcementModal
    const announcements = this.announcementManager ? this.announcementManager.getAnnouncements(modal.currentTab) : []
    const unreadCount = this.announcementManager ? this.announcementManager.getUnreadCount() : 0

    // 全屏遮罩层（防止穿透）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 弹窗背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 边框
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('公告中心', modal.position.x + modal.position.width / 2, modal.position.y + 30)

    // 未读数量
    if (unreadCount > 0) {
      ctx.fillStyle = '#ff4444'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(`未读: ${unreadCount}`, modal.position.x + modal.position.width - 10, modal.position.y + 30)
    }

    // 关闭按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✕', modal.closeButton.x + modal.closeButton.width / 2, modal.closeButton.y + modal.closeButton.height / 2)

    // 标签页
    const tabSystemColor = modal.currentTab === 'system' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    const tabActivityColor = modal.currentTab === 'activity' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    const tabUpdateColor = modal.currentTab === 'update' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'

    ctx.fillStyle = tabSystemColor
    ctx.fillRect(modal.tabSystem.x, modal.tabSystem.y, modal.tabSystem.width, modal.tabSystem.height)
    ctx.strokeStyle = modal.currentTab === 'system' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.tabSystem.x, modal.tabSystem.y, modal.tabSystem.width, modal.tabSystem.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('系统公告', modal.tabSystem.x + modal.tabSystem.width / 2, modal.tabSystem.y + modal.tabSystem.height / 2)

    ctx.fillStyle = tabActivityColor
    ctx.fillRect(modal.tabActivity.x, modal.tabActivity.y, modal.tabActivity.width, modal.tabActivity.height)
    ctx.strokeStyle = modal.currentTab === 'activity' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.strokeRect(modal.tabActivity.x, modal.tabActivity.y, modal.tabActivity.width, modal.tabActivity.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('活动公告', modal.tabActivity.x + modal.tabActivity.width / 2, modal.tabActivity.y + modal.tabActivity.height / 2)

    ctx.fillStyle = tabUpdateColor
    ctx.fillRect(modal.tabUpdate.x, modal.tabUpdate.y, modal.tabUpdate.width, modal.tabUpdate.height)
    ctx.strokeStyle = modal.currentTab === 'update' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.strokeRect(modal.tabUpdate.x, modal.tabUpdate.y, modal.tabUpdate.width, modal.tabUpdate.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('更新公告', modal.tabUpdate.x + modal.tabUpdate.width / 2, modal.tabUpdate.y + modal.tabUpdate.height / 2)

    // 绘制公告列表
    let startY = 200
    announcements.forEach((announcement, index) => {
      const itemY = modal.position.y + startY + index * 110
      const itemHeight = 100

      // 公告背景
      ctx.fillStyle = announcement.isRead ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 215, 0, 0.1)'
      ctx.fillRect(modal.position.x + 15, itemY, modal.position.width - 30, itemHeight)
      ctx.strokeStyle = announcement.isRead ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 215, 0, 0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(modal.position.x + 15, itemY, modal.position.width - 30, itemHeight)

      // 未读标记
      if (!announcement.isRead) {
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.arc(modal.position.x + 25, itemY + 15, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // 公告图标
      ctx.font = '24px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(this.announcementManager ? this.announcementManager.getTypeIcon(announcement.type) : '📋', modal.position.x + 35, itemY + 30)

      // 公告标题
      ctx.font = 'bold 13px Arial'
      ctx.fillStyle = announcement.isRead ? '#aaaaaa' : '#ffffff'
      ctx.fillText(announcement.title, modal.position.x + 70, itemY + 20)

      // 公告日期
      ctx.font = '10px Arial'
      ctx.fillStyle = '#888888'
      ctx.fillText(announcement.date, modal.position.x + 70, itemY + 40)

      // 公告内容（截断显示）
      ctx.font = '11px Arial'
      ctx.fillStyle = '#cccccc'
      const maxWidth = modal.position.width - 100
      const displayContent = announcement.content.length > 50 ? announcement.content.substring(0, 50) + '...' : announcement.content
      ctx.fillText(displayContent, modal.position.x + 70, itemY + 60)

      // 查看详情按钮
      const detailButton = {
        x: modal.position.x + modal.position.width - 85,
        y: itemY + 70,
        width: 60,
        height: 20
      }
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'
      ctx.fillRect(detailButton.x, detailButton.y, detailButton.width, detailButton.height)
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)'
      ctx.lineWidth = 1
      ctx.strokeRect(detailButton.x, detailButton.y, detailButton.width, detailButton.height)
      ctx.fillStyle = '#FFD700'
      ctx.font = '11px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('查看', detailButton.x + detailButton.width / 2, detailButton.y + detailButton.height / 2)
    })

    // 全部已读按钮
    if (unreadCount > 0) {
      const markAllButton = {
        x: modal.position.x + modal.position.width / 2 - 50,
        y: modal.position.y + modal.position.height - 40,
        width: 100,
        height: 30
      }
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'
      ctx.fillRect(markAllButton.x, markAllButton.y, markAllButton.width, markAllButton.height)
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)'
      ctx.lineWidth = 2
      ctx.strokeRect(markAllButton.x, markAllButton.y, markAllButton.width, markAllButton.height)
      ctx.fillStyle = '#00ff00'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('全部已读', markAllButton.x + markAllButton.width / 2, markAllButton.y + markAllButton.height / 2)
    }
  }

  /**
   * 绘制背包弹窗
   */
  drawInventoryModal(ctx) {
    const modal = this.inventoryModal
    const inventory = this.inventoryManager ? {
      items: this.inventoryManager.getAllItems(),
      skins: this.inventoryManager.getAllSkins(),
      effects: this.inventoryManager.getAllEffects()
    } : { items: [], skins: [], effects: [] }
    const currentTab = modal.currentTab
    const items = inventory[currentTab] || []

    // 全屏遮罩层（防止穿透）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 弹窗背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 边框
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(modal.position.x, modal.position.y, modal.position.width, modal.position.height)

    // 标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('背包', modal.position.x + modal.position.width / 2, modal.position.y + 30)

    // 背包统计
    if (this.inventoryManager) {
      const stats = this.inventoryManager.getInventoryStats()
      ctx.fillStyle = '#aaaaaa'
      ctx.font = '12px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(`物品: ${stats.items} 皮肤: ${stats.skins} 特效: ${stats.effects}`, modal.position.x + modal.position.width - 10, modal.position.y + 30)
    }

    // 关闭按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.closeButton.x, modal.closeButton.y, modal.closeButton.width, modal.closeButton.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✕', modal.closeButton.x + modal.closeButton.width / 2, modal.closeButton.y + modal.closeButton.height / 2)

    // 标签页
    const tabItemsColor = modal.currentTab === 'items' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    const tabSkinsColor = modal.currentTab === 'skins' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    const tabEffectsColor = modal.currentTab === 'effects' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'

    ctx.fillStyle = tabItemsColor
    ctx.fillRect(modal.tabItems.x, modal.tabItems.y, modal.tabItems.width, modal.tabItems.height)
    ctx.strokeStyle = modal.currentTab === 'items' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(modal.tabItems.x, modal.tabItems.y, modal.tabItems.width, modal.tabItems.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('道具', modal.tabItems.x + modal.tabItems.width / 2, modal.tabItems.y + modal.tabItems.height / 2)

    ctx.fillStyle = tabSkinsColor
    ctx.fillRect(modal.tabSkins.x, modal.tabSkins.y, modal.tabSkins.width, modal.tabSkins.height)
    ctx.strokeStyle = modal.currentTab === 'skins' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.strokeRect(modal.tabSkins.x, modal.tabSkins.y, modal.tabSkins.width, modal.tabSkins.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('皮肤', modal.tabSkins.x + modal.tabSkins.width / 2, modal.tabSkins.y + modal.tabSkins.height / 2)

    ctx.fillStyle = tabEffectsColor
    ctx.fillRect(modal.tabEffects.x, modal.tabEffects.y, modal.tabEffects.width, modal.tabEffects.height)
    ctx.strokeStyle = modal.currentTab === 'effects' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    ctx.strokeRect(modal.tabEffects.x, modal.tabEffects.y, modal.tabEffects.width, modal.tabEffects.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('特效', modal.tabEffects.x + modal.tabEffects.width / 2, modal.tabEffects.y + modal.tabEffects.height / 2)

    // 绘制物品列表
    if (items.length === 0) {
      ctx.fillStyle = '#888888'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('暂无物品', modal.position.x + modal.position.width / 2, modal.position.y + 350)
    } else {
      let startY = 200
      items.forEach((item, index) => {
        const itemY = modal.position.y + startY + index * 110
        const itemHeight = 100

        // 物品背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.fillRect(modal.position.x + 15, itemY, modal.position.width - 30, itemHeight)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 1
        ctx.strokeRect(modal.position.x + 15, itemY, modal.position.width - 30, itemHeight)

        // 物品图标
        ctx.font = '32px Arial'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(item.icon, modal.position.x + 30, itemY + 30)

        // 物品名称
        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(item.name, modal.position.x + 80, itemY + 25)

        // 物品描述
        ctx.font = '11px Arial'
        ctx.fillStyle = '#aaaaaa'
        ctx.fillText(item.description, modal.position.x + 80, itemY + 50)

        // 数量或装备状态
        if (currentTab === 'items') {
          ctx.fillStyle = '#FFD700'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'right'
          ctx.fillText(`x${item.count}`, modal.position.x + modal.position.width - 30, itemY + 30)

          // 使用按钮
          const useButton = {
            x: modal.position.x + modal.position.width - 85,
            y: itemY + 65,
            width: 60,
            height: 25
          }
          ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'
          ctx.fillRect(useButton.x, useButton.y, useButton.width, useButton.height)
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)'
          ctx.lineWidth = 1
          ctx.strokeRect(useButton.x, useButton.y, useButton.width, useButton.height)
          ctx.fillStyle = '#00ff00'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('使用', useButton.x + useButton.width / 2, useButton.y + useButton.height / 2)
        } else {
          // 装备状态
          const isEquipped = item.equipped
          ctx.fillStyle = isEquipped ? '#00ff00' : '#888888'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'right'
          ctx.fillText(isEquipped ? '已装备' : '未装备', modal.position.x + modal.position.width - 30, itemY + 30)

          // 装备/卸载按钮
          const equipButton = {
            x: modal.position.x + modal.position.width - 85,
            y: itemY + 65,
            width: 60,
            height: 25
          }
          ctx.fillStyle = isEquipped ? 'rgba(255, 100, 100, 0.2)' : 'rgba(0, 255, 0, 0.2)'
          ctx.fillRect(equipButton.x, equipButton.y, equipButton.width, equipButton.height)
          ctx.strokeStyle = isEquipped ? 'rgba(255, 100, 100, 0.4)' : 'rgba(0, 255, 0, 0.4)'
          ctx.lineWidth = 1
          ctx.strokeRect(equipButton.x, equipButton.y, equipButton.width, equipButton.height)
          ctx.fillStyle = isEquipped ? '#ff6464' : '#00ff00'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(isEquipped ? '卸载' : '装备', equipButton.x + equipButton.width / 2, equipButton.y + equipButton.height / 2)
        }
      })
    }
  }

  /**
   * 绘制教程按钮
   */
  drawTutorialButton(ctx) {
    const tutorialButton = { x: 200, y: 700, width: 100, height: 40 }
    const state = this.buttonStates.tutorial || { hovered: false }

    ctx.fillStyle = state.hovered ? 'rgba(100, 200, 255, 0.3)' : 'rgba(100, 200, 255, 0.2)'
    ctx.fillRect(tutorialButton.x, tutorialButton.y, tutorialButton.width, tutorialButton.height)
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(tutorialButton.x, tutorialButton.y, tutorialButton.width, tutorialButton.height)

    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📚 教程', tutorialButton.x + tutorialButton.width / 2, tutorialButton.y + tutorialButton.height / 2)
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
      { key: 'myStudio', pos: this.uiPositions.myStudioButton },
      { key: 'inventory', pos: this.uiPositions.inventoryButton }
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

    // 检查教程按钮
    if (this.isPointInButton(x, y, { x: 200, y: 700, width: 100, height: 40 })) {
      this.buttonStates.tutorial.hovered = true
    }
  }

  /**
   * 处理鼠标点击事件
   */
  handleClick(x, y) {
    // 优先检查签到弹窗（如果弹窗显示，拦截所有点击）
    if (this.signInModal.visible) {
      // 关闭按钮
      if (this.isPointInButton(x, y, this.signInModal.closeButton)) {
        this.signInModal.visible = false
        return 'closeSignInModal'
      }
      // 签到按钮
      if (this.isPointInButton(x, y, this.signInModal.signInButton)) {
        const result = this.signInManager.signIn()
        if (result.success) {
          this.spawnSignInParticles()
          wx.showToast({
            title: `签到成功！获得${result.reward}积分`,
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: result.message,
            icon: 'none'
          })
        }
        return 'signInAction'
      }
      // 点击弹窗外部关闭（遮罩层）
      if (!this.isPointInButton(x, y, this.signInModal.position)) {
        this.signInModal.visible = false
        return 'closeSignInModal'
      }
      // 点击弹窗内部（但不点击按钮），不穿透到下一层
      return 'modalClick'
    }

    // 优先检查任务弹窗（如果弹窗显示，拦截所有点击）
    if (this.taskModal.visible) {
      // 关闭按钮
      if (this.isPointInButton(x, y, this.taskModal.closeButton)) {
        this.taskModal.visible = false
        return 'closeTaskModal'
      }
      // 标签页切换
      if (this.isPointInButton(x, y, this.taskModal.tabDaily)) {
        this.taskModal.currentTab = 'daily'
        return 'taskTabDaily'
      }
      if (this.isPointInButton(x, y, this.taskModal.tabAchievement)) {
        this.taskModal.currentTab = 'achievement'
        return 'taskTabAchievement'
      }
      // 检查领取按钮点击
      const tasks = this.taskManager ? this.taskManager.getTasks(this.taskModal.currentTab) : []
      let startY = 210
      tasks.forEach((task, index) => {
        if (task.completed && !task.claimed) {
          const claimButton = {
            x: this.taskModal.position.x + this.taskModal.position.width - 80,
            y: startY + index * 90 + 20,
            width: 60,
            height: 30
          }
          if (this.isPointInButton(x, y, claimButton)) {
            const result = this.taskManager.claimReward(task.id, this.taskModal.currentTab)
            if (result.success) {
              wx.showToast({
                title: `领取成功！获得${result.reward}积分`,
                icon: 'success'
              })
            } else {
              wx.showToast({
                title: result.message,
                icon: 'none'
              })
            }
            return 'taskClaim'
          }
        }
      })
      // 点击弹窗外部关闭（遮罩层）
      if (!this.isPointInButton(x, y, this.taskModal.position)) {
        this.taskModal.visible = false
        return 'closeTaskModal'
      }
      // 点击弹窗内部（但不点击按钮），不穿透到下一层
      return 'modalClick'
    }

    // 优先检查商店弹窗（如果弹窗显示，拦截所有点击）
    if (this.shopModal.visible) {
      // 关闭按钮
      if (this.isPointInButton(x, y, this.shopModal.closeButton)) {
        this.shopModal.visible = false
        return 'closeShopModal'
      }
      // 标签页切换
      if (this.isPointInButton(x, y, this.shopModal.tabItems)) {
        this.shopModal.currentTab = 'items'
        return 'shopTabItems'
      }
      if (this.isPointInButton(x, y, this.shopModal.tabSkins)) {
        this.shopModal.currentTab = 'skins'
        return 'shopTabSkins'
      }
      if (this.isPointInButton(x, y, this.shopModal.tabEffects)) {
        this.shopModal.currentTab = 'effects'
        return 'shopTabEffects'
      }
      // 检查购买按钮点击
      const products = this.shopManager ? this.shopManager.getProducts(this.shopModal.currentTab) : []
      let startY = 210
      const cols = 2
      products.forEach((product, index) => {
        if (!product.owned) {
          const col = index % cols
          const row = Math.floor(index / cols)
          const itemX = this.shopModal.position.x + 25 + col * 155
          const itemY = startY + row * 145
          const buyButton = {
            x: itemX + 72.5 - 45,
            y: itemY + 105,
            width: 90,
            height: 32
          }
          if (this.isPointInButton(x, y, buyButton)) {
            const result = this.shopManager.buyProduct(product.id, this.shopModal.currentTab)
            if (result.success) {
              wx.showToast({
                title: `购买成功！花费${result.product.price}积分`,
                icon: 'success'
              })
            } else {
              wx.showToast({
                title: result.message,
                icon: 'none'
              })
            }
            return 'shopBuy'
          }
        }
      })
      // 点击弹窗外部关闭（遮罩层）
      if (!this.isPointInButton(x, y, this.shopModal.position)) {
        this.shopModal.visible = false
        return 'closeShopModal'
      }
      // 点击弹窗内部（但不点击按钮），不穿透到下一层
      return 'modalClick'
    }

    // 优先检查设置弹窗（如果弹窗显示，拦截所有点击）
    if (this.settingsModal.visible) {
      // 关闭按钮
      if (this.isPointInButton(x, y, this.settingsModal.closeButton)) {
        this.settingsModal.visible = false
        return 'closeSettingsModal'
      }
      // 检查开关按钮点击
      const settings = this.settingsManager ? this.settingsManager.getAllSettings() : []
      let startY = 80
      settings.forEach((setting, index) => {
        const itemY = this.settingsModal.position.y + startY + index * 70
        const switchButton = {
          x: this.settingsModal.position.x + this.settingsModal.position.width - 60,
          y: itemY + 15,
          width: 50,
          height: 30
        }
        if (this.isPointInButton(x, y, switchButton)) {
          const result = this.settingsManager.toggleSetting(setting.id)
          if (result.success) {
            wx.showToast({
              title: `${setting.name}已${result.value ? '开启' : '关闭'}`,
              icon: 'none'
            })
          }
          return 'settingToggle'
        }
      })
      // 点击弹窗外部关闭（遮罩层）
      if (!this.isPointInButton(x, y, this.settingsModal.position)) {
        this.settingsModal.visible = false
        return 'closeSettingsModal'
      }
      // 点击弹窗内部（但不点击按钮），不穿透到下一层
      return 'modalClick'
    }

    // 优先检查公告弹窗（如果弹窗显示，拦截所有点击）
    if (this.announcementModal.visible) {
      // 关闭按钮
      if (this.isPointInButton(x, y, this.announcementModal.closeButton)) {
        this.announcementModal.visible = false
        return 'closeAnnouncementModal'
      }
      // 标签页切换
      if (this.isPointInButton(x, y, this.announcementModal.tabSystem)) {
        this.announcementModal.currentTab = 'system'
        return 'announcementTabSystem'
      }
      if (this.isPointInButton(x, y, this.announcementModal.tabActivity)) {
        this.announcementModal.currentTab = 'activity'
        return 'announcementTabActivity'
      }
      if (this.isPointInButton(x, y, this.announcementModal.tabUpdate)) {
        this.announcementModal.currentTab = 'update'
        return 'announcementTabUpdate'
      }
      // 检查查看按钮点击
      const announcements = this.announcementManager ? this.announcementManager.getAnnouncements(this.announcementModal.currentTab) : []
      let startY = 200
      announcements.forEach((announcement, index) => {
        const itemY = this.announcementModal.position.y + startY + index * 110
        const detailButton = {
          x: this.announcementModal.position.x + this.announcementModal.position.width - 85,
          y: itemY + 70,
          width: 60,
          height: 20
        }
        if (this.isPointInButton(x, y, detailButton)) {
          this.announcementManager.markAsRead(announcement.id)
          wx.showModal({
            title: announcement.title,
            content: announcement.content,
            showCancel: false
          })
          return 'announcementDetail'
        }
      })
      // 检查全部已读按钮
      const unreadCount = this.announcementManager ? this.announcementManager.getUnreadCount() : 0
      if (unreadCount > 0) {
        const markAllButton = {
          x: this.announcementModal.position.x + this.announcementModal.position.width / 2 - 50,
          y: this.announcementModal.position.y + this.announcementModal.position.height - 40,
          width: 100,
          height: 30
        }
        if (this.isPointInButton(x, y, markAllButton)) {
          this.announcementManager.markAllAsRead()
          wx.showToast({
            title: '全部已标记为已读',
            icon: 'success'
          })
          return 'announcementMarkAll'
        }
      }
      // 点击弹窗外部关闭（遮罩层）
      if (!this.isPointInButton(x, y, this.announcementModal.position)) {
        this.announcementModal.visible = false
        return 'closeAnnouncementModal'
      }
      // 点击弹窗内部（但不点击按钮），不穿透到下一层
      return 'modalClick'
    }

    // 优先检查背包弹窗（如果弹窗显示，拦截所有点击）
    if (this.inventoryModal.visible) {
      // 关闭按钮
      if (this.isPointInButton(x, y, this.inventoryModal.closeButton)) {
        this.inventoryModal.visible = false
        return 'closeInventoryModal'
      }
      // 标签页切换
      if (this.isPointInButton(x, y, this.inventoryModal.tabItems)) {
        this.inventoryModal.currentTab = 'items'
        return 'inventoryTabItems'
      }
      if (this.isPointInButton(x, y, this.inventoryModal.tabSkins)) {
        this.inventoryModal.currentTab = 'skins'
        return 'inventoryTabSkins'
      }
      if (this.isPointInButton(x, y, this.inventoryModal.tabEffects)) {
        this.inventoryModal.currentTab = 'effects'
        return 'inventoryTabEffects'
      }
      // 检查物品按钮点击
      const inventory = this.inventoryManager ? {
        items: this.inventoryManager.getAllItems(),
        skins: this.inventoryManager.getAllSkins(),
        effects: this.inventoryManager.getAllEffects()
      } : { items: [], skins: [], effects: [] }
      const items = inventory[this.inventoryModal.currentTab] || []
      let startY = 200
      items.forEach((item, index) => {
        const itemY = this.inventoryModal.position.y + startY + index * 110
        if (this.inventoryModal.currentTab === 'items') {
          // 使用按钮
          const useButton = {
            x: this.inventoryModal.position.x + this.inventoryModal.position.width - 85,
            y: itemY + 65,
            width: 60,
            height: 25
          }
          if (this.isPointInButton(x, y, useButton)) {
            const result = this.inventoryManager.useItem(item.id)
            if (result.success) {
              wx.showToast({
                title: '使用成功',
                icon: 'success'
              })
            } else {
              wx.showToast({
                title: result.message,
                icon: 'none'
              })
            }
            return 'inventoryUse'
          }
        } else {
          // 装备/卸载按钮
          const equipButton = {
            x: this.inventoryModal.position.x + this.inventoryModal.position.width - 85,
            y: itemY + 65,
            width: 60,
            height: 25
          }
          if (this.isPointInButton(x, y, equipButton)) {
            if (this.inventoryModal.currentTab === 'skins') {
              if (item.equipped) {
                this.inventoryManager.unequipSkin()
                wx.showToast({
                  title: '已卸载',
                  icon: 'success'
                })
              } else {
                this.inventoryManager.equipSkin(item.id)
                wx.showToast({
                  title: '已装备',
                  icon: 'success'
                })
              }
            } else if (this.inventoryModal.currentTab === 'effects') {
              if (item.equipped) {
                this.inventoryManager.unequipEffect()
                wx.showToast({
                  title: '已卸载',
                  icon: 'success'
                })
              } else {
                this.inventoryManager.equipEffect(item.id)
                wx.showToast({
                  title: '已装备',
                  icon: 'success'
                })
              }
            }
            return 'inventoryEquip'
          }
        }
      })
      // 点击弹窗外部关闭（遮罩层）
      if (!this.isPointInButton(x, y, this.inventoryModal.position)) {
        this.inventoryModal.visible = false
        return 'closeInventoryModal'
      }
      // 点击弹窗内部（但不点击按钮），不穿透到下一层
      return 'modalClick'
    }

    // 优先检查教程弹窗（如果弹窗显示，拦截所有点击）
    if (this.tutorialModal.visible) {
      if (this.tutorialManager) {
        const tutorialAction = this.tutorialManager.handleClick(x, y)
        if (tutorialAction) {
          return tutorialAction
        }
      }
      // 点击弹窗外部关闭（遮罩层）
      if (!this.isPointInButton(x, y, this.tutorialModal.position)) {
        this.tutorialModal.visible = false
        return 'closeTutorialModal'
      }
      // 点击弹窗内部（但不点击按钮），不穿透到下一层
      return 'modalClick'
    }

    // 检查主要按钮点击
    if (this.isPointInButton(x, y, this.uiPositions.startGameButton)) {
      if (this.feedbackManager) {
        this.feedbackManager.addParticles(x, y, '#4CAF50', 10, 'burst')
        this.feedbackManager.playSound('button_click')
      }
      return 'startGame'
    }
    if (this.isPointInButton(x, y, this.uiPositions.quickChallengeButton)) {
      if (this.feedbackManager) {
        this.feedbackManager.addParticles(x, y, '#2196F3', 10, 'burst')
        this.feedbackManager.playSound('button_click')
      }
      return 'quickChallenge'
    }
    if (this.isPointInButton(x, y, this.uiPositions.collectionButton)) {
      if (this.feedbackManager) {
        this.feedbackManager.addParticles(x, y, '#ffffff', 10, 'burst')
        this.feedbackManager.playSound('button_click')
      }
      return 'collection'
    }
    if (this.isPointInButton(x, y, this.uiPositions.creativeWorkshopButton)) {
      if (this.feedbackManager) {
        this.feedbackManager.addParticles(x, y, '#ffffff', 10, 'burst')
        this.feedbackManager.playSound('button_click')
      }
      return 'creativeWorkshop'
    }
    if (this.isPointInButton(x, y, this.uiPositions.myStudioButton)) {
      if (this.feedbackManager) {
        this.feedbackManager.addParticles(x, y, '#ffffff', 10, 'burst')
        this.feedbackManager.playSound('button_click')
      }
      return 'myStudio'
    }
    if (this.isPointInButton(x, y, this.uiPositions.inventoryButton)) {
      // 打开背包弹窗
      this.inventoryModal.visible = true
      if (this.feedbackManager) {
        this.feedbackManager.addParticles(x, y, '#FF9800', 10, 'burst')
        this.feedbackManager.playSound('button_click')
      }
      return 'inventoryModal'
    }

    // 检查导航按钮点击
    if (this.isPointInButton(x, y, this.uiPositions.navButtons.task)) {
      // 打开任务弹窗
      this.taskModal.visible = true
      return 'taskModal'
    }
    if (this.isPointInButton(x, y, this.uiPositions.navButtons.shop)) {
      // 打开商店弹窗
      this.shopModal.visible = true
      return 'shopModal'
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
      // 打开设置弹窗
      this.settingsModal.visible = true
      return 'settingsModal'
    }
    if (this.isPointInButton(x, y, this.uiPositions.mailButton)) {
      // 打开公告弹窗
      this.announcementModal.visible = true
      return 'announcementModal'
    }

    // 检查教程按钮点击（临时添加在主菜单下方）
    if (this.isPointInButton(x, y, { x: 200, y: 700, width: 100, height: 40 })) {
      // 打开教程弹窗
      this.tutorialModal.visible = true
      return 'tutorialModal'
    }

    return null
  }

  /**
   * 处理每日签到
   */
  handleDailySignIn() {
    // 打开签到弹窗
    this.signInModal.visible = true
    return 'dailySignInModal'
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
