/**
 * 七日签到管理器
 * 管理用户的签到数据、奖励发放、每日重置等功能
 */

export default class SignInManager {
  constructor(databus, userInfo) {
    this.databus = databus
    this.userInfo = userInfo

    // 七日签到奖励配置
    this.signInRewards = [
      { day: 1, reward: 10, type: 'score', icon: '🎁', description: '10积分' },
      { day: 2, reward: 15, type: 'score', icon: '🎁', description: '15积分' },
      { day: 3, reward: 20, type: 'score', icon: '🎁', description: '20积分' },
      { day: 4, reward: 25, type: 'score', icon: '🎁', description: '25积分' },
      { day: 5, reward: 30, type: 'score', icon: '🎁', description: '30积分' },
      { day: 6, reward: 35, type: 'score', icon: '🎁', description: '35积分' },
      { day: 7, reward: 50, type: 'score', icon: '🎁', description: '50积分（大奖）' }
    ]

    // 签到数据
    this.signInData = {
      consecutiveDays: 0,      // 连续签到天数
      lastSignInDate: null,    // 上次签到日期
      isSignedToday: false,    // 今天是否已签到
      signInHistory: [],        // 签到历史记录
      totalSignInDays: 0       // 累计签到天数
    }

    // 加载签到数据
    this.loadSignInData()

    // 检查是否需要重置
    this.checkDailyReset()
  }

  /**
   * 加载签到数据
   */
  loadSignInData() {
    try {
      const data = wx.getStorageSync('signInData')
      if (data) {
        this.signInData = data
      }
    } catch (e) {
      console.error('加载签到数据失败:', e)
    }
  }

  /**
   * 保存签到数据
   */
  saveSignInData() {
    try {
      wx.setStorageSync('signInData', this.signInData)
    } catch (e) {
      console.error('保存签到数据失败:', e)
    }
  }

  /**
   * 检查是否需要每日重置
   */
  checkDailyReset() {
    const today = this.getTodayDate()
    const lastDate = this.signInData.lastSignInDate

    if (lastDate) {
      const lastDay = new Date(lastDate)
      const currentDay = new Date(today)

      // 检查是否是新的一天
      if (lastDay.getDate() !== currentDay.getDate() ||
          lastDay.getMonth() !== currentDay.getMonth() ||
          lastDay.getFullYear() !== currentDay.getFullYear()) {
        // 检查是否中断（超过1天未签到）
        const diffTime = currentDay.getTime() - lastDay.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 1) {
          // 中断超过1天，重置连续签到天数
          this.signInData.consecutiveDays = 0
        }

        // 重置今日签到状态
        this.signInData.isSignedToday = false
        this.saveSignInData()
      }
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
   * 执行签到
   */
  signIn() {
    // 检查今天是否已签到
    if (this.signInData.isSignedToday) {
      return { success: false, message: '今日已签到', reward: 0 }
    }

    const today = this.getTodayDate()

    // 更新签到数据
    this.signInData.consecutiveDays++
    this.signInData.lastSignInDate = today
    this.signInData.isSignedToday = true
    this.signInData.totalSignInDays++

    // 计算奖励（7天一个循环）
    const dayIndex = (this.signInData.consecutiveDays - 1) % 7
    const rewardData = this.signInRewards[dayIndex]
    const reward = rewardData.reward

    // 发放奖励
    if (this.userInfo) {
      this.userInfo.addScore(reward)
    }

    // 添加到签到历史
    this.signInData.signInHistory.push({
      date: today,
      day: this.signInData.consecutiveDays,
      reward: reward
    })

    // 保存签到数据
    this.saveSignInData()

    return {
      success: true,
      message: '签到成功',
      reward: reward,
      consecutiveDays: this.signInData.consecutiveDays,
      rewardData: rewardData
    }
  }

  /**
   * 获取签到状态
   */
  getSignInStatus() {
    this.checkDailyReset()
    return {
      isSignedToday: this.signInData.isSignedToday,
      consecutiveDays: this.signInData.consecutiveDays,
      totalSignInDays: this.signInData.totalSignInDays,
      canSignIn: !this.signInData.isSignedToday
    }
  }

  /**
   * 获取七日签到奖励信息
   */
  getSignInRewards() {
    return this.signInRewards
  }

  /**
   * 获取当前应该领取的奖励
   */
  getCurrentReward() {
    const dayIndex = this.signInData.consecutiveDays % 7
    return this.signInRewards[dayIndex]
  }

  /**
   * 重置签到数据（用于测试）
   */
  resetSignInData() {
    this.signInData = {
      consecutiveDays: 0,
      lastSignInDate: null,
      isSignedToday: false,
      signInHistory: [],
      totalSignInDays: 0
    }
    this.saveSignInData()
  }
}
