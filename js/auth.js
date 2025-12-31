/**
 * 登录授权工具
 * 目标：保证在开始游戏前拿到玩家昵称和头像（若用户拒绝则允许匿名继续或提示）。
 */

const STORAGE_KEY = 'player_profile_v1'

/**
 * @returns {{nickName:string, avatarUrl:string, isAuthorized:boolean}|null}
 */
export function getCachedProfile () {
  try {
    return wx.getStorageSync(STORAGE_KEY) || null
  } catch (e) {
    return null
  }
}

export function cacheProfile (profile) {
  try {
    wx.setStorageSync(STORAGE_KEY, profile)
  } catch (e) {}
}

/**
 * 微信小游戏在不同基础库下获取头像昵称的方式不完全一致。
 * 这里优先走 getUserProfile（推荐），失败则尝试 getUserInfo。
 *
 * @param {string} desc
 * @returns {Promise<{nickName:string, avatarUrl:string, isAuthorized:boolean}>}
 */
export function ensureUserProfile (desc = '用于展示玩家昵称与头像') {
  const cached = getCachedProfile()
  if (cached?.nickName && cached?.avatarUrl) {
    return Promise.resolve(cached)
  }

  return new Promise((resolve) => {
    // 推荐接口：getUserProfile
    if (typeof wx.getUserProfile === 'function') {
      wx.getUserProfile({
        desc,
        success: (res) => {
          const user = res?.userInfo || {}
          const profile = {
            nickName: user.nickName || '游客',
            avatarUrl: user.avatarUrl || '',
            isAuthorized: true
          }
          cacheProfile(profile)
          resolve(profile)
        },
        fail: () => {
          resolve({ nickName: '游客', avatarUrl: '', isAuthorized: false })
        }
      })
      return
    }

    // 兼容：getUserInfo（旧接口，可能受限）
    if (typeof wx.getUserInfo === 'function') {
      wx.getUserInfo({
        withCredentials: false,
        success: (res) => {
          const user = res?.userInfo || {}
          const profile = {
            nickName: user.nickName || '游客',
            avatarUrl: user.avatarUrl || '',
            isAuthorized: true
          }
          cacheProfile(profile)
          resolve(profile)
        },
        fail: () => {
          resolve({ nickName: '游客', avatarUrl: '', isAuthorized: false })
        }
      })
      return
    }

    // 都不支持就直接匿名
    resolve({ nickName: '游客', avatarUrl: '', isAuthorized: false })
  })
}
