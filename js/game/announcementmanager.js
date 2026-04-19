/**
 * 公告管理器
 * 管理游戏公告、版本更新和系统通知
 */

export default class AnnouncementManager {
  constructor(databus) {
    this.databus = databus

    // 当前版本
    this.currentVersion = '1.0.0'

    // 公告数据
    this.announcements = {
      // 系统公告
      system: [
        {
          id: 'sys_001',
          title: '欢迎来到多米诺骨牌',
          content: '感谢您下载游戏！请查看游戏规则和操作指南。',
          type: 'info',
          priority: 'high',
          date: '2026-04-18',
          isRead: false
        },
        {
          id: 'sys_002',
          title: '新功能上线',
          content: '七日签到、任务系统、商店功能现已上线！快来体验吧！',
          type: 'feature',
          priority: 'medium',
          date: '2026-04-18',
          isRead: false
        }
      ],
      // 活动公告
      activity: [
        {
          id: 'act_001',
          title: '新手福利',
          content: '新玩家注册即送1000积分，快来领取吧！',
          type: 'event',
          priority: 'high',
          date: '2026-04-18',
          isRead: false
        }
      ],
      // 更新公告
      update: [
        {
          id: 'upd_001',
          title: '版本1.0.0',
          content: '首发版本：包含基础游戏模式、签到系统、任务系统、商店系统等功能。',
          type: 'update',
          priority: 'medium',
          date: '2026-04-18',
          isRead: false
        }
      ]
    }

    // 已读公告记录
    this.readAnnouncements = {}

    // 加载已读记录
    this.loadReadAnnouncements()

    // 检查版本更新
    this.checkVersionUpdate()
  }

  /**
   * 加载已读公告记录
   */
  loadReadAnnouncements() {
    try {
      const data = wx.getStorageSync('readAnnouncements')
      if (data) {
        this.readAnnouncements = data
        // 更新公告的已读状态
        this.updateAnnouncementReadStatus()
      }
    } catch (e) {
      console.error('加载已读公告记录失败:', e)
    }
  }

  /**
   * 保存已读公告记录
   */
  saveReadAnnouncements() {
    try {
      wx.setStorageSync('readAnnouncements', this.readAnnouncements)
    } catch (e) {
      console.error('保存已读公告记录失败:', e)
    }
  }

  /**
   * 更新公告的已读状态
   */
  updateAnnouncementReadStatus() {
    Object.keys(this.announcements).forEach(category => {
      this.announcements[category].forEach(announcement => {
        if (this.readAnnouncements[announcement.id]) {
          announcement.isRead = true
        }
      })
    })
  }

  /**
   * 标记公告为已读
   * @param {string} announcementId - 公告ID
   */
  markAsRead(announcementId) {
    this.readAnnouncements[announcementId] = true
    this.saveReadAnnouncements()
    this.updateAnnouncementReadStatus()
  }

  /**
   * 标记所有公告为已读
   */
  markAllAsRead() {
    Object.keys(this.announcements).forEach(category => {
      this.announcements[category].forEach(announcement => {
        this.readAnnouncements[announcement.id] = true
        announcement.isRead = true
      })
    })
    this.saveReadAnnouncements()
  }

  /**
   * 获取未读公告数量
   */
  getUnreadCount() {
    let count = 0
    Object.keys(this.announcements).forEach(category => {
      this.announcements[category].forEach(announcement => {
        if (!announcement.isRead) {
          count++
        }
      })
    })
    return count
  }

  /**
   * 获取指定类别的公告
   * @param {string} category - 公告类别
   */
  getAnnouncements(category) {
    return this.announcements[category] || []
  }

  /**
   * 获取所有公告
   */
  getAllAnnouncements() {
    return this.announcements
  }

  /**
   * 添加新公告
   * @param {string} category - 公告类别
   * @param {object} announcement - 公告数据
   */
  addAnnouncement(category, announcement) {
    if (!this.announcements[category]) {
      this.announcements[category] = []
    }
    this.announcements[category].unshift(announcement)
  }

  /**
   * 检查版本更新
   */
  checkVersionUpdate() {
    try {
      const lastCheckedVersion = wx.getStorageSync('lastCheckedVersion')
      if (lastCheckedVersion !== this.currentVersion) {
        // 版本更新，显示更新公告
        wx.setStorageSync('lastCheckedVersion', this.currentVersion)
        return { hasUpdate: true, version: this.currentVersion }
      }
      return { hasUpdate: false, version: this.currentVersion }
    } catch (e) {
      console.error('检查版本更新失败:', e)
      return { hasUpdate: false, version: this.currentVersion }
    }
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion() {
    return this.currentVersion
  }

  /**
   * 获取公告类型图标
   * @param {string} type - 公告类型
   */
  getTypeIcon(type) {
    const icons = {
      info: '📢',
      feature: '✨',
      event: '🎉',
      update: '🔄',
      maintenance: '🔧',
      warning: '⚠️'
    }
    return icons[type] || '📋'
  }

  /**
   * 获取公告类型名称
   * @param {string} type - 公告类型
   */
  getTypeName(type) {
    const names = {
      info: '系统公告',
      feature: '新功能',
      event: '活动',
      update: '更新',
      maintenance: '维护',
      warning: '警告'
    }
    return names[type] || '公告'
  }
}
