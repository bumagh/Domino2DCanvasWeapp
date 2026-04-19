/**
 * 创意工坊管理器
 * 管理玩家创建的自定义关卡和游戏内容
 */
export default class CreativeWorkshopManager {
  constructor(databus) {
    this.databus = databus
    this.userLevels = [] // 玩家创建的关卡
    this.templates = [] // 关卡模板
    this.selectedLevel = null // 当前选中的关卡
    this.isEditing = false // 是否处于编辑模式

    this.loadTemplates()
    this.loadUserLevels()
  }

  /**
   * 加载关卡模板
   */
  loadTemplates() {
    // 预设关卡模板
    this.templates = [
      {
        id: 'template1',
        name: '简单关卡模板',
        description: '适合新手的简单关卡模板',
        difficulty: 1,
        dominoCount: 3,
        preview: '📦'
      },
      {
        id: 'template2',
        name: '中等关卡模板',
        description: '适合有经验玩家的中等难度模板',
        difficulty: 2,
        dominoCount: 5,
        preview: '📦📦'
      },
      {
        id: 'template3',
        name: '困难关卡模板',
        description: '挑战高难度玩家的困难模板',
        difficulty: 3,
        dominoCount: 7,
        preview: '📦📦📦'
      }
    ]
  }

  /**
   * 加载玩家创建的关卡
   */
  loadUserLevels() {
    try {
      const savedLevels = wx.getStorageSync('userLevels')
      if (savedLevels) {
        this.userLevels = JSON.parse(savedLevels)
      }
    } catch (error) {
      console.error('加载玩家关卡失败:', error)
      this.userLevels = []
    }
  }

  /**
   * 保存玩家创建的关卡
   */
  saveUserLevels() {
    try {
      wx.setStorageSync('userLevels', JSON.stringify(this.userLevels))
    } catch (error) {
      console.error('保存玩家关卡失败:', error)
    }
  }

  /**
   * 创建新关卡
   */
  createLevel(templateId) {
    const template = this.templates.find(t => t.id === templateId)
    if (!template) return null

    const newLevel = {
      id: 'user_' + Date.now(),
      name: '我的关卡 ' + (this.userLevels.length + 1),
      description: '',
      difficulty: template.difficulty,
      dominoCount: template.dominoCount,
      dominoPositions: [],
      targetPositions: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      plays: 0,
      completions: 0
    }

    this.userLevels.push(newLevel)
    this.saveUserLevels()
    return newLevel
  }

  /**
   * 删除关卡
   */
  deleteLevel(levelId) {
    const index = this.userLevels.findIndex(l => l.id === levelId)
    if (index !== -1) {
      this.userLevels.splice(index, 1)
      this.saveUserLevels()
    }
  }

  /**
   * 更新关卡
   */
  updateLevel(levelId, updates) {
    const level = this.userLevels.find(l => l.id === levelId)
    if (level) {
      Object.assign(level, updates, { modified: new Date().toISOString() })
      this.saveUserLevels()
    }
  }

  /**
   * 选择关卡进行编辑
   */
  selectLevel(levelId) {
    this.selectedLevel = this.userLevels.find(l => l.id === levelId)
    this.isEditing = true
    return this.selectedLevel
  }

  /**
   * 退出编辑模式
   */
  exitEditMode() {
    this.selectedLevel = null
    this.isEditing = false
  }

  /**
   * 发布关卡到创意工坊
   */
  publishLevel(levelId) {
    const level = this.userLevels.find(l => l.id === levelId)
    if (level) {
      level.published = true
      level.publishedDate = new Date().toISOString()
      this.saveUserLevels()
      return true
    }
    return false
  }

  /**
   * 取消发布关卡
   */
  unpublishLevel(levelId) {
    const level = this.userLevels.find(l => l.id === levelId)
    if (level) {
      level.published = false
      this.saveUserLevels()
      return true
    }
    return false
  }

  /**
   * 获取已发布的关卡
   */
  getPublishedLevels() {
    return this.userLevels.filter(l => l.published)
  }

  /**
   * 增加关卡游玩次数
   */
  incrementPlays(levelId) {
    const level = this.userLevels.find(l => l.id === levelId)
    if (level) {
      level.plays++
      this.saveUserLevels()
    }
  }

  /**
   * 增加关卡完成次数
   */
  incrementCompletions(levelId) {
    const level = this.userLevels.find(l => l.id === levelId)
    if (level) {
      level.completions++
      this.saveUserLevels()
    }
  }

  /**
   * 获取关卡统计信息
   */
  getLevelStats(levelId) {
    const level = this.userLevels.find(l => l.id === levelId)
    if (!level) return null

    return {
      plays: level.plays,
      completions: level.completions,
      completionRate: level.plays > 0 ? (level.completions / level.plays * 100).toFixed(1) : 0
    }
  }

  /**
   * 验证关卡配置
   */
  validateLevel(level) {
    if (!level.dominoPositions || level.dominoPositions.length === 0) {
      return { valid: false, message: '至少需要放置一个骨牌' }
    }
    if (!level.targetPositions || level.targetPositions.length === 0) {
      return { valid: false, message: '至少需要设置一个目标位置' }
    }
    if (level.dominoPositions.length !== level.dominoCount) {
      return { valid: false, message: '骨牌数量与配置不符' }
    }
    return { valid: true, message: '关卡配置有效' }
  }
}
