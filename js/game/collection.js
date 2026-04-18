/**
 * 图鉴管理类
 * 用于管理游戏中的图鉴数据、渲染和选择功能
 */

export default class Collection {
  constructor(databus, userInfo) {
    this.databus = databus
    this.userInfo = userInfo

    // 图鉴数据
    this.collections = {
      dominoes: [
        { id: 'normal', name: '普通骨牌', color: '#ff6b6b', width: 10, height: 50, rarity: 'common', unlocked: true },
        { id: 'tall', name: '高型骨牌', color: '#4ecdc4', width: 10, height: 70, rarity: 'rare', unlocked: false },
        { id: 'wide', name: '宽型骨牌', color: '#f9ca24', width: 15, height: 40, rarity: 'rare', unlocked: false },
        { id: 'heavy', name: '重型骨牌', color: '#6ab04c', width: 12, height: 55, rarity: 'epic', unlocked: false }
      ],
      achievements: [
        { id: 1, name: '初次尝试', icon: '🌟', description: '完成第一关', unlocked: true },
        { id: 2, name: '连锁大师', icon: '🔗', description: '连锁超过50个骨牌', unlocked: false },
        { id: 3, name: '完美主义者', icon: '✨', description: '无失误完成关卡', unlocked: false },
        { id: 4, name: '速度之星', icon: '⚡', description: '10秒内完成关卡', unlocked: false }
      ]
    }

    // 当前选择的分类
    this.currentCategory = 'dominoes'

    // 当前选中的图鉴
    this.selectedCollection = null

    // UI位置配置
    this.uiPositions = {
      backButton: { x: 20, y: 170, width: 60, height: 30 },
      categoryTabs: [
        { key: 'dominoes', name: '骨牌', x: 50, y: 220, width: 100, height: 40 },
        { key: 'achievements', name: '成就', x: 170, y: 220, width: 100, height: 40 }
      ],
      gridArea: { x: 30, y: 280, width: 340, height: 400 },
      detailPanel: { x: 30, y: 700, width: 340, height: 100 }
    }

    // 按钮状态
    this.buttonStates = {
      back: { hovered: false },
      dominoes: { hovered: false, active: true },
      achievements: { hovered: false, active: false }
    }
  }

  /**
   * 更新图鉴逻辑
   */
  update(deltaTime) {
    // 可以添加动画更新逻辑
  }

  /**
   * 渲染图鉴界面
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 绘制背景
    this.drawBackground(ctx, canvasWidth, canvasHeight)

    // 绘制标题
    this.drawTitle(ctx)

    // 绘制返回按钮
    this.drawBackButton(ctx)

    // 绘制分类标签
    this.drawCategoryTabs(ctx)

    // 绘制图鉴网格
    this.drawCollectionGrid(ctx)

    // 绘制详情面板
    if (this.selectedCollection) {
      this.drawDetailPanel(ctx)
    }
  }

  /**
   * 绘制背景
   */
  drawBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f3460')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  /**
   * 绘制标题
   */
  drawTitle(ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('我的图鉴', ctx.canvas.width / 2, 195)
  }

  /**
   * 绘制返回按钮
   */
  drawBackButton(ctx) {
    const { backButton } = this.uiPositions
    const state = this.buttonStates.back

    ctx.fillStyle = state.hovered ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(backButton.x, backButton.y, backButton.width, backButton.height)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(backButton.x, backButton.y, backButton.width, backButton.height)

    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('←', backButton.x + backButton.width / 2, backButton.y + backButton.height / 2)
  }

  /**
   * 绘制分类标签
   */
  drawCategoryTabs(ctx) {
    this.uiPositions.categoryTabs.forEach(tab => {
      const state = this.buttonStates[tab.key]
      const isActive = state.active

      // 背景
      ctx.fillStyle = isActive ? 'rgba(255, 215, 0, 0.3)' : (state.hovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)')
      ctx.fillRect(tab.x, tab.y, tab.width, tab.height)

      // 边框
      ctx.strokeStyle = isActive ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(tab.x, tab.y, tab.width, tab.height)

      // 文字
      ctx.fillStyle = isActive ? '#FFD700' : '#ffffff'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(tab.name, tab.x + tab.width / 2, tab.y + tab.height / 2)
    })
  }

  /**
   * 绘制图鉴网格
   */
  drawCollectionGrid(ctx) {
    const { gridArea } = this.uiPositions
    const items = this.collections[this.currentCategory]
    const cols = 3
    const itemWidth = 100
    const itemHeight = 100
    const gap = 10

    items.forEach((item, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = gridArea.x + col * (itemWidth + gap)
      const y = gridArea.y + row * (itemHeight + gap)

      // 绘制图鉴项
      this.drawCollectionItem(ctx, item, x, y, itemWidth, itemHeight)
    })
  }

  /**
   * 绘制单个图鉴项
   */
  drawCollectionItem(ctx, item, x, y, width, height) {
    const isSelected = this.selectedCollection && this.selectedCollection.id === item.id

    // 背景
    if (!item.unlocked) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    } else {
      ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
    }
    ctx.fillRect(x, y, width, height)

