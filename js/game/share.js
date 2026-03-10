/**
 * 分享功能模块
 * 负责游戏结束后的分享功能
 */
export default class ShareManager {
  constructor() {
    this.lastShareTime = 0
    this.debounceDelay = 300  // 防抖延迟(ms)
    this.defaultShareImage = 'images/share-default.png'
  }

  /**
   * 防抖检查
   * @returns {boolean} 是否可以分享
   */
  canShare() {
    const now = Date.now()
    if (now - this.lastShareTime < this.debounceDelay) {
      return false
    }
    this.lastShareTime = now
    return true
  }

  /**
   * 执行分享
   * @param {Object} options
   * @param {number} options.score - 本局分数
   * @param {HTMLCanvasElement} options.canvas - 游戏Canvas
   * @param {CanvasRenderingContext2D} options.ctx - Canvas上下文
   * @returns {Promise<boolean>} 分享是否成功触发
   */
  async share({ score, canvas, ctx }) {
    // 1. 防抖检查
    if (!this.canShare()) {
      console.log('[ShareManager] 分享冷却中')
      return false
    }

    // 2. 生成分享图片
    let imageUrl
    try {
      imageUrl = await this.generateShareImage(canvas, score, ctx)
    } catch (err) {
      console.warn('[ShareManager] 生成分享图片失败，使用预设图片', err)
      imageUrl = this.defaultShareImage
    }

    // 3. 构造分享标题
    const title = `我在多米诺骨牌中获得了 ${score} 分！来挑战我吧！`

    // 4. 调用微信分享
    this.callWxShare(title, imageUrl)

    return true
  }

  /**
   * 生成分享截图
   * @param {HTMLCanvasElement} canvas - 游戏Canvas
   * @param {number} score - 分数
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @returns {Promise<string>} 临时文件路径
   */
  generateShareImage(canvas, score, ctx) {
    return new Promise((resolve, reject) => {
      try {
        // 保存当前Canvas状态
        ctx.save()

        // 在Canvas底部绘制分数叠加层
        const overlayHeight = 80
        const overlayY = canvas.height - overlayHeight

        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, overlayY, canvas.width, overlayHeight)

        // 分数文字
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 36px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`🏆 ${score} 分`, canvas.width / 2, overlayY + overlayHeight / 2)

        // 截图
        canvas.toTempFilePath({
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
          destWidth: 500,
          destHeight: 400,
          fileType: 'jpg',
          quality: 0.8,
          success: (res) => {
            ctx.restore()
            console.log('[ShareManager] 截图成功:', res.tempFilePath)
            resolve(res.tempFilePath)
          },
          fail: (err) => {
            ctx.restore()
            console.warn('[ShareManager] 截图失败:', err)
            reject(err)
          }
        })
      } catch (err) {
        console.warn('[ShareManager] 截图异常:', err)
        reject(err)
      }
    })
  }

  /**
   * 调用微信分享API
   * @param {string} title - 分享标题
   * @param {string} imageUrl - 分享图片路径
   */
  callWxShare(title, imageUrl) {
    try {
      wx.shareAppMessage({
        title: title,
        imageUrl: imageUrl,
        query: ''
      })
      console.log('[ShareManager] 分享调用成功')
    } catch (err) {
      console.error('[ShareManager] 分享调用失败:', err)
    }
  }
}
