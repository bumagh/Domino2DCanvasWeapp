/**
 * 内存管理器
 * 监控和优化内存使用
 */

export default class MemoryManager {
  constructor() {
    // 内存使用统计
    this.memoryStats = {
      used: 0,
      peak: 0,
      warningThreshold: 50 * 1024 * 1024, // 50MB
      criticalThreshold: 80 * 1024 * 1024 // 80MB
    }

    // 资源使用追踪
    this.resourceUsage = {
      images: 0,
      sounds: 0,
      data: 0,
      particles: 0
    }

    // 清理策略
    this.cleanupInterval = 30000 // 30秒
    this.lastCleanupTime = Date.now()
  }

  /**
   * 获取当前内存使用情况
   */
  getMemoryUsage() {
    if (typeof wx !== 'undefined' && wx.getPerformance) {
      const perf = wx.getPerformance()
      if (perf.memory) {
        return {
          used: perf.memory.usedJSHeapSize,
          total: perf.memory.totalJSHeapSize,
          limit: perf.memory.jsHeapSizeLimit
        }
      }
    }

    // 估算内存使用
    const estimated = this.estimateMemoryUsage()
    return {
      used: estimated,
      total: estimated * 1.5,
      limit: estimated * 2
    }
  }

  /**
   * 估算内存使用
   */
  estimateMemoryUsage() {
    let total = 0

    // 粒子系统
    total += this.resourceUsage.particles

    // 图片和数据
    total += this.resourceUsage.images
    total += this.resourceUsage.sounds
    total += this.resourceUsage.data

    return total
  }

  /**
   * 更新资源使用统计
   */
  updateResourceUsage(type, size) {
    if (this.resourceUsage[type] !== undefined) {
      this.resourceUsage[type] += size
    }

    this.memoryStats.used = this.estimateMemoryUsage()
    if (this.memoryStats.used > this.memoryStats.peak) {
      this.memoryStats.peak = this.memoryStats.used
    }
  }

  /**
   * 检查是否需要清理内存
   */
  needsCleanup() {
    const now = Date.now()
    const timeSinceCleanup = now - this.lastCleanupTime

    // 定期清理
    if (timeSinceCleanup > this.cleanupInterval) {
      return true
    }

    // 内存超过阈值
    if (this.memoryStats.used > this.memoryStats.warningThreshold) {
      return true
    }

    return false
  }

  /**
   * 执行内存清理
   */
  performCleanup(resourceManager, feedbackManager, menu) {
    console.log('执行内存清理...')

    // 清理过期缓存
    if (resourceManager) {
      const cacheSize = resourceManager.getCacheSize()
      if (cacheSize > 10 * 1024 * 1024) { // 超过10MB
        resourceManager.clearCacheByType('data')
        console.log('已清理数据缓存')
      }
    }

    // 清理粒子效果
    if (feedbackManager) {
      feedbackManager.clear()
      this.resourceUsage.particles = 0
      console.log('已清理粒子效果')
    }

    // 清理菜单粒子
    if (menu && menu.animations && menu.animations.particles) {
      menu.animations.particles = []
      console.log('已清理菜单粒子')
    }

    // 强制垃圾回收（如果支持）
    if (typeof wx !== 'undefined' && wx.triggerGC) {
      wx.triggerGC()
      console.log('已触发垃圾回收')
    }

    this.lastCleanupTime = Date.now()
    this.memoryStats.used = this.estimateMemoryUsage()

    console.log(`内存清理完成，当前使用: ${(this.memoryStats.used / 1024 / 1024).toFixed(2)}MB`)
  }

  /**
   * 获取内存状态
   */
  getMemoryStatus() {
    const usage = this.getMemoryUsage()
    const ratio = usage.used / usage.limit

    if (ratio > 0.8) {
      return 'critical'
    } else if (ratio > 0.6) {
      return 'warning'
    } else if (ratio > 0.4) {
      return 'moderate'
    } else {
      return 'good'
    }
  }

  /**
   * 获取内存报告
   */
  getMemoryReport() {
    const usage = this.getMemoryUsage()
    const status = this.getMemoryStatus()

    return {
      status: status,
      used: usage.used,
      total: usage.total,
      limit: usage.limit,
      usedMB: (usage.used / 1024 / 1024).toFixed(2),
      totalMB: (usage.total / 1024 / 1024).toFixed(2),
      limitMB: (usage.limit / 1024 / 1024).toFixed(2),
      peakMB: (this.memoryStats.peak / 1024 / 1024).toFixed(2),
      resourceUsage: this.resourceUsage
    }
  }

  /**
   * 设置内存阈值
   */
  setThresholds(warning, critical) {
    if (warning) this.memoryStats.warningThreshold = warning
    if (critical) this.memoryStats.criticalThreshold = critical
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.memoryStats = {
      used: 0,
      peak: 0,
      warningThreshold: 50 * 1024 * 1024,
      criticalThreshold: 80 * 1024 * 1024
    }
    this.resourceUsage = {
      images: 0,
      sounds: 0,
      data: 0,
      particles: 0
    }
  }
}
