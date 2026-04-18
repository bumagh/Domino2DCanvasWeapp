/**
 * 用户信息模块
 * 用于处理玩家头像、昵称和积分的逻辑和显示
 */

import { ensureUserProfile, getCachedProfile } from './auth.js'

export default class UserInfo {
  constructor(databus) {
    this.databus = databus
    this.profile = null
    this.score = databus.score || 1000
    
    // UI位置配置
    this.uiPositions = {
      avatar: { x: 20, y: 50, size: 40 },
      nickname: { x: 70, y: 65 },
      score: { x: 200, y: 120 },
      level: { x: 70, y: 85 }
    }
    
    // 用户等级系统
    this.levelConfig = {
      1: { name: '新手', minScore: 0, color: '#888888' },
      2: { name: '初学者', minScore: 50, color: '#00aa00' },
      3: { name: '熟练者', minScore: 150, color: '#0088ff' },
      4: { name: '专家', minScore: 300, color: '#ff8800' },
      5: { name: '大师', minScore: 500, color: '#ff0088' }
    }
    
    this.init()
  }

  /**
   * 初始化用户信息
   */
  async init() {
    // 先尝试从缓存获取
    const cachedProfile = getCachedProfile()
    if (cachedProfile) {
      this.profile = cachedProfile
    } else {
      // 如果没有缓存，尝试获取用户信息
      try {
        this.profile = await ensureUserProfile('用于展示玩家信息')
      } catch (error) {
        console.warn('获取用户信息失败，使用默认信息', error)
        this.profile = {
          nickName: '游客',
          avatarUrl: '',
          isAuthorized: false
        }
      }
    }
  }

  /**
   * 更新积分
   */
  updateScore(newScore) {
    this.score = newScore
    if (this.databus) {
      this.databus.score = newScore
    }
  }

  /**
   * 增加积分
   */
  addScore(amount) {
    this.score += amount
    if (this.databus) {
      this.databus.score = this.score
    }
    return this.score
  }

  /**
   * 减少积分
   */
  subtractScore(amount) {
    if (this.score >= amount) {
      this.score -= amount
      if (this.databus) {
        this.databus.score = this.score
      }
      return true
    }
    return false
  }

  /**
   * 获取当前用户等级
   */
  getLevel() {
    for (let level = 5; level >= 1; level--) {
      if (this.score >= this.levelConfig[level].minScore) {
        return {
          level: level,
          ...this.levelConfig[level]
        }
      }
    }
    return {
      level: 1,
      ...this.levelConfig[1]
    }
  }

  /**
   * 更新用户昵称
   */
  updateNickname(newNickname) {
    if (this.profile) {
      this.profile.nickName = newNickname
      // 这里可以添加保存到本地存储的逻辑
    }
  }

  /**
   * 更新用户头像
   */
  updateAvatar(newAvatarUrl) {
    if (this.profile) {
      this.profile.avatarUrl = newAvatarUrl
      // 这里可以添加保存到本地存储的逻辑
    }
  }

  /**
   * 绘制头像
   */
  drawAvatar(ctx) {
    const { x, y, size } = this.uiPositions.avatar
    
    // 绘制头像背景圆圈
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制头像边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2)
    ctx.stroke()
    
    // 如果有头像URL，尝试绘制头像
    if (this.profile?.avatarUrl) {
      // 在微信小游戏环境中，可以使用wx.createImage()来加载图片
      if (typeof wx !== 'undefined' && wx.createImage) {
        const img = wx.createImage()
        img.src = this.profile.avatarUrl
        img.onload = () => {
          // 绘制圆形头像
          ctx.save()
          ctx.beginPath()
          ctx.arc(x + size/2, y + size/2, size/2 - 2, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(img, x, y, size, size)
          ctx.restore()
        }
      }
    } else {
      // 没有头像时显示默认图标
      ctx.fillStyle = '#666666'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('👤', x + size/2, y + size/2)
    }
  }

  /**
   * 绘制昵称
   */
  drawNickname(ctx) {
    const { x, y } = this.uiPositions.nickname
    const nickname = this.profile?.nickName || '游客'
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(nickname, x, y)
  }

  /**
   * 绘制等级信息
   */
  drawLevel(ctx) {
    const { x, y } = this.uiPositions.level
    const levelInfo = this.getLevel()
    
    ctx.fillStyle = levelInfo.color
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Lv.${levelInfo.level} ${levelInfo.name}`, x, y)
  }

  /**
   * 绘制积分信息
   */
  drawScore(ctx) {
    const { x, y } = this.uiPositions.score
    
    ctx.fillStyle = '#ffff88'
    ctx.font = '18px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`积分: ${this.score}`, x, y)
  }

  /**
   * 绘制完整的用户信息区域
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!ctx) return
    
    // 绘制用户信息背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(10, 40, canvasWidth - 20, 60)
    
    // 绘制各个组件
    this.drawAvatar(ctx)
    this.drawNickname(ctx)
    this.drawLevel(ctx)
    this.drawScore(ctx)
  }

  /**
   * 检查点击是否在用户信息区域内
   */
  isPointInUserInfo(x, y) {
    return x >= 10 && x <= 350 && y >= 40 && y <= 100
  }

  /**
   * 处理用户信息区域的点击事件
   */
  handleClick(x, y) {
    if (!this.isPointInUserInfo(x, y)) {
      return null
    }
    
    // 检查是否点击头像区域
    const avatarArea = this.uiPositions.avatar
    if (x >= avatarArea.x && x <= avatarArea.x + avatarArea.size &&
        y >= avatarArea.y && y <= avatarArea.y + avatarArea.size) {
      return 'avatar'
    }
    
    return 'userinfo'
  }

  /**
   * 显示用户详情弹窗
   */
  showUserDetailModal() {
    // 这里可以实现一个显示用户详细信息的弹窗
    // 包括总积分、等级、游戏统计等
    return {
      title: '玩家信息',
      nickname: this.profile?.nickName || '游客',
      score: this.score,
      level: this.getLevel(),
      isAuthorized: this.profile?.isAuthorized || false
    }
  }

  /**
   * 获取用户数据摘要
   */
  getUserSummary() {
    return {
      nickname: this.profile?.nickName || '游客',
      avatarUrl: this.profile?.avatarUrl || '',
      score: this.score,
      level: this.getLevel(),
      isAuthorized: this.profile?.isAuthorized || false
    }
  }
}
