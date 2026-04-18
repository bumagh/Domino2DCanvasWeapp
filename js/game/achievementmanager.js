/**
 * 成就管理器
 * 管理游戏成就系统
 */

export default class AchievementManager {
  constructor(databus) {
    this.databus = databus

    // 成就定义
    this.achievements = {
      // 关卡相关
      first_level: {
        id: 'first_level',
        name: '初次尝试',
        description: '完成第一个关卡',
        icon: '🌟',
        reward: 50,
        unlocked: false,
        unlockedTime: null,
        category: 'level'
      },
      level_master: {
        id: 'level_master',
        name: '关卡大师',
        description: '完成10个关卡',
        icon: '🏆',
        reward: 200,
        unlocked: false,
        unlockedTime: null,
        category: 'level',
        requirement: 10
      },
      three_stars: {
        id: 'three_stars',
        name: '完美主义者',
        description: '获得3星评价',
        icon: '⭐',
        reward: 100,
        unlocked: false,
        unlockedTime: null,
        category: 'level'
      },
      all_stars: {
        id: 'all_stars',
        name: '全明星',
        description: '所有关卡获得3星',
        icon: '🌟',
        reward: 500,
        unlocked: false,
        unlockedTime: null,
        category: 'level'
      },

      // 分数相关
      score_1000: {
        id: 'score_1000',
        name: '千分达人',
        description: '单局获得1000分',
        icon: '💯',
        reward: 100,
        unlocked: false,
        unlockedTime: null,
        category: 'score',
        requirement: 1000
      },
      score_5000: {
        id: 'score_5000',
        name: '五千分',
        description: '单局获得5000分',
        icon: '💎',
        reward: 300,
        unlocked: false,
        unlockedTime: null,
        category: 'score',
        requirement: 5000
      },
      score_10000: {
        id: 'score_10000',
        name: '万分传奇',
        description: '单局获得10000分',
        icon: '👑',
        reward: 500,
        unlocked: false,
        unlockedTime: null,
        category: 'score',
        requirement: 10000
      },

      // 连击相关
      combo_10: {
        id: 'combo_10',
        name: '连击新手',
        description: '达成10连击',
        icon: '🔥',
        reward: 50,
        unlocked: false,
        unlockedTime: null,
        category: 'combo',
        requirement: 10
      },
      combo_50: {
        id: 'combo_50',
        name: '连击大师',
        description: '达成50连击',
        icon: '⚡',
        reward: 200,
        unlocked: false,
        unlockedTime: null,
        category: 'combo',
        requirement: 50
      },
      combo_100: {
        id: 'combo_100',
        name: '连击传奇',
        description: '达成100连击',
        icon: '🌟',
        reward: 400,
        unlocked: false,
        unlockedTime: null,
        category: 'combo',
        requirement: 100
      },

      // 游戏模式相关
      mode_unlock: {
        id: 'mode_unlock',
        name: '模式探索者',
        description: '解锁所有游戏模式',
        icon: '🎮',
        reward: 300,
        unlocked: false,
        unlockedTime: null,
        category: 'mode'
      },
      mode_master: {
        id: 'mode_master',
        name: '全能玩家',
        description: '在所有模式中获胜',
        icon: '🎯',
        reward: 500,
        unlocked: false,
        unlockedTime: null,
        category: 'mode'
      },

      // 特殊成就
      speed_demon: {
        id: 'speed_demon',
        name: '速度恶魔',
        description: '在10秒内完成关卡',
        icon: '⏱️',
        reward: 150,
        unlocked: false,
        unlockedTime: null,
        category: 'special'
      },
      perfectionist: {
        id: 'perfectionist',
        name: '完美主义',
        description: '连续5次获得3星',
        icon: '✨',
        reward: 300,
        unlocked: false,
        unlockedTime: null,
        category: 'special'
      }
    }

    // 统计数据
    this.stats = {
      levelsCompleted: 0,
      totalStars: 0,
      maxCombo: 0,
      maxScore: 0,
      gamesPlayed: 0,
      threeStarStreak: 0
    }

    // 加载成就数据
    this.loadAchievements()
  }

