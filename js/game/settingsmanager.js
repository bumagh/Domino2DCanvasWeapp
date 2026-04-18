/**
 * 设置管理器
 * 管理游戏设置，包括音效、音乐、震动等
 */

export default class SettingsManager {
  constructor(databus) {
    this.databus = databus

    // 设置选项定义
    this.settingsConfig = {
      // 音效设置
      sound: {
        id: 'sound',
        name: '音效',
        description: '开启游戏音效',
        icon: '🔊',
        type: 'toggle',
        default: true
      },
      // 背景音乐设置
      music: {
        id: 'music',
        name: '背景音乐',
        description: '开启背景音乐',
        icon: '🎵',
        type: 'toggle',
        default: true
      },
      // 震动设置
      vibration: {
        id: 'vibration',
        name: '震动反馈',
        description: '开启震动反馈',
        icon: '📳',
        type: 'toggle',
        default: true
      },
      // 粒子效果设置
      particles: {
        id: 'particles',
        name: '粒子效果',
        description: '开启粒子特效',
        icon: '✨',
        type: 'toggle',
        default: true
      },
      // 高质量模式
      highQuality: {
        id: 'highQuality',
        name: '高质量模式',
        description: '开启高质量渲染',
        icon: '💎',
        type: 'toggle',
        default: false
      }
    }

    // 当前设置值
    this.settings = {}

    // 加载设置数据
    this.loadSettings()

    // 应用设置
    this.applySettings()
  }

  /**
   * 加载设置数据
   */
  loadSettings() {
    try {
      const data = wx.getStorageSync('gameSettings')
      if (data) {
        this.settings = data
      } else {
        // 使用默认值
        this.resetToDefaults()
      }
    } catch (e) {
      console.error('加载设置数据失败:', e)
      this.resetToDefaults()
    }
  }

  /**
   * 保存设置数据
   */
  saveSettings() {
    try {
      wx.setStorageSync('gameSettings', this.settings)
    } catch (e) {
      console.error('保存设置数据失败:', e)
    }
  }

  /**
   * 重置为默认值
   */
  resetToDefaults() {
    this.settings = {}
    Object.keys(this.settingsConfig).forEach(key => {
      this.settings[key] = this.settingsConfig[key].default
    })
    this.saveSettings()
  }

  /**
   * 获取设置值
   * @param {string} key - 设置键
   */
  getSetting(key) {
    return this.settings[key] !== undefined ? this.settings[key] : this.settingsConfig[key]?.default
  }

  /**
   * 设置值
   * @param {string} key - 设置键
   * @param {any} value - 设置值
   */
  setSetting(key, value) {
    if (this.settingsConfig[key]) {
      this.settings[key] = value
      this.saveSettings()
      this.applySetting(key, value)
      return { success: true }
    }
    return { success: false, message: '设置项不存在' }
  }

  /**
   * 切换设置值
   * @param {string} key - 设置键
   */
  toggleSetting(key) {
    if (this.settingsConfig[key] && this.settingsConfig[key].type === 'toggle') {
      const currentValue = this.getSetting(key)
      const newValue = !currentValue
      this.setSetting(key, newValue)
      return { success: true, value: newValue }
    }
    return { success: false, message: '设置项不存在或不是开关类型' }
  }

  /**
   * 应用所有设置
   */
  applySettings() {
    Object.keys(this.settings).forEach(key => {
      this.applySetting(key, this.settings[key])
    })
  }

  /**
   * 应用单个设置
   * @param {string} key - 设置键
   * @param {any} value - 设置值
   */
  applySetting(key, value) {
    switch (key) {
      case 'sound':
        // 音效设置（在游戏逻辑中处理）
        break
      case 'music':
        // 背景音乐设置
        if (this.databus && this.databus.main) {
          const bgm = this.databus.main.bgmAudio
          if (bgm) {
            if (value) {
              bgm.play()
            } else {
              bgm.pause()
            }
          }
        }
        break
      case 'vibration':
        // 震动设置
        break
      case 'particles':
        // 粒子效果设置
        break
      case 'highQuality':
        // 高质量模式设置
        break
    }
  }

  /**
   * 获取所有设置
   */
  getAllSettings() {
    const result = []
    Object.keys(this.settingsConfig).forEach(key => {
      const config = this.settingsConfig[key]
      result.push({
        ...config,
        value: this.getSetting(key)
      })
    })
    return result
  }

  /**
   * 播放音效（根据音效设置）
   * @param {string} soundId - 音效ID
   */
  playSound(soundId) {
    if (!this.getSetting('sound')) {
      return
    }
    // 在这里实现音效播放逻辑
    // 可以传入音效ID来播放不同的音效
  }

  /**
   * 触发震动（根据震动设置）
   */
  vibrate() {
    if (!this.getSetting('vibration')) {
      return
    }
    if (typeof wx !== 'undefined' && wx.vibrateShort) {
      wx.vibrateShort()
    }
  }
}
