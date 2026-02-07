/**
 * 广告管理器
 * 封装所有广告相关功能
 */
export default class AdManager {
  constructor() {
    this.videoAd = null
    this.interstitialAd = null
    this.bannerAd = null
    
    this.adUnitIds = {
      rewardedVideo: 'adunit-6ff1555f4a0af86e',
      interstitial: 'adunit-fcad3142b45b5aa6',
      banner: 'adunit-680ebf307f326a0f'
    }
  }

  /**
   * 初始化所有广告
   */
  init() {
    this.initRewardedVideoAd()
    this.initInterstitialAd()
    this.initBannerAd()
    
    console.log('广告管理器初始化完成')
  }

  /**
   * 初始化激励视频广告
   */
  initRewardedVideoAd() {
    if (!wx.createRewardedVideoAd) return

    this.videoAd = wx.createRewardedVideoAd({
      adUnitId: this.adUnitIds.rewardedVideo
    })

    // 监听广告加载
    this.videoAd.onLoad(() => {
      console.log('激励视频广告加载成功')
      this.onAdLoadSuccess?.()
    })

    // 监听广告错误
    this.videoAd.onError((err) => {
      console.error('激励视频广告加载失败', err)
      this.onAdLoadError?.(err)
    })

    // 监听广告关闭
    this.videoAd.onClose((res) => {
      if (res && res.isEnded) {
        // 正常播放结束，发放奖励
        this.onAdReward?.()
      } else {
        // 用户中途关闭
        this.onAdIncomplete?.()
      }
    })
  }

  /**
   * 初始化插屏广告
   */
  initInterstitialAd() {
    if (!wx.createInterstitialAd) return

    this.interstitialAd = wx.createInterstitialAd({
      adUnitId: this.adUnitIds.interstitial
    })

    this.interstitialAd.onLoad(() => {
      console.log('插屏广告加载成功')
    })

    this.interstitialAd.onError(() => {
      console.log('插屏广告加载失败')
    })
  }

  /**
   * 初始化横幅广告
   */
  initBannerAd() {
    if (!wx.createBannerAd) return

    this.bannerAd = wx.createBannerAd({
      adUnitId: this.adUnitIds.banner,
      style: {
        left: canvas.width / 2 - 175,
        top: canvas.height - 150,
        width: 350
      }
    })

    // 监听 banner 广告加载事件
    this.bannerAd.onLoad(() => {
      console.log('banner 广告加载成功')
    })

    // 监听 banner 广告错误事件
    this.bannerAd.onError((err) => {
      console.error('banner 广告错误', err)
    })
  }

  /**
   * 显示激励视频广告
   */
  showRewardedVideo() {
    if (!this.videoAd) {
      this.onAdNotAvailable?.()
      return Promise.reject(new Error('广告功能暂不可用'))
    }

    return this.videoAd.show()
      .catch(() => {
        // 失败重试，先加载广告
        return this.videoAd.load()
          .then(() => this.videoAd.show())
          .catch((err) => {
            console.error('激励视频广告显示失败', err)
            this.onAdShowError?.(err)
            throw err
          })
      })
  }

  /**
   * 显示插屏广告
   */
  showInterstitial() {
    if (!this.interstitialAd) {
      return Promise.resolve()
    }

    return this.interstitialAd.show()
      .catch((err) => {
        console.error('插屏广告显示失败', err)
        this.onInterstitialError?.(err)
        return Promise.resolve()
      })
  }

  /**
   * 显示横幅广告
   */
  showBanner() {
    this.bannerAd?.show()
  }

  /**
   * 隐藏横幅广告
   */
  hideBanner() {
    this.bannerAd?.hide()
  }

  /**
   * 设置事件回调
   */
  setCallbacks(callbacks) {
    this.onAdLoadSuccess = callbacks.onLoadSuccess
    this.onAdLoadError = callbacks.onLoadError
    this.onAdReward = callbacks.onReward
    this.onAdIncomplete = callbacks.onIncomplete
    this.onAdShowError = callbacks.onShowError
    this.onAdNotAvailable = callbacks.onNotAvailable
    this.onInterstitialError = callbacks.onInterstitialError
  }

  /**
   * 销毁广告
   */
  destroy() {
    this.videoAd?.destroy?.()
    this.interstitialAd?.destroy?.()
    this.bannerAd?.destroy?.()
    
    this.videoAd = null
    this.interstitialAd = null
    this.bannerAd = null
  }
}
