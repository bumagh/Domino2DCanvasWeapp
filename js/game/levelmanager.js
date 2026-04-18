/**
 * 关卡管理器
 * 管理游戏关卡设计和加载
 */

export default class LevelManager {
  constructor(databus) {
    this.databus = databus

    // 关卡数据
    this.levels = {}
    this.currentLevel = null
    this.currentLevelId = null

    // 关卡配置
    this.levelConfig = {
      maxLevel: 50,
      starsPerLevel: 3,
      unlockRequirement: 3 // 需要3星解锁下一关
    }

    // 加载关卡数据
    this.loadLevels()
  }

  /**
   * 加载关卡数据
   */
  loadLevels() {
    // 默认关卡数据
    this.levels = {
      1: {
        id: 1,
        name: '入门',
        description: '学习基本操作',
        difficulty: 'easy',
        targetScore: 100,
        timeLimit: 60,
        dominoCount: 10,
        layout: 'straight',
        unlocked: true,
        stars: 0,
        bestScore: 0
      },
      2: {
        id: 2,
        name: '转折',
        description: '掌握转弯技巧',
        difficulty: 'easy',
        targetScore: 150,
        timeLimit: 60,
        dominoCount: 15,
        layout: 'curve',
        unlocked: false,
        stars: 0,
        bestScore: 0
      },
      3: {
        id: 3,
        name: '加速',
        description: '体验速度感',
        difficulty: 'medium',
        targetScore: 200,
        timeLimit: 45,
        dominoCount: 20,
        layout: 'spiral',
        unlocked: false,
        stars: 0,
        bestScore: 0
      },
      4: {
        id: 4,
        name: '迷宫',
        description: '穿越复杂地形',
        difficulty: 'medium',
        targetScore: 250,
        timeLimit: 60,
        dominoCount: 25,
        layout: 'maze',
        unlocked: false,
        stars: 0,
        bestScore: 0
      },
      5: {
        id: 5,
        name: '挑战',
        description: '终极考验',
        difficulty: 'hard',
        targetScore: 300,
        timeLimit: 30,
        dominoCount: 30,
        layout: 'complex',
        unlocked: false,
        stars: 0,
        bestScore: 0
      }
    }

    // 从本地存储加载进度
    this.loadProgress()
  }

  /**
   * 加载关卡进度
   */
  loadProgress() {
    try {
      const savedProgress = wx.getStorageSync('levelProgress')
      if (savedProgress) {
        Object.keys(savedProgress).forEach(levelId => {
          if (this.levels[levelId]) {
            this.levels[levelId].stars = savedProgress[levelId].stars || 0
            this.levels[levelId].bestScore = savedProgress[levelId].bestScore || 0
            this.levels[levelId].unlocked = savedProgress[levelId].unlocked || false
          }
        })
        this.checkUnlocks()
      }
    } catch (e) {
      console.error('加载关卡进度失败:', e)
    }
  }

  /**
   * 保存关卡进度
   */
  saveProgress() {
    try {
      const progress = {}
      Object.keys(this.levels).forEach(levelId => {
        progress[levelId] = {
          stars: this.levels[levelId].stars,
          bestScore: this.levels[levelId].bestScore,
          unlocked: this.levels[levelId].unlocked
        }
      })
      wx.setStorageSync('levelProgress', progress)
    } catch (e) {
      console.error('保存关卡进度失败:', e)
    }
  }

  /**
   * 检查关卡解锁
   */
  checkUnlocks() {
    Object.keys(this.levels).forEach(levelId => {
      const level = this.levels[levelId]
      const prevLevel = this.levels[levelId - 1]

      if (levelId === 1) {
        level.unlocked = true
      } else if (prevLevel && prevLevel.stars >= this.levelConfig.unlockRequirement) {
        level.unlocked = true
      }
    })
  }

  /**
   * 获取关卡
   */
  getLevel(levelId) {
    return this.levels[levelId] || null
  }

