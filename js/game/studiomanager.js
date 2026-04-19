/**
 * 我的工作室管理器
 * 管理玩家的个人工作室、成就展示、个性化设置等
 */
export default class StudioManager {
  constructor(databus) {
    this.databus = databus
    this.studioData = {
      name: '我的工作室',
      description: '',
      theme: 'default',
      background: '',
      achievements: [],
      decorations: [],
      stats: {
        totalPlayTime: 0,
        totalLevelsCompleted: 0,
        highestScore: 0,
        perfectClears: 0
      }
    }
    this.decorations = [] // 可用的装饰品
    this.achievements = [] // 成就列表

    this.loadDecorations()
    this.loadAchievements()
    this.loadStudioData()
  }

  /**
   * 加载装饰品列表
   */
  loadDecorations() {
    this.decorations = [
      {
        id: 'deco1',
        name: '金色奖杯',
        description: '完成100个关卡获得',
        icon: '🏆',
        price: 0,
        unlocked: false,
        unlockCondition: { type: 'levels', count: 100 }
      },
      {
        id: 'deco2',
        name: '钻石雕像',
        description: '获得最高分10000分',
        icon: '💎',
        price: 0,
        unlocked: false,
        unlockCondition: { type: 'score', count: 10000 }
      },
      {
        id: 'deco3',
        name: '骨牌塔',
        description: '完成50次完美通关',
        icon: '🏗️',
        price: 0,
        unlocked: false,
        unlockCondition: { type: 'perfect', count: 50 }
      },
      {
        id: 'deco4',
        name: '彩虹横幅',
        description: '商店购买',
        icon: '🌈',
        price: 500,
        unlocked: true,
        unlockCondition: null
      },
      {
        id: 'deco5',
        name: '星星灯',
        description: '商店购买',
        icon: '⭐',
        price: 300,
        unlocked: true,
        unlockCondition: null
      }
    ]
  }

  /**
   * 加载成就列表
   */
  loadAchievements() {
    this.achievements = [
      {
        id: 'ach1',
        name: '初次胜利',
        description: '完成第一个关卡',
        icon: '🎉',
        unlocked: false,
        progress: 0,
        target: 1,
        type: 'levels'
      },
      {
        id: 'ach2',
        name: '连击大师',
        description: '单次游戏达到10连击',
        icon: '🔥',
        unlocked: false,
        progress: 0,
        target: 10,
        type: 'combo'
      },
      {
        id: 'ach3',
        name: '完美主义者',
        description: '完成10次完美通关',
        icon: '✨',
        unlocked: false,
        progress: 0,
        target: 10,
        type: 'perfect'
      },
      {
        id: 'ach4',
        name: '骨牌收藏家',
        description: '收集所有类型的骨牌',
        icon: '🎴',
        unlocked: false,
        progress: 0,
        target: 20,
        type: 'collection'
      },
      {
        id: 'ach5',
        name: '社交达人',
        description: '添加10个好友',
        icon: '👋',
        unlocked: false,
        progress: 0,
        target: 10,
        type: 'friends'
      }
    ]
  }

  /**
   * 加载工作室数据
   */
  loadStudioData() {
    try {
      const savedData = wx.getStorageSync('studioData')
      if (savedData) {
        this.studioData = { ...this.studioData, ...JSON.parse(savedData) }
      }
    } catch (error) {
      console.error('加载工作室数据失败:', error)
    }
  }

  /**
   * 保存工作室数据
   */
  saveStudioData() {
    try {
      wx.setStorageSync('studioData', JSON.stringify(this.studioData))
    } catch (error) {
      console.error('保存工作室数据失败:', error)
    }
  }

  /**
   * 更新工作室名称
   */
  updateStudioName(name) {
    this.studioData.name = name
    this.saveStudioData()
  }

  /**
   * 更新工作室描述
   */
  updateStudioDescription(description) {
    this.studioData.description = description
    this.saveStudioData()
  }

  /**
   * 更新工作室主题
   */
  updateStudioTheme(theme) {
    this.studioData.theme = theme
    this.saveStudioData()
  }

  /**
   * 添加装饰品
   */
  addDecoration(decorationId) {
    const decoration = this.decorations.find(d => d.id === decorationId)
    if (decoration && !this.studioData.decorations.includes(decorationId)) {
      this.studioData.decorations.push(decorationId)
      this.saveStudioData()
      return true
    }
    return false
  }

  /**
   * 移除装饰品
   */
  removeDecoration(decorationId) {
    const index = this.studioData.decorations.indexOf(decorationId)
    if (index !== -1) {
      this.studioData.decorations.splice(index, 1)
      this.saveStudioData()
      return true
    }
    return false
  }

  /**
   * 解锁装饰品
   */
  unlockDecoration(decorationId) {
    const decoration = this.decorations.find(d => d.id === decorationId)
    if (decoration) {
      decoration.unlocked = true
      this.saveStudioData()
      return true
    }
    return false
  }

  /**
   * 更新统计数据
   */
  updateStats(statType, value) {
    switch (statType) {
      case 'playTime':
        this.studioData.stats.totalPlayTime += value
        break
      case 'levelsCompleted':
        this.studioData.stats.totalLevelsCompleted += value
        break
      case 'score':
        if (value > this.studioData.stats.highestScore) {
          this.studioData.stats.highestScore = value
        }
        break
      case 'perfect':
        this.studioData.stats.perfectClears += value
        break
    }
    this.saveStudioData()
    this.checkAchievements()
  }

  /**
   * 检查成就解锁
   */
  checkAchievements() {
    this.achievements.forEach(achievement => {
      if (!achievement.unlocked) {
        let progress = 0
        switch (achievement.type) {
          case 'levels':
            progress = this.studioData.stats.totalLevelsCompleted
            break
          case 'combo':
            // 需要从游戏数据中获取
            progress = 0
            break
          case 'perfect':
            progress = this.studioData.stats.perfectClears
            break
          case 'collection':
            // 需要从背包数据中获取
            progress = 0
            break
          case 'friends':
            // 需要从好友数据中获取
            progress = 0
            break
        }

        achievement.progress = progress
        if (progress >= achievement.target) {
          achievement.unlocked = true
          this.saveStudioData()
        }
      }
    })
  }

  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements() {
    return this.achievements.filter(a => a.unlocked)
  }

  /**
   * 获取已解锁的装饰品
   */
  getUnlockedDecorations() {
    return this.decorations.filter(d => d.unlocked)
  }

  /**
   * 获取工作室展示的装饰品
   */
  getStudioDecorations() {
    return this.studioData.decorations.map(id => this.decorations.find(d => d.id === id)).filter(Boolean)
  }

  /**
   * 获取工作室统计信息
   */
  getStats() {
    return this.studioData.stats
  }

  /**
   * 重置工作室数据
   */
  resetStudioData() {
    this.studioData = {
      name: '我的工作室',
      description: '',
      theme: 'default',
      background: '',
      achievements: [],
      decorations: [],
      stats: {
        totalPlayTime: 0,
        totalLevelsCompleted: 0,
        highestScore: 0,
        perfectClears: 0
      }
    }
    this.saveStudioData()
  }

  /**
   * 导出工作室配置
   */
  exportStudioConfig() {
    return {
      name: this.studioData.name,
      description: this.studioData.description,
      theme: this.studioData.theme,
      decorations: this.studioData.decorations,
      stats: this.studioData.stats
    }
  }

  /**
   * 导入工作室配置
   */
  importStudioConfig(config) {
    if (config) {
      this.studioData = {
        ...this.studioData,
        ...config
      }
      this.saveStudioData()
      return true
    }
    return false
  }
}