    // 边框
    const rarityColors = {
      common: 'rgba(255, 255, 255, 0.3)',
      rare: 'rgba(0, 191, 255, 0.5)',
      epic: 'rgba(138, 43, 226, 0.5)',
      legendary: 'rgba(255, 215, 0, 0.5)'
    }
    ctx.strokeStyle = rarityColors[item.rarity] || rarityColors.common
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.strokeRect(x, y, width, height)

    // 绘制骨牌（如果是骨牌分类）
    if (this.currentCategory === 'dominoes' && item.color) {
      if (item.unlocked) {
        ctx.save()
        ctx.translate(x + width / 2, y + height / 2)
        ctx.fillStyle = item.color
        const dominoWidth = Math.min(item.width, 30)
        const dominoHeight = Math.min(item.height, 50)
        ctx.fillRect(-dominoWidth / 2, -dominoHeight / 2, dominoWidth, dominoHeight)
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        ctx.strokeRect(-dominoWidth / 2, -dominoHeight / 2, dominoWidth, dominoHeight)
        ctx.restore()
      } else {
        ctx.font = '30px Arial'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🔒', x + width / 2, y + height / 2)
      }
    } else if (this.currentCategory === 'achievements' && item.icon) {
      // 绘制成就图标
      if (item.unlocked) {
        ctx.font = '40px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(item.icon, x + width / 2, y + height / 2 - 10)
      } else {
        ctx.font = '30px Arial'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🔒', x + width / 2, y + height / 2 - 10)
      }
    }

    // 名称
    ctx.font = '12px Arial'
    ctx.fillStyle = item.unlocked ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
    ctx.fillText(item.name, x + width / 2, y + height - 15)
  }

  /**
   * 绘制详情面板
   */
  drawDetailPanel(ctx) {
    const { detailPanel } = this.uiPositions
    const item = this.selectedCollection

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(detailPanel.x, detailPanel.y, detailPanel.width, detailPanel.height)

    // 边框
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(detailPanel.x, detailPanel.y, detailPanel.width, detailPanel.height)

    // 名称
    ctx.font = '16px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.name, detailPanel.x + 15, detailPanel.y + 20)

    // 稀有度
    const rarityTexts = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    }
    ctx.font = '12px Arial'
    ctx.fillStyle = '#FFD700'
    ctx.fillText(`稀有度: ${rarityTexts[item.rarity]}`, detailPanel.x + 15, detailPanel.y + 40)

    // 骨牌属性
    if (this.currentCategory === 'dominoes' && item.color) {
      ctx.font = '12px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`宽度: ${item.width}`, detailPanel.x + 15, detailPanel.y + 60)
      ctx.fillText(`高度: ${item.height}`, detailPanel.x + 120, detailPanel.y + 60)
    }

    // 描述
    if (item.description) {
      ctx.font = '12px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(item.description, detailPanel.x + 15, detailPanel.y + 80)
    }

    // 状态
    ctx.font = '12px Arial'
    ctx.fillStyle = item.unlocked ? '#00ff00' : '#ff0000'
    ctx.fillText(item.unlocked ? '已解锁' : '未解锁', detailPanel.x + 15, detailPanel.y + 95)
  }

  /**
   * 处理鼠标移动事件
   */
  handleMouseMove(x, y) {
    // 重置所有按钮状态
    for (let key in this.buttonStates) {
      if (key !== 'dominoes' && key !== 'achievements') {
        this.buttonStates[key].hovered = false
      }
    }

    // 检查返回按钮
    if (this.isPointInButton(x, y, this.uiPositions.backButton)) {
      this.buttonStates.back.hovered = true
    }

    // 检查分类标签
    this.uiPositions.categoryTabs.forEach(tab => {
      this.buttonStates[tab.key].hovered = this.isPointInButton(x, y, tab)
    })
  }

  /**
   * 处理点击事件
   */
  handleClick(x, y) {
    // 检查返回按钮
    if (this.isPointInButton(x, y, this.uiPositions.backButton)) {
      return 'back'
    }

    // 检查分类标签
    for (let tab of this.uiPositions.categoryTabs) {
      if (this.isPointInButton(x, y, tab)) {
        this.switchCategory(tab.key)
        return 'category'
      }
    }

    // 检查图鉴项点击
    const { gridArea } = this.uiPositions
    const items = this.collections[this.currentCategory]
    const cols = 3
    const itemWidth = 100
    const itemHeight = 100
    const gap = 10

    items.forEach((item, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = gridArea.x + col * (itemWidth + gap)
      const y = gridArea.y + row * (itemHeight + gap)

      if (this.isPointInButton(x, y, { x, y, width: itemWidth, height: itemHeight })) {
        this.selectedCollection = item
        return 'select'
      }
    })

    return null
  }

  /**
   * 切换分类
   */
  switchCategory(category) {
    this.currentCategory = category
    this.selectedCollection = null

    // 更新按钮状态
    this.buttonStates.dominoes.active = category === 'dominoes'
    this.buttonStates.achievements.active = category === 'achievements'
  }

  /**
   * 判断点是否在按钮内
   */
  isPointInButton(x, y, button) {
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height
  }

  /**
   * 解锁图鉴
   */
  unlockItem(category, itemId) {
    const item = this.collections[category].find(i => i.id === itemId)
    if (item && !item.unlocked) {
      item.unlocked = true
      return true
    }
    return false
  }
}
