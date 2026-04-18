/**
 * 任务管理器
 * 管理每日任务、成就任务、任务进度和奖励发放
 */

export default class TaskManager {
  constructor(databus, userInfo) {
    this.databus = databus
    this.userInfo = userInfo

    // 任务类型定义
    this.taskTypes = {
      // 每日任务
      daily: [
        {
          id: 'daily_play_3_games',
          name: '游戏达人',
          description: '完成3局游戏',
          target: 3,
          reward: 20,
          icon: '🎮',
          type: 'play_games'
        },
        {
          id: 'daily_score_500',
          name: '高分挑战',
          description: '单局获得500分',
          target: 500,
          reward: 30,
          icon: '🏆',
          type: 'single_score'
        },
        {
          id: 'daily_chain_10',
          name: '连锁反应',
          description: '单局连锁10个骨牌',
          target: 10,
          reward: 25,
          icon: '🔗',
          type: 'max_chain'
        }
      ],
      // 成就任务
      achievement: [
        {
          id: 'ach_play_100_games',
          name: '游戏新手',
          description: '累计完成100局游戏',
          target: 100,
          reward: 100,
          icon: '🎯',
          type: 'total_play_games'
        },
        {
          id: 'ach_score_10000',
          name: '积分大师',
          description: '累计获得10000积分',
          target: 10000,
          reward: 200,
          icon: '💎',
          type: 'total_score'
        },
        {
          id: 'ach_chain_50',
          name: '连锁专家',
          description: '单局连锁50个骨牌',
          target: 50,
          reward: 150,
          icon: '🌟',
          type: 'max_chain'
        },
        {
          id: 'ach_sign_in_7_days',
          name: '坚持签到',
          description: '连续签到7天',
          target: 7,
          reward: 100,
          icon: '📅',
          type: 'consecutive_sign_in'
        }
      ]
    }

    // 任务数据
    this.taskData = {
      dailyTasks: {},      // 每日任务进度
      achievementTasks: {}, // 成就任务进度
      lastDailyReset: null // 上次每日任务重置日期
    }

    // 加载任务数据
    this.loadTaskData()

    // 检查是否需要重置每日任务
    this.checkDailyReset()
  }

  /**
   * 加载任务数据
   */
  loadTaskData() {
    try {
      const data = wx.getStorageSync('taskData')
      if (data) {
        this.taskData = data
      }
    } catch (e) {
      console.error('加载任务数据失败:', e)
    }
  }

  /**
   * 保存任务数据
   */
  saveTaskData() {
    try {
      wx.setStorageSync('taskData', this.taskData)
    } catch (e) {
      console.error('保存任务数据失败:', e)
    }
  }

  /**
   * 检查是否需要每日重置
   */
  checkDailyReset() {
    const today = this.getTodayDate()
    const lastReset = this.taskData.lastDailyReset

    if (lastReset) {
      const lastDay = new Date(lastReset)
      const currentDay = new Date(today)

      // 检查是否是新的一天
      if (lastDay.getDate() !== currentDay.getDate() ||
          lastDay.getMonth() !== currentDay.getMonth() ||
          lastDay.getFullYear() !== currentDay.getFullYear()) {
        // 重置每日任务
        this.resetDailyTasks()
        this.taskData.lastDailyReset = today
        this.saveTaskData()
      }
    } else {
      // 首次加载，设置重置日期
      this.taskData.lastDailyReset = today
      this.resetDailyTasks()
      this.saveTaskData()
    }
  }

  /**
   * 获取今天的日期字符串
   */
  getTodayDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 重置每日任务
   */
  resetDailyTasks() {
    this.taskData.dailyTasks = {}
    this.taskTypes.daily.forEach(task => {
      this.taskData.dailyTasks[task.id] = {
        progress: 0,
        completed: false,
        claimed: false
      }
    })
  }

  /**
   * 更新任务进度
   * @param {string} type - 任务类型
   * @param {number} value - 增加的进度值
   */
  updateProgress(type, value = 1) {
    let updated = false

    // 更新每日任务
    this.taskTypes.daily.forEach(task => {
      if (task.type === type && !this.taskData.dailyTasks[task.id]?.completed) {
        if (!this.taskData.dailyTasks[task.id]) {
          this.taskData.dailyTasks[task.id] = { progress: 0, completed: false, claimed: false }
        }
        this.taskData.dailyTasks[task.id].progress += value

        // 检查是否完成
        if (this.taskData.dailyTasks[task.id].progress >= task.target) {
          this.taskData.dailyTasks[task.id].progress = task.target
          this.taskData.dailyTasks[task.id].completed = true
        }
        updated = true
      }
    })

    // 更新成就任务
    this.taskTypes.achievement.forEach(task => {
      if (task.type === type && !this.taskData.achievementTasks[task.id]?.completed) {
        if (!this.taskData.achievementTasks[task.id]) {
          this.taskData.achievementTasks[task.id] = { progress: 0, completed: false, claimed: false }
        }
        this.taskData.achievementTasks[task.id].progress += value

        // 检查是否完成
        if (this.taskData.achievementTasks[task.id].progress >= task.target) {
          this.taskData.achievementTasks[task.id].progress = task.target
          this.taskData.achievementTasks[task.id].completed = true
        }
        updated = true
      }
    })

    if (updated) {
      this.saveTaskData()
    }
  }