  /**
   * 加载成就数据
   */
  loadAchievements() {
    try {
      const saved = wx.getStorageSync('achievements')
      if (saved) {
        Object.keys(saved).forEach(id => {
          if (this.achievements[id]) {
            this.achievements[id].unlocked = saved[id].unlocked
            this.achievements[id].unlockedTime = saved[id].unlockedTime
          }
        })
      }

      const savedStats = wx.getStorageSync('achievementStats')
      if (savedStats) {
        this.stats = savedStats
      }
    } catch (e) {
      console.error('加载成就数据失败:', e)
    }
  }

  /**
   * 保存成就数据
   */
  saveAchievements() {
    try {
      const achievements = {}
      Object.keys(this.achievements).forEach(id => {
        achievements[id] = {
          unlocked: this.achievements[id].unlocked,
          unlockedTime: this.achievements[id].unlockedTime
        }
      })
      wx.setStorageSync('achievements', achievements)
      wx.setStorageSync('achievementStats', this.stats)
    } catch (e) {
      console.error('保存成就数据失败:', e)
    }
  }

  /**
   * 检查成就
   */
  checkAchievement(event, data) {
    let unlocked = []

    switch (event) {
      case 'level_complete':
        unlocked = this.checkLevelAchievements(data)
        break
      case 'score':
        unlocked = this.checkScoreAchievements(data)
        break
      case 'combo':
        unlocked = this.checkComboAchievements(data)
        break
      case 'mode_unlock':
        unlocked = this.checkModeAchievements(data)
        break
      case 'special':
        unlocked = this.checkSpecialAchievements(data)
        break
    }

    if (unlocked.length > 0) {
      this.saveAchievements()
    }

    return unlocked
  }

  /**
   * 检查关卡成就
   */
  checkLevelAchievements(data) {
    const unlocked = []

    // 初次尝试
    if (!this.achievements.first_level.unlocked && data.completed) {
      this.unlockAchievement('first_level')
      unlocked.push(this.achievements.first_level)
    }

    // 关卡大师
    this.stats.levelsCompleted++
    if (this.stats.levelsCompleted >= this.achievements.level_master.requirement && !this.achievements.level_master.unlocked) {
      this.unlockAchievement('level_master')
      unlocked.push(this.achievements.level_master)
    }

    // 3星评价
    if (data.stars >= 3 && !this.achievements.three_stars.unlocked) {
      this.unlockAchievement('three_stars')
      unlocked.push(this.achievements.three_stars)
      this.stats.threeStarStreak++
    } else {
      this.stats.threeStarStreak = 0
    }

    // 完美主义
    if (this.stats.threeStarStreak >= 5 && !this.achievements.perfectionist.unlocked) {
      this.unlockAchievement('perfectionist')
      unlocked.push(this.achievements.perfectionist)
    }

    return unlocked
  }

  /**
   * 检查分数成就
   */
  checkScoreAchievements(data) {
    const unlocked = []
    const score = data.score

    // 更新最高分
    if (score > this.stats.maxScore) {
      this.stats.maxScore = score
    }

    // 千分达人
    if (score >= this.achievements.score_1000.requirement && !this.achievements.score_1000.unlocked) {
      this.unlockAchievement('score_1000')
      unlocked.push(this.achievements.score_1000)
    }

    // 五千分
    if (score >= this.achievements.score_5000.requirement && !this.achievements.score_5000.unlocked) {
      this.unlockAchievement('score_5000')
      unlocked.push(this.achievements.score_5000)
    }

    // 万分传奇
    if (score >= this.achievements.score_10000.requirement && !this.achievements.score_10000.unlocked) {
      this.unlockAchievement('score_10000')
      unlocked.push(this.achievements.score_10000)
    }

    return unlocked
  }

