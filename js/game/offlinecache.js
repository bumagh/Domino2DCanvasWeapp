/**
 * 离线缓存管理器
 * 管理离线数据和缓存同步
 */

export default class OfflineCache {
  constructor() {
    // 缓存版本
    this.cacheVersion = '1.0.0'
    this.cacheKey = 'offline_cache'

    // 缓存数据
    this.cache = {
      version: this.cacheVersion,
      lastSync: 0,
      data: {
        levels: {},
        userData: {},
        gameConfig: {},
        resources: {}
      }
    }

    // 同步状态
    this.isOnline = true
    this.syncInProgress = false
    this.syncQueue = []
  }

  /**
   * 初始化缓存
   */
  init() {
    try {
      const cached = wx.getStorageSync(this.cacheKey)
      if (cached && cached.version === this.cacheVersion) {
        this.cache = cached
        console.log('离线缓存加载成功')
      } else {
        this.clearCache()
        console.log('缓存版本不匹配，已清除')
      }
    } catch (e) {
      console.error('加载离线缓存失败:', e)
    }

    // 监听网络状态
    this.setupNetworkListener()
  }

  /**
   * 设置网络监听
   */
  setupNetworkListener() {
    if (typeof wx !== 'undefined' && wx.onNetworkStatusChange) {
      wx.onNetworkStatusChange((res) => {
        this.isOnline = res.isConnected
        if (this.isOnline && this.syncQueue.length > 0) {
          this.syncQueue.forEach(task => task())
          this.syncQueue = []
        }
      })
    }
  }

  /**
   * 保存缓存到本地
   */
  saveCache() {
    try {
      this.cache.lastSync = Date.now()
      wx.setStorageSync(this.cacheKey, this.cache)
      return true
    } catch (e) {
      console.error('保存离线缓存失败:', e)
      return false
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = {
      version: this.cacheVersion,
      lastSync: 0,
      data: {
        levels: {},
        userData: {},
        gameConfig: {},
        resources: {}
      }
    }
    try {
      wx.removeStorageSync(this.cacheKey)
    } catch (e) {
      console.error('清除离线缓存失败:', e)
    }
  }

  /**
   * 获取缓存数据
   */
  get(category, key) {
    if (!this.cache.data[category]) {
      return null
    }
    return this.cache.data[category][key] || null
  }

  /**
   * 设置缓存数据
   */
  set(category, key, value) {
    if (!this.cache.data[category]) {
      this.cache.data[category] = {}
    }
    this.cache.data[category][key] = value
    this.saveCache()
  }

  /**
   * 删除缓存数据
   */
  remove(category, key) {
    if (this.cache.data[category] && this.cache.data[category][key]) {
      delete this.cache.data[category][key]
      this.saveCache()
    }
  }

  /**
   * 批量设置缓存
   */
  setBatch(category, data) {
    if (!this.cache.data[category]) {
      this.cache.data[category] = {}
    }
    Object.assign(this.cache.data[category], data)
    this.saveCache()
  }

  /**
   * 检查数据是否已缓存
   */
  has(category, key) {
    return this.get(category, key) !== null
  }

  /**
   * 获取缓存大小
   */
  getCacheSize() {
    try {
      const str = JSON.stringify(this.cache)
      return new Blob([str]).size
    } catch (e) {
      return 0
    }
  }

  /**
   * 同步到服务器
   */
  syncToServer(data, callback) {
    if (!this.isOnline) {
      // 离线时加入同步队列
      this.syncQueue.push(() => this.syncToServer(data, callback))
      callback({ success: false, offline: true })
      return
    }

    if (this.syncInProgress) {
      callback({ success: false, busy: true })
      return
    }

    this.syncInProgress = true

    // 模拟服务器同步
    setTimeout(() => {
      this.syncInProgress = false
      this.cache.lastSync = Date.now()
      this.saveCache()
      callback({ success: true })
    }, 1000)
  }

  /**
   * 从服务器同步
   */
  syncFromServer(callback) {
    if (!this.isOnline) {
      callback({ success: false, offline: true })
      return
    }

    if (this.syncInProgress) {
      callback({ success: false, busy: true })
      return
    }

    this.syncInProgress = true

    // 模拟从服务器获取数据
    setTimeout(() => {
      this.syncInProgress = false
      this.cache.lastSync = Date.now()
      this.saveCache()
      callback({ success: true, data: {} })
    }, 1000)
  }

  /**
   * 获取缓存状态
   */
  getStatus() {
    return {
      version: this.cache.version,
      lastSync: this.cache.lastSync,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      syncQueueSize: this.syncQueue.length,
      cacheSize: this.getCacheSize(),
      dataCategories: Object.keys(this.cache.data)
    }
  }

  /**
   * 预加载数据到缓存
   */
  preloadData(data) {
    Object.keys(data).forEach(category => {
      if (this.cache.data[category]) {
        Object.assign(this.cache.data[category], data[category])
      }
    })
    this.saveCache()
  }

  /**
   * 导出缓存数据
   */
  exportCache() {
    return JSON.stringify(this.cache)
  }

  /**
   * 导入缓存数据
   */
  importCache(cacheString) {
    try {
      const imported = JSON.parse(cacheString)
      if (imported.version === this.cacheVersion) {
        this.cache = imported
        this.saveCache()
        return true
      }
      return false
    } catch (e) {
      console.error('导入缓存失败:', e)
      return false
    }
  }
}
