/**
 * 游戏模式管理器
 * 管理不同的游戏模式
 */

export default class GameModeManager {
  constructor(databus) {
    this.databus = databus

    // 游戏模式
    this.modes = {
      level: {
        id: 'level',
        name: '关卡模式',
        description: '按照预设关卡挑战',
        icon: '📖',
        unlocked: true,
        isDefault: true
      },
      free: {
        id: 'free',
        name: '自由模式',
        description: '自由摆放骨牌',
        icon: '🎮',
        unlocked: true
      },
      timeAttack: {
        id: 'timeAttack',
        name: '限时挑战',
        description: '在限定时间内完成目标',
        icon: '⏱️',
        unlocked: false,
        unlockLevel: 3
      },
      endless: {
        id: 'endless',
        name: '无尽模式',
        description: '挑战最高分',
        icon: '∞',
        unlocked: false,
        unlockLevel: 5
      },
      multiplayer: {
        id: 'multiplayer',
        name: '多人对战',
        description: '与好友对战',
        icon: '👥',
        unlocked: false,
        unlockLevel: 10
      },
      puzzle: {
        id: 'puzzle',
        name: '解谜模式',
        description: '解开骨牌谜题',
        icon: '🧩',
        unlocked: false,
        unlockLevel: 8
      }
    }

    // 当前模式
    this.currentMode = 'level'

    // 加载解锁状态
    this.loadUnlockStatus()
  }

  /**
   * 加载解锁状态
   */
  loadUnlockStatus() {
    try {
      const saved = wx.getStorageSync('gameModeUnlocks')
      if (saved) {
        Object.keys(saved).forEach(modeId => {
          if (this.modes[modeId]) {
            this.modes[modeId].unlocked = saved[modeId]
          }
        })
      }
    } catch (e) {
      console.error('加载游戏模式解锁状态失败:', e)
    }
  }

  /**
   * 保存解锁状态
   */
  saveUnlockStatus() {
    try {
      const unlocks = {}
      Object.keys(this.modes).forEach(modeId => {
        unlocks[modeId] = this.modes[modeId].unlocked
      })
      wx.setStorageSync('gameModeUnlocks', unlocks)
    } catch (e) {
      console.error('保存游戏模式解锁状态失败:', e)
    }
  }

  /**
   * 检查解锁状态
   */
  checkUnlocks(levelManager) {
    if (!levelManager) return

    const totalStars = levelManager.getTotalStars()
    const unlockedCount = levelManager.getUnlockedCount()

    Object.keys(this.modes).forEach(modeId => {
      const mode = this.modes[modeId]
      if (mode.unlockLevel) {
        if (unlockedCount >= mode.unlockLevel) {
          mode.unlocked = true
        }
      }
    })

    this.saveUnlockStatus()
  }

  /**
   * 获取所有模式
   */
  getAllModes() {
    return this.modes
  }

  /**
   * 获取已解锁模式
   */
  getUnlockedModes() {
    const unlocked = {}
    Object.keys(this.modes).forEach(modeId => {
      if (this.modes[modeId].unlocked) {
        unlocked[modeId] = this.modes[modeId]
      }
    })
    return unlocked
  }

  /**
   * 获取模式
   */
  getMode(modeId) {
    return this.modes[modeId] || null
  }

  /**
   * 设置当前模式
   */
  setCurrentMode(modeId) {
    const mode = this.getMode(modeId)
    if (mode && mode.unlocked) {
      this.currentMode = modeId
      this.databus.gameMode = modeId
      return true
    }
    return false
  }

  /**
   * 获取当前模式
   */
  getCurrentMode() {
    return this.modes[this.currentMode] || this.modes['level']
  }

  /**
   * 获取模式配置
   */
  getModeConfig(modeId) {
    const configs = {
      level: {
        targetScore: true,
        timeLimit: true,
        dominoLimit: true,
        lives: false,
        comboMultiplier: false
      },
      free: {
        targetScore: false,
        timeLimit: false,
        dominoLimit: false,
        lives: false,
        comboMultiplier: true
      },
      timeAttack: {
        targetScore: true,
        timeLimit: true,
        dominoLimit: true,
        lives: true,
        comboMultiplier: true,
        timeBonus: true
      },
      endless: {
        targetScore: false,
        timeLimit: false,
        dominoLimit: false,
        lives: true,
        comboMultiplier: true,
        difficultyScaling: true
      },
      multiplayer: {
        targetScore: true,
        timeLimit: true,
        dominoLimit: true,
        lives: true,
        comboMultiplier: true,
        opponentScore: true
      },
      puzzle: {
        targetScore: false,
        timeLimit: true,
        dominoLimit: true,
        lives: true,
        comboMultiplier: false,
        solutionRequired: true
      }
    }

    return configs[modeId] || configs['level']
  }

  /**
   * 解锁模式
   */
  unlockMode(modeId) {
    if (this.modes[modeId]) {
      this.modes[modeId].unlocked = true
      this.saveUnlockStatus()
      return true
    }
    return false
  }

  /**
   * 获取模式统计
   */
  getModeStats() {
    const stats = {
      totalModes: Object.keys(this.modes).length,
      unlockedModes: Object.keys(this.getUnlockedModes()).length,
      currentMode: this.currentMode
    }
    return stats
  }

  /**
   * 重置解锁状态
   */
  resetUnlocks() {
    Object.keys(this.modes).forEach(modeId => {
      if (!this.modes[modeId].isDefault) {
        this.modes[modeId].unlocked = false
      }
    })
    this.saveUnlockStatus()
  }
}
