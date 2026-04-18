/**
 * 资源管理器
 * 管理资源预加载和缓存
 */

export default class ResourceManager {
  constructor() {
    // 资源缓存
    this.cache = {
      images: {},
      sounds: {},
      data: {}
    }

    // 资源队列
    this.loadQueue = []
    this.loadedCount = 0
    this.totalCount = 0

    // 加载状态
    this.isLoading = false
    this.onProgress = null
    this.onComplete = null
  }

  /**
   * 预加载资源
   * @param {Array} resources - 资源列表
   * @param {Function} onProgress - 进度回调
   * @param {Function} onComplete - 完成回调
   */
  preload(resources, onProgress = null, onComplete = null) {
    this.loadQueue = resources
    this.totalCount = resources.length
    this.loadedCount = 0
    this.isLoading = true
    this.onProgress = onProgress
    this.onComplete = onComplete

    this.loadNext()
  }

  /**
   * 加载下一个资源
   */
  loadNext() {
    if (this.loadedCount >= this.totalCount) {
      this.isLoading = false
      if (this.onComplete) {
        this.onComplete()
      }
      return
    }

    const resource = this.loadQueue[this.loadedCount]

    switch (resource.type) {
      case 'image':
        this.loadImage(resource)
        break
      case 'sound':
        this.loadSound(resource)
        break
      case 'data':
        this.loadData(resource)
        break
      default:
        console.warn(`Unknown resource type: ${resource.type}`)
        this.onResourceLoaded()
    }
  }

  /**
   * 加载图片
   */
  loadImage(resource) {
    const img = new Image()
    img.src = resource.url

    img.onload = () => {
      this.cache.images[resource.key] = img
      this.onResourceLoaded()
    }

    img.onerror = () => {
      console.error(`Failed to load image: ${resource.url}`)
      this.onResourceLoaded()
    }
  }

  /**
   * 加载音频
   */
  loadSound(resource) {
    // 微信小游戏环境
    if (typeof wx !== 'undefined' && wx.createInnerAudioContext) {
      const audio = wx.createInnerAudioContext()
      audio.src = resource.url
      audio.loop = resource.loop || false

      audio.onCanplay = () => {
        this.cache.sounds[resource.key] = audio
        this.onResourceLoaded()
      }

      audio.onError = (err) => {
        console.error(`Failed to load sound: ${resource.url}`, err)
        this.onResourceLoaded()
      }
    } else if (typeof Audio !== 'undefined') {
      // H5环境
      const audio = new Audio(resource.url)
      audio.loop = resource.loop || false

      audio.oncanplaythrough = () => {
        this.cache.sounds[resource.key] = audio
        this.onResourceLoaded()
      }

      audio.onerror = () => {
        console.error(`Failed to load sound: ${resource.url}`)
        this.onResourceLoaded()
      }
    } else {
      console.warn('Audio not supported')
      this.onResourceLoaded()
    }
  }

  /**
   * 加载数据
   */
  loadData(resource) {
    if (typeof wx !== 'undefined' && wx.request) {
      wx.request({
        url: resource.url,
        success: (res) => {
          this.cache.data[resource.key] = res.data
          this.onResourceLoaded()
        },
        fail: (err) => {
          console.error(`Failed to load data: ${resource.url}`, err)
          this.onResourceLoaded()
        }
      })
    } else if (typeof fetch !== 'undefined') {
      fetch(resource.url)
        .then(response => response.json())
        .then(data => {
          this.cache.data[resource.key] = data
          this.onResourceLoaded()
        })
        .catch(err => {
          console.error(`Failed to load data: ${resource.url}`, err)
          this.onResourceLoaded()
        })
    } else {
      console.warn('Data loading not supported')
      this.onResourceLoaded()
    }
  }

  /**
   * 资源加载完成回调
   */
  onResourceLoaded() {
    this.loadedCount++

    if (this.onProgress) {
      const progress = this.loadedCount / this.totalCount
      this.onProgress(progress, this.loadedCount, this.totalCount)
    }

    this.loadNext()
  }

  /**
   * 获取缓存的图片
   */
  getImage(key) {
    return this.cache.images[key] || null
  }

  /**
   * 获取缓存的音频
   */
  getSound(key) {
    return this.cache.sounds[key] || null
  }

  /**
   * 获取缓存的数据
   */
  getData(key) {
    return this.cache.data[key] || null
  }

  /**
   * 清除资源缓存
   */
  clearCache() {
    this.cache = {
      images: {},
      sounds: {},
      data: {}
    }
  }

  /**
   * 清除特定类型的缓存
   */
  clearCacheByType(type) {
    if (this.cache[type]) {
      this.cache[type] = {}
    }
  }

  /**
   * 获取缓存大小（估算）
   */
  getCacheSize() {
    let size = 0

    // 图片缓存大小
    for (let key in this.cache.images) {
      const img = this.cache.images[key]
      if (img.width && img.height) {
        size += img.width * img.height * 4 // RGBA
      }
    }

    // 数据缓存大小
    for (let key in this.cache.data) {
      try {
        size += JSON.stringify(this.cache.data[key]).length * 2 // UTF-16
      } catch (e) {
        // 忽略序列化错误
      }
    }

    return size
  }

  /**
   * 保存缓存到本地存储
   */
  saveCacheToStorage() {
    try {
      // 只保存数据缓存，不保存图片和音频（太大）
      wx.setStorageSync('resourceCache', this.cache.data)
      return true
    } catch (e) {
      console.error('Failed to save cache to storage:', e)
      return false
    }
  }

  /**
   * 从本地存储加载缓存
   */
  loadCacheFromStorage() {
    try {
      const cachedData = wx.getStorageSync('resourceCache')
      if (cachedData) {
        this.cache.data = { ...this.cache.data, ...cachedData }
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to load cache from storage:', e)
      return false
    }
  }

  /**
   * 获取加载进度
   */
  getProgress() {
    if (this.totalCount === 0) return 0
    return this.loadedCount / this.totalCount
  }

  /**
   * 检查资源是否已缓存
   */
  isCached(key, type) {
    if (!this.cache[type]) return false
    return !!this.cache[type][key]
  }

  /**
   * 批量检查缓存状态
   */
  checkCacheStatus(resources) {
    const status = {}
    resources.forEach(resource => {
      status[resource.key] = this.isCached(resource.key, resource.type)
    })
    return status
  }
}
