/**
 * 难度管理器
 * 管理游戏难度自适应调整
 */

export default class DifficultyManager {
  constructor(databus) {
    this.databus = databus

    // 难度等级
    this.difficultyLevels = {
      easy: {
        id: 'easy',
        name: '简单',
        description: '适合新手',
        multiplier: 0.8,
        timeBonus: 1.2,
        dominoBonus: 1.1
      },
      normal: {
        id: 'normal',
        name: '普通',
        description: '标准难度',
        multiplier: 1.0,
        timeBonus: 1.0,
        dominoBonus: 1.0
      },
      hard: {
        id: 'hard',
        name: '困难',
        description: '挑战自我',
        multiplier: 1.3,
        timeBonus: 0.8,
        dominoBonus: 0.9
      },
      expert: {
        id: 'expert',
        name: '专家',
        description: '极限挑战',
        multiplier: 1.6,
        timeBonus: 0.6,
        dominoBonus: 0.8
      }
    }

    // 当前难度
    this.currentDifficulty = 'normal'

    // 玩家表现追踪
    this.playerPerformance = {
      recentScores: [],
      recentCompletions: [],
      averageScore: 0,
      completionRate: 0,
      winStreak: 0,
      loseStreak: 0
    }

    // 自适应参数
    this.adaptiveSettings = {
      sampleSize: 5, // 最近5次表现
      adjustThreshold: 0.2, // 调整阈值
      minDifficulty: 'easy',
      maxDifficulty: 'expert'
    }

    // 加载难度设置
    this.loadDifficultySettings()
  }

  /**
   * 加载难度设置
   */
  loadDifficultySettings() {
    try {
      const saved = wx.getStorageSync('difficultySettings')
      if (saved) {
        this.currentDifficulty = saved.currentDifficulty || 'normal'
        this.playerPerformance = saved.playerPerformance || this.playerPerformance
      }
    } catch (e) {
      console.error('加载难度设置失败:', e)
    }
  }

  /**
   * 保存难度设置
   */
  saveDifficultySettings() {
    try {
      wx.setStorageSync('difficultySettings', {
        currentDifficulty: this.currentDifficulty,
        playerPerformance: this.playerPerformance
      })
    } catch (e) {
      console.error('保存难度设置失败:', e)
    }
  }

  /**
   * 获取当前难度
   */
  getCurrentDifficulty() {
    return this.difficultyLevels[this.currentDifficulty] || this.difficultyLevels['normal']
  }

  /**
   * 设置难度
   */
  setDifficulty(difficultyId) {
    if (this.difficultyLevels[difficultyId]) {
      this.currentDifficulty = difficultyId
      this.saveDifficultySettings()
      return true
    }
    return false
  }

  /**
   * 记录游戏表现
   */
  recordPerformance(score, targetScore, completed, timeUsed, timeLimit) {
    const performance = {
      score: score,
      targetScore: targetScore,
      completed: completed,
      scoreRatio: score / targetScore,
      timeRatio: timeUsed / timeLimit,
      timestamp: Date.now()
    }

    // 添加到最近表现
    this.playerPerformance.recentScores.push(performance)
    if (this.playerPerformance.recentScores.length > this.adaptiveSettings.sampleSize) {
      this.playerPerformance.recentScores.shift()
    }

    // 更新连胜/连败
    if (completed) {
      this.playerPerformance.winStreak++
      this.playerPerformance.loseStreak = 0
    } else {
      this.playerPerformance.loseStreak++
      this.playerPerformance.winStreak = 0
    }

    // 计算平均表现
    this.calculateAveragePerformance()

    // 自动调整难度
    this.autoAdjustDifficulty()
  }

  /**
   * 计算平均表现
   */
  calculateAveragePerformance() {
    const scores = this.playerPerformance.recentScores
    if (scores.length === 0) return

    const totalScore = scores.reduce((sum, p) => sum + p.scoreRatio, 0)
    const completedCount = scores.filter(p => p.completed).length

    this.playerPerformance.averageScore = totalScore / scores.length
    this.playerPerformance.completionRate = completedCount / scores.length
  }

  /**
   * 自动调整难度
   */
  autoAdjustDifficulty() {
    const perf = this.playerPerformance
    const currentLevel = this.difficultyLevels[this.currentDifficulty]

    // 如果样本不足，不调整
    if (perf.recentScores.length < this.adaptiveSettings.sampleSize) {
      return
    }

    // 表现很好，提高难度
    if (perf.completionRate >= 0.8 && perf.averageScore >= 1.3) {
      this.increaseDifficulty()
    }
    // 表现不好，降低难度
    else if (perf.completionRate <= 0.3 || perf.averageScore <= 0.7) {
      this.decreaseDifficulty()
    }
  }

  /**
   * 提高难度
   */
  increaseDifficulty() {
    const levels = Object.keys(this.difficultyLevels)
    const currentIndex = levels.indexOf(this.currentDifficulty)

    if (currentIndex < levels.length - 1) {
      const nextLevel = levels[currentIndex + 1]
      this.setDifficulty(nextLevel)
      console.log(`难度提升至: ${this.difficultyLevels[nextLevel].name}`)
    }
  }

  /**
   * 降低难度
   */
  decreaseDifficulty() {
    const levels = Object.keys(this.difficultyLevels)
    const currentIndex = levels.indexOf(this.currentDifficulty)

    if (currentIndex > 0) {
      const prevLevel = levels[currentIndex - 1]
      this.setDifficulty(prevLevel)
      console.log(`难度降低至: ${this.difficultyLevels[prevLevel].name}`)
    }
  }

  /**
   * 应用难度调整
   */
  applyDifficulty(baseValue, type) {
    const difficulty = this.getCurrentDifficulty()

    switch (type) {
      case 'targetScore':
        return Math.floor(baseValue * difficulty.multiplier)
      case 'timeLimit':
        return Math.floor(baseValue * difficulty.timeBonus)
      case 'dominoCount':
        return Math.floor(baseValue * difficulty.dominoBonus)
      case 'score':
        return Math.floor(baseValue * difficulty.multiplier)
      default:
        return baseValue
    }
  }

  /**
   * 获取难度建议
   */
  getDifficultySuggestion() {
    const perf = this.playerPerformance

    if (perf.recentScores.length < this.adaptiveSettings.sampleSize) {
      return {
        suggestion: '继续游戏以获得难度建议',
        current: this.getCurrentDifficulty().name
      }
    }

    if (perf.completionRate >= 0.8 && perf.averageScore >= 1.3) {
      return {
        suggestion: '表现优秀，建议提高难度',
        recommended: 'hard',
        current: this.getCurrentDifficulty().name
      }
    } else if (perf.completionRate <= 0.3 || perf.averageScore <= 0.7) {
      return {
        suggestion: '表现困难，建议降低难度',
        recommended: 'easy',
        current: this.getCurrentDifficulty().name
      }
    } else {
      return {
        suggestion: '当前难度适合',
        current: this.getCurrentDifficulty().name
      }
    }
  }

  /**
   * 重置表现数据
   */
  resetPerformance() {
    this.playerPerformance = {
      recentScores: [],
      recentCompletions: [],
      averageScore: 0,
      completionRate: 0,
      winStreak: 0,
      loseStreak: 0
    }
    this.saveDifficultySettings()
  }

  /**
   * 获取难度统计
   */
  getDifficultyStats() {
    return {
      currentDifficulty: this.currentDifficulty,
      currentLevel: this.getCurrentDifficulty(),
      playerPerformance: this.playerPerformance,
      suggestion: this.getDifficultySuggestion()
    }
  }
}