  /**
   * 获取所有关卡
   */
  getAllLevels() {
    return this.levels
  }

  /**
   * 获取已解锁关卡
   */
  getUnlockedLevels() {
    const unlocked = {}
    Object.keys(this.levels).forEach(levelId => {
      if (this.levels[levelId].unlocked) {
        unlocked[levelId] = this.levels[levelId]
      }
    })
    return unlocked
  }

  /**
   * 获取已解锁关卡数量
   */
  getUnlockedCount() {
    return Object.keys(this.getUnlockedLevels()).length
  }

  /**
   * 获取总星星数
   */
  getTotalStars() {
    let total = 0
    Object.keys(this.levels).forEach(levelId => {
      total += this.levels[levelId].stars
    })
    return total
  }

  /**
   * 获取最大可能的星星数
   */
  getMaxStars() {
    return Object.keys(this.levels).length * this.levelConfig.starsPerLevel
  }

  /**
   * 开始关卡
   */
  startLevel(levelId) {
    const level = this.getLevel(levelId)
    if (!level || !level.unlocked) {
      return false
    }

    this.currentLevel = level
    this.currentLevelId = levelId
    this.databus.targetScore = level.targetScore
    this.databus.timeLimit = level.timeLimit
    this.databus.dominoCount = level.dominoCount

    return true
  }

  /**
   * 完成关卡
   */
  completeLevel(score, timeUsed) {
    if (!this.currentLevel) {
      return false
    }

    const level = this.currentLevel

    // 计算星星数
    let stars = 0
    if (score >= level.targetScore) {
      stars = 1
      if (score >= level.targetScore * 1.2) {
        stars = 2
      }
      if (score >= level.targetScore * 1.5) {
        stars = 3
      }
    }

    // 更新最佳成绩
    if (score > level.bestScore) {
      level.bestScore = score
    }

    // 更新星星数
    if (stars > level.stars) {
      level.stars = stars
    }

    // 保存进度
    this.saveProgress()
    this.checkUnlocks()

    return {
      success: true,
      stars: stars,
      bestScore: level.bestScore,
      unlockedNext: this.levels[this.currentLevelId + 1]?.unlocked || false
    }
  }

  /**
   * 创建自定义关卡
   */
  createCustomLevel(config) {
    const newId = Object.keys(this.levels).length + 1
    this.levels[newId] = {
      id: newId,
      name: config.name || `自定义关卡${newId}`,
      description: config.description || '玩家创建',
      difficulty: config.difficulty || 'medium',
      targetScore: config.targetScore || 200,
      timeLimit: config.timeLimit || 60,
      dominoCount: config.dominoCount || 20,
      layout: config.layout || 'custom',
      customLayout: config.customLayout || null,
      unlocked: true,
      stars: 0,
      bestScore: 0,
      isCustom: true
    }
    this.saveProgress()
    return newId
  }

  /**
   * 删除自定义关卡
   */
  deleteCustomLevel(levelId) {
    const level = this.levels[levelId]
    if (level && level.isCustom) {
      delete this.levels[levelId]
      this.saveProgress()
      return true
    }
    return false
  }

  /**
   * 获取关卡统计
   */
  getLevelStats() {
    return {
      totalLevels: Object.keys(this.levels).length,
      unlockedLevels: this.getUnlockedCount(),
      totalStars: this.getTotalStars(),
      maxStars: this.getMaxStars(),
      completionRate: (this.getUnlockedCount() / Object.keys(this.levels).length * 100).toFixed(1),
      starRate: (this.getTotalStars() / this.getMaxStars() * 100).toFixed(1)
    }
  }

  /**
   * 重置所有进度
   */
  resetProgress() {
    Object.keys(this.levels).forEach(levelId => {
      if (!this.levels[levelId].isCustom) {
        this.levels[levelId].stars = 0
        this.levels[levelId].bestScore = 0
        this.levels[levelId].unlocked = levelId === 1
      }
    })
    this.saveProgress()
    this.checkUnlocks()
  }
}
