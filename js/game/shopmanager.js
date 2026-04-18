/**
 * 商店管理器
 * 管理商品数据、购买逻辑、库存和用户购买记录
 */

export default class ShopManager {
  constructor(databus, userInfo) {
    this.databus = databus
    this.userInfo = userInfo

    // 商品类型定义
    this.productTypes = {
      // 道具类
      items: [
        {
          id: 'item_double_score',
          name: '双倍积分卡',
          description: '下一局游戏积分翻倍',
          price: 100,
          icon: '💎',
          type: 'consumable',
          effect: 'double_score',
          duration: 1
        },
        {
          id: 'item_extra_life',
          name: '额外生命',
          description: '增加一次复活机会',
          price: 150,
          icon: '❤️',
          type: 'consumable',
          effect: 'extra_life',
          duration: 1
        },
        {
          id: 'item_time_extend',
          name: '时间延长',
          description: '游戏时间增加30秒',
          price: 80,
          icon: '⏰',
          type: 'consumable',
          effect: 'time_extend',
          duration: 30
        }
      ],
      // 骨牌皮肤
      skins: [
        {
          id: 'skin_gold',
          name: '黄金骨牌',
          description: '金色骨牌皮肤',
          price: 500,
          icon: '🌟',
          type: 'permanent',
          effect: 'skin_gold'
        },
        {
          id: 'skin_diamond',
          name: '钻石骨牌',
          description: '钻石骨牌皮肤',
          price: 1000,
          icon: '💎',
          type: 'permanent',
          effect: 'skin_diamond'
        },
        {
          id: 'skin_rainbow',
          name: '彩虹骨牌',
          description: '彩虹骨牌皮肤',
          price: 2000,
          icon: '🌈',
          type: 'permanent',
          effect: 'skin_rainbow'
        }
      ],
      // 特殊效果
      effects: [
        {
          id: 'effect_fireworks',
          name: '烟花特效',
          description: '骨牌碰撞时显示烟花',
          price: 300,
          icon: '🎆',
          type: 'permanent',
          effect: 'fireworks'
        },
        {
          id: 'effect_trail',
          name: '光轨特效',
          description: '骨牌移动时显示光轨',
          price: 400,
          icon: '✨',
          type: 'permanent',
          effect: 'trail'
        }
      ]
    }

    // 用户购买数据
    this.shopData = {
      ownedItems: {},      // 已拥有的道具
      ownedSkins: {},      // 已拥有的皮肤
      ownedEffects: {},    // 已拥有的特效
      currentSkin: null,   // 当前使用的皮肤
      currentEffect: null, // 当前使用的特效
      inventory: {}       // 道具库存
    }

    // 加载商店数据
    this.loadShopData()
  }

  /**
   * 加载商店数据
   */
  loadShopData() {
    try {
      const data = wx.getStorageSync('shopData')
      if (data) {
        this.shopData = data
      }
    } catch (e) {
      console.error('加载商店数据失败:', e)
    }
  }

  /**
   * 保存商店数据
   */
  saveShopData() {
    try {
      wx.setStorageSync('shopData', this.shopData)
    } catch (e) {
      console.error('保存商店数据失败:', e)
    }
  }

  /**
   * 获取商品列表
   * @param {string} category - 商品类别 'items', 'skins', 'effects'
   */
  getProducts(category) {
    const products = this.productTypes[category] || []
    return products.map(product => {
      const isOwned = this.isProductOwned(product.id, category)
      return {
        ...product,
        owned: isOwned
      }
    })
  }

  /**
   * 检查商品是否已拥有
   */
  isProductOwned(productId, category) {
    switch (category) {
      case 'items':
        return this.shopData.inventory[productId] > 0
      case 'skins':
        return this.shopData.ownedSkins[productId] === true
      case 'effects':
        return this.shopData.ownedEffects[productId] === true
      default:
        return false
    }
  }

  /**
   * 购买商品
   * @param {string} productId - 商品ID
   * @param {string} category - 商品类别
   */
  buyProduct(productId, category) {
    const product = this.productTypes[category].find(p => p.id === productId)
    if (!product) {
      return { success: false, message: '商品不存在' }
    }

    // 检查是否已拥有（永久物品）
    if (product.type === 'permanent' && this.isProductOwned(productId, category)) {
      return { success: false, message: '已拥有此商品' }
    }

    // 检查积分是否足够
    if (this.userInfo.score < product.price) {
      return { success: false, message: '积分不足' }
    }

    // 扣除积分
    this.userInfo.addScore(-product.price)

    // 添加到拥有列表
    switch (category) {
      case 'items':
        if (!this.shopData.inventory[productId]) {
          this.shopData.inventory[productId] = 0
        }
        this.shopData.inventory[productId]++
        break
      case 'skins':
        this.shopData.ownedSkins[productId] = true
        break
      case 'effects':
        this.shopData.ownedEffects[productId] = true
        break
    }

    // 保存数据
    this.saveShopData()

    return {
      success: true,
      message: '购买成功',
      product: product
    }
  }

  /**
   * 使用道具
   * @param {string} itemId - 道具ID
   */
  useItem(itemId) {
    if (!this.shopData.inventory[itemId] || this.shopData.inventory[itemId] <= 0) {
      return { success: false, message: '道具不足' }
    }

    // 减少库存
    this.shopData.inventory[itemId]--
    this.saveShopData()

    const item = this.productTypes.items.find(i => i.id === itemId)
    return {
      success: true,
      message: '使用成功',
      effect: item ? item.effect : null
    }
  }

  /**
   * 装备皮肤
   * @param {string} skinId - 皮肤ID
   */
  equipSkin(skinId) {
    if (!this.shopData.ownedSkins[skinId]) {
      return { success: false, message: '未拥有此皮肤' }
    }

    this.shopData.currentSkin = skinId
    this.saveShopData()

    return { success: true, message: '装备成功' }
  }

  /**
   * 装备特效
   * @param {string} effectId - 特效ID
   */
  equipEffect(effectId) {
    if (!this.shopData.ownedEffects[effectId]) {
      return { success: false, message: '未拥有此特效' }
    }

    this.shopData.currentEffect = effectId
    this.saveShopData()

    return { success: true, message: '装备成功' }
  }

  /**
   * 获取当前装备
   */
  getCurrentEquipment() {
    return {
      skin: this.shopData.currentSkin,
      effect: this.shopData.currentEffect
    }
  }

  /**
   * 获取库存数量
   * @param {string} itemId - 道具ID
   */
  getInventoryCount(itemId) {
    return this.shopData.inventory[itemId] || 0
  }

  /**
   * 获取商店统计
   */
  getShopStats() {
    const totalProducts = this.productTypes.items.length +
                         this.productTypes.skins.length +
                         this.productTypes.effects.length
    const ownedProducts = Object.keys(this.shopData.ownedSkins).length +
                          Object.keys(this.shopData.ownedEffects).length +
                          Object.keys(this.shopData.inventory).filter(k => this.shopData.inventory[k] > 0).length

    return {
      total: totalProducts,
      owned: ownedProducts
    }
  }
}