  /**
   * 检查连击成就
   */
  checkComboAchievements(data) {
    const unlocked = []
    const combo = data.combo

    // 更新最高连击
    if (combo > this.stats.maxCombo) {
      this.stats.maxCombo = combo
    }

    // 连击新手
    if (combo >= this.achievements.combo_10.requirement && !this.achievements.combo_10.unlocked) {
      this.unlockAchievement('combo_10')
      unlocked.push(this.achievements.combo_10)
    }

    // 连击大师
    if (combo >= this.achievements.combo_50.requirement && !this.achievements.combo_50.unlocked) {
      this.unlockAchievement('combo_50')
      unlocked.push(this.achievements.combo_50)
    }

    // 连击传奇
    if (combo >= this.achievements.combo_100.requirement && !this.achievements.combo_100.unlocked) {
      this.unlockAchievement('combo_100')
      unlocked.push(this.achievements.combo_100)
    }

    return unlocked
  }

  /**
   * 检查模式成就
   */
  checkModeAchievements(data) {
    const unlocked = []

    // 模式探索者
    if (data.unlockedCount >= 6 && !this.achievements.mode_unlock.unlocked) {
      this.unlockAchievement('mode_unlock')
      unlocked.push(this.achievements.mode_unlock)
    }

    return unlocked
  }

  /**
   * 检查特殊成就
   */
  checkSpecialAchievements(data) {
    const unlocked = []

    // 速度恶魔
    if (data.timeUsed <= 10 && !this.achievements.speed_demon.unlocked) {
      this.unlockAchievement('speed_demon')
      unlocked.push(this.achievements.speed_demon)
    }

    return unlocked
  }

  /**
   * 解锁成就
   */
  unlockAchievement(achievementId) {
    if (this.achievements[achievementId]) {
      this.achievements[achievementId].unlocked = true
      this.achievements[achievementId].unlockedTime = Date.now()

      // 发放奖励
      const reward = this.achievements[achievementId].reward
      if (this.databus.userInfo) {
        this.databus.userInfo.addScore(reward)
      }

      console.log(`成就解锁: ${this.achievements[achievementId].name}`)
    }
  }

  /**
   * 获取所有成就
   */
  getAllAchievements() {
    return this.achievements
  }

  /**
   * 获取已解锁成就
   */
  getUnlockedAchievements() {
    const unlocked = {}
    Object.keys(this.achievements).forEach(id => {
      if (this.achievements[id].unlocked) {
        unlocked[id] = this.achievements[id]
      }
    })
    return unlocked
  }

  /**
   * 获取未解锁成就
   */
  getLockedAchievements() {
    const locked = {}
    Object.keys(this.achievements).forEach(id => {
      if (!this.achievements[id].unlocked) {
        locked[id] = this.achievements[id]
      }
    })
    return locked
  }

  /**
   * 按类别获取成就
   */
  getAchievementsByCategory(category) {
    const result = {}
    Object.keys(this.achievements).forEach(id => {
      if (this.achievements[id].category === category) {
        result[id] = this.achievements[id]
      }
    })
    return result
  }

  /**
   * 获取成就统计
   */
  getAchievementStats() {
    const total = Object.keys(this.achievements).length
    const unlocked = Object.keys(this.getUnlockedAchievements()).length
    const locked = total - unlocked

    return {
      total: total,
      unlocked: unlocked,
      locked: locked,
      progress: (unlocked / total * 100).toFixed(1),
      totalReward: Object.keys(this.achievements).reduce((sum, id) => sum + this.achievements[id].reward, 0),
      earnedReward: Object.keys(this.getUnlockedAchievements()).reduce((sum, id) => sum + this.achievements[id].reward, 0),
      playerStats: this.stats
    }
  }

  /**
   * 重置成就
   */
  resetAchievements() {
    Object.keys(this.achievements).forEach(id => {
      this.achievements[id].unlocked = false
      this.achievements[id].unlockedTime = null
    })
    this.stats = {
      levelsCompleted: 0,
      totalStars: 0,
      maxCombo: 0,
      maxScore: 0,
      gamesPlayed: 0,
      threeStarStreak: 0
    }
    this.saveAchievements()
  }
}