  /**
   * 设置任务进度（用于某些特定任务）
   * @param {string} type - 任务类型
   * @param {number} value - 设置的进度值
   */
  setProgress(type, value) {
    let updated = false

    // 更新每日任务
    this.taskTypes.daily.forEach(task => {
      if (task.type === type && !this.taskData.dailyTasks[task.id]?.completed) {
        if (!this.taskData.dailyTasks[task.id]) {
          this.taskData.dailyTasks[task.id] = { progress: 0, completed: false, claimed: false }
        }
        this.taskData.dailyTasks[task.id].progress = value

        // 检查是否完成
        if (this.taskData.dailyTasks[task.id].progress >= task.target) {
          this.taskData.dailyTasks[task.id].progress = task.target
          this.taskData.dailyTasks[task.id].completed = true
        }
        updated = true
      }
    })

    // 更新成就任务
    this.taskTypes.achievement.forEach(task => {
      if (task.type === type && !this.taskData.achievementTasks[task.id]?.completed) {
        if (!this.taskData.achievementTasks[task.id]) {
          this.taskData.achievementTasks[task.id] = { progress: 0, completed: false, claimed: false }
        }
        this.taskData.achievementTasks[task.id].progress = value

        // 检查是否完成
        if (this.taskData.achievementTasks[task.id].progress >= task.target) {
          this.taskData.achievementTasks[task.id].progress = task.target
          this.taskData.achievementTasks[task.id].completed = true
        }
        updated = true
      }
    })

    if (updated) {
      this.saveTaskData()
    }
  }

  /**
   * 领取任务奖励
   * @param {string} taskId - 任务ID
   * @param {string} category - 任务类别 'daily' 或 'achievement'
   */
  claimReward(taskId, category) {
    const tasks = category === 'daily' ? this.taskData.dailyTasks : this.taskData.achievementTasks
    const taskDef = this.taskTypes[category].find(t => t.id === taskId)

    if (!tasks[taskId] || !taskDef) {
      return { success: false, message: '任务不存在' }
    }

    if (!tasks[taskId].completed) {
      return { success: false, message: '任务未完成' }
    }

    if (tasks[taskId].claimed) {
      return { success: false, message: '奖励已领取' }
    }

    // 发放奖励
    if (this.userInfo) {
      this.userInfo.addScore(taskDef.reward)
    }

    // 标记为已领取
    tasks[taskId].claimed = true
    this.saveTaskData()

    return {
      success: true,
      message: '领取成功',
      reward: taskDef.reward
    }
  }

  /**
   * 获取任务列表
   * @param {string} category - 任务类别 'daily' 或 'achievement'
   */
  getTasks(category) {
    const taskDefs = this.taskTypes[category]
    const taskProgress = category === 'daily' ? this.taskData.dailyTasks : this.taskData.achievementTasks

    return taskDefs.map(task => {
      const progress = taskProgress[task.id] || { progress: 0, completed: false, claimed: false }
      return {
        ...task,
        currentProgress: progress.progress,
        completed: progress.completed,
        claimed: progress.claimed
      }
    })
  }

  /**
   * 获取任务统计
   */
  getTaskStats() {
    const dailyTasks = this.getTasks('daily')
    const achievementTasks = this.getTasks('achievement')

    const dailyCompleted = dailyTasks.filter(t => t.completed).length
    const dailyClaimed = dailyTasks.filter(t => t.claimed).length
    const achievementCompleted = achievementTasks.filter(t => t.completed).length
    const achievementClaimed = achievementTasks.filter(t => t.claimed).length

    return {
      daily: {
        total: dailyTasks.length,
        completed: dailyCompleted,
        claimed: dailyClaimed,
        canClaim: dailyCompleted - dailyClaimed
      },
      achievement: {
        total: achievementTasks.length,
        completed: achievementCompleted,
        claimed: achievementClaimed,
        canClaim: achievementCompleted - achievementClaimed
      }
    }
  }
}
