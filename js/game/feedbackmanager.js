/**
 * 反馈管理器
 * 管理用户操作反馈（视觉、听觉、触觉）
 */

export default class FeedbackManager {
  constructor(databus, settingsManager) {
    this.databus = databus
    this.settingsManager = settingsManager

    // 反馈队列
    this.feedbackQueue = []

    // 浮动文字配置
    this.floatingTexts = []

    // 屏幕震动配置
    this.shakeConfig = {
      intensity: 0,
      duration: 0,
      offsetX: 0,
      offsetY: 0
    }

    // 粒子效果配置
    this.particles = []
  }

  /**
   * 添加浮动文字反馈
   * @param {string} text - 文字内容
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {string} color - 颜色
   * @param {number} size - 字体大小
   */
  addFloatingText(text, x, y, color = '#ffffff', size = 16) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      color: color,
      size: size,
      alpha: 1,
      velocityY: -1,
      lifetime: 60
    })
  }

  /**
   * 添加得分浮动文字
   * @param {number} score - 得分
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  addScoreFeedback(score, x, y) {
    const color = score > 0 ? '#00ff00' : '#ff0000'
    const prefix = score > 0 ? '+' : ''
    this.addFloatingText(`${prefix}${score}`, x, y, color, 20)
  }

  /**
   * 添加积分获得反馈
   * @param {number} amount - 积分数量
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  addPointsFeedback(amount, x, y) {
    this.addFloatingText(`+${amount} 积分`, x, y, '#FFD700', 18)
  }

  /**
   * 添加成就解锁反馈
   * @param {string} achievementName - 成就名称
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  addAchievementFeedback(achievementName, x, y) {
    this.addFloatingText(`🏆 ${achievementName}`, x, y, '#FFD700', 16)
  }

  /**
   * 添加购买成功反馈
   * @param {string} itemName - 物品名称
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  addPurchaseFeedback(itemName, x, y) {
    this.addFloatingText(`✓ 购买 ${itemName}`, x, y, '#00ff00', 14)
  }

  /**
   * 添加错误反馈
   * @param {string} message - 错误信息
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  addErrorFeedback(message, x, y) {
    this.addFloatingText(`✗ ${message}`, x, y, '#ff0000', 14)
  }

  /**
   * 触发屏幕震动
   * @param {number} intensity - 震动强度 (0-10)
   * @param {number} duration - 震动持续时间 (帧数)
   */
  triggerShake(intensity = 5, duration = 10) {
    if (this.settingsManager && !this.settingsManager.getSetting('vibration')) {
      return
    }
    this.shakeConfig.intensity = intensity
    this.shakeConfig.duration = duration
  }

  /**
   * 添加粒子效果
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {string} color - 粒子颜色
   * @param {number} count - 粒子数量
   * @param {string} type - 粒子类型 ('burst', 'trail', 'sparkle')
   */
  addParticles(x, y, color = '#ffffff', count = 10, type = 'burst') {
    for (let i = 0; i < count; i++) {
      let particle
      switch (type) {
        case 'burst':
          particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 4 + 2,
            color: color,
            alpha: 1,
            lifetime: 30
          }
          break
        case 'trail':
          particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2,
            size: Math.random() * 3 + 1,
            color: color,
            alpha: 1,
            lifetime: 20
          }
          break
        case 'sparkle':
          particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 2 + 1,
            color: color,
            alpha: 1,
            lifetime: 15
          }
          break
        default:
          particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: Math.random() * 3 + 2,
            color: color,
            alpha: 1,
            lifetime: 25
          }
      }
      this.particles.push(particle)
    }
  }

  /**
   * 添加连击反馈
   * @param {number} comboCount - 连击数
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  addComboFeedback(comboCount, x, y) {
    const colors = ['#ffffff', '#ffff00', '#ff8800', '#ff0088', '#ff00ff']
    const color = colors[Math.min(comboCount - 1, colors.length - 1)]
    this.addFloatingText(`${comboCount} 连击!`, x, y, color, 24)
    this.addParticles(x, y, color, 20, 'burst')
  }

  /**
   * 添加完成关卡反馈
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  addLevelCompleteFeedback(x, y) {
    this.addFloatingText('关卡完成!', x, y, '#00ff00', 28)
    this.addParticles(x, y, '#00ff00', 30, 'burst')
    this.triggerShake(3, 15)
  }

  /**
   * 添加失败反馈
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  addFailureFeedback(x, y) {
    this.addFloatingText('失败', x, y, '#ff0000', 24)
    this.addParticles(x, y, '#ff0000', 15, 'burst')
    this.triggerShake(5, 10)
  }

  /**
   * 更新所有反馈效果
   */
  update() {
    // 更新浮动文字
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i]
      text.y += text.velocityY
      text.alpha -= 0.015
      text.lifetime--

      if (text.lifetime <= 0 || text.alpha <= 0) {
        this.floatingTexts.splice(i, 1)
      }
    }

    // 更新屏幕震动
    if (this.shakeConfig.duration > 0) {
      this.shakeConfig.duration--
      this.shakeConfig.offsetX = (Math.random() - 0.5) * this.shakeConfig.intensity
      this.shakeConfig.offsetY = (Math.random() - 0.5) * this.shakeConfig.intensity
    } else {
      this.shakeConfig.offsetX = 0
      this.shakeConfig.offsetY = 0
    }

    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.1 // 重力
      particle.alpha -= 0.03
      particle.lifetime--

      if (particle.lifetime <= 0 || particle.alpha <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  /**
   * 绘制所有反馈效果
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  render(ctx) {
    // 应用震动偏移
    ctx.save()
    ctx.translate(this.shakeConfig.offsetX, this.shakeConfig.offsetY)

    // 绘制粒子
    this.particles.forEach(particle => {
      ctx.save()
      ctx.globalAlpha = particle.alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 绘制浮动文字
    this.floatingTexts.forEach(text => {
      ctx.save()
      ctx.globalAlpha = text.alpha
      ctx.fillStyle = text.color
      ctx.font = `bold ${text.size}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text.text, text.x, text.y)
      ctx.restore()
    })

    ctx.restore()
  }

  /**
   * 清除所有反馈效果
   */
  clear() {
    this.floatingTexts = []
    this.particles = []
    this.shakeConfig = {
      intensity: 0,
      duration: 0,
      offsetX: 0,
      offsetY: 0
    }
  }

  /**
   * 播放音效反馈
   * @param {string} soundType - 音效类型
   */
  playSound(soundType) {
    if (this.settingsManager && !this.settingsManager.getSetting('sound')) {
      return
    }

    // 这里可以根据音效类型播放不同的音效
    // 实际实现需要集成音频管理器
    switch (soundType) {
      case 'button_click':
        // 播放按钮点击音效
        break
      case 'score':
        // 播放得分音效
        break
      case 'combo':
        // 播放连击音效
        break
      case 'success':
        // 播放成功音效
        break
      case 'failure':
        // 播放失败音效
        break
      case 'achievement':
        // 播放成就解锁音效
        break
    }
  }

  /**
   * 触发触觉反馈
   * @param {string} vibrationType - 震动类型
   */
  triggerVibration(vibrationType) {
    if (this.settingsManager && !this.settingsManager.getSetting('vibration')) {
      return
    }

    if (typeof wx !== 'undefined' && wx.vibrateShort) {
      switch (vibrationType) {
        case 'light':
          wx.vibrateShort({ success: () => {} })
          break
        case 'medium':
          wx.vibrateShort({ success: () => {} })
          break
        case 'heavy':
          wx.vibrateLong({ success: () => {} })
          break
      }
    }
  }
}
