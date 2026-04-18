/**
 * 背包管理器
 * 管理玩家的道具、皮肤、特效等物品
 */

export default class InventoryManager {
  constructor(databus, userInfo, shopManager) {
    this.databus = databus
    this.userInfo = userInfo
    this.shopManager = shopManager

    // 背包数据
    this.inventory = {
      items: {},      // 道具库存 {itemId: count}
      skins: {},      // 拥有的皮肤 {skinId: true}
      effects: {},    // 拥有的特效 {effectId: true}
      equipped: {     // 当前装备
        skin: null,
        effect: null
      }
    }

    // 加载背包数据
    this.loadInventory()
  }

  /**
   * 加载背包数据
   */
  loadInventory() {
    try {
      const data = wx.getStorageSync('inventory')
      if (data) {
        this.inventory = data
      } else {
        // 如果没有数据，从shopManager同步
        this.syncFromShopManager()
      }
    } catch (e) {
      console.error('加载背包数据失败:', e)
      this.syncFromShopManager()
    }
  }

  /**
   * 保存背包数据
   */
  saveInventory() {
    try {
      wx.setStorageSync('inventory', this.inventory)
    } catch (e) {
      console.error('保存背包数据失败:', e)
    }
  }

  /**
   * 从shopManager同步数据
   */
  syncFromShopManager() {
    if (this.shopManager && this.shopManager.shopData) {
      this.inventory.items = this.shopManager.shopData.inventory || {}
      this.inventory.skins = this.shopManager.shopData.ownedSkins || {}
      this.inventory.effects = this.shopManager.shopData.ownedEffects || {}
      this.inventory.equipped.skin = this.shopManager.shopData.currentSkin || null
      this.inventory.equipped.effect = this.shopManager.shopData.currentEffect || null
      this.saveInventory()
    }
  }

  /**
   * 同步到shopManager
   */
  syncToShopManager() {
    if (this.shopManager && this.shopManager.shopData) {
      this.shopManager.shopData.inventory = this.inventory.items
      this.shopManager.shopData.ownedSkins = this.inventory.skins
      this.shopManager.shopData.ownedEffects = this.inventory.effects
      this.shopManager.shopData.currentSkin = this.inventory.equipped.skin
      this.shopManager.shopData.currentEffect = this.inventory.equipped.effect
      this.shopManager.saveShopData()
    }
  }

  /**
   * 添加道具
   * @param {string} itemId - 道具ID
   * @param {number} count - 数量
   */
  addItem(itemId, count = 1) {
    if (!this.inventory.items[itemId]) {
      this.inventory.items[itemId] = 0
    }
    this.inventory.items[itemId] += count
    this.saveInventory()
    this.syncToShopManager()
  }

  /**
   * 减少道具
   * @param {string} itemId - 道具ID
   * @param {number} count - 数量
   */
  removeItem(itemId, count = 1) {
    if (this.inventory.items[itemId] && this.inventory.items[itemId] >= count) {
      this.inventory.items[itemId] -= count
      if (this.inventory.items[itemId] <= 0) {
        delete this.inventory.items[itemId]
      }
      this.saveInventory()
      this.syncToShopManager()
      return true
    }
    return false
  }

  /**
   * 获取道具数量
   * @param {string} itemId - 道具ID
   */
  getItemCount(itemId) {
    return this.inventory.items[itemId] || 0
  }

  /**
   * 添加皮肤
   * @param {string} skinId - 皮肤ID
   */
  addSkin(skinId) {
    this.inventory.skins[skinId] = true
    this.saveInventory()
    this.syncToShopManager()
  }

  /**
   * 添加特效
   * @param {string} effectId - 特效ID
   */
  addEffect(effectId) {
    this.inventory.effects[effectId] = true
    this.saveInventory()
    this.syncToShopManager()
  }

  /**
   * 装备皮肤
   * @param {string} skinId - 皮肤ID
   */
  equipSkin(skinId) {
    if (this.inventory.skins[skinId]) {
      this.inventory.equipped.skin = skinId
      this.saveInventory()
      this.syncToShopManager()
      return { success: true }
    }
    return { success: false, message: '未拥有此皮肤' }
  }

  /**
   * 装备特效
   * @param {string} effectId - 特效ID
   */
  equipEffect(effectId) {
    if (this.inventory.effects[effectId]) {
      this.inventory.equipped.effect = effectId
      this.saveInventory()
      this.syncToShopManager()
      return { success: true }
    }
    return { success: false, message: '未拥有此特效' }
  }

  /**
   * 卸载皮肤
   */
  unequipSkin() {
    this.inventory.equipped.skin = null
    this.saveInventory()
    this.syncToShopManager()
  }

  /**
   * 卸载特效
   */
  unequipEffect() {
    this.inventory.equipped.effect = null
    this.saveInventory()
    this.syncToShopManager()
  }

  /**
   * 使用道具
   * @param {string} itemId - 道具ID
   */
  useItem(itemId) {
    const count = this.getItemCount(itemId)
    if (count <= 0) {
      return { success: false, message: '道具不足' }
    }

    // 减少道具数量
    this.removeItem(itemId, 1)

    // 获取道具效果
    const item = this.shopManager ? this.shopManager.productTypes.items.find(i => i.id === itemId) : null
    if (item) {
      return {
        success: true,
        message: '使用成功',
        effect: item.effect,
        duration: item.duration
      }
    }
    return { success: true, message: '使用成功' }
  }

  /**
   * 获取所有道具
   */
  getAllItems() {
    const items = []
    if (this.shopManager) {
      this.shopManager.productTypes.items.forEach(item => {
        const count = this.getItemCount(item.id)
        if (count > 0) {
          items.push({
            ...item,
            count: count
          })
        }
      })
    }
    return items
  }

  /**
   * 获取所有皮肤
   */
  getAllSkins() {
    const skins = []
    if (this.shopManager) {
      this.shopManager.productTypes.skins.forEach(skin => {
        if (this.inventory.skins[skin.id]) {
          skins.push({
            ...skin,
            equipped: this.inventory.equipped.skin === skin.id
          })
        }
      })
    }
    return skins
  }

  /**
   * 获取所有特效
   */
  getAllEffects() {
    const effects = []
    if (this.shopManager) {
      this.shopManager.productTypes.effects.forEach(effect => {
        if (this.inventory.effects[effect.id]) {
          effects.push({
            ...effect,
            equipped: this.inventory.equipped.effect === effect.id
          })
        }
      })
    }
    return effects
  }

  /**
   * 获取当前装备
   */
  getCurrentEquipment() {
    return {
      skin: this.inventory.equipped.skin,
      effect: this.inventory.equipped.effect
    }
  }

  /**
   * 获取背包统计
   */
  getInventoryStats() {
    const itemCounts = Object.values(this.inventory.items).reduce((sum, count) => sum + count, 0)
    const skinCount = Object.keys(this.inventory.skins).length
    const effectCount = Object.keys(this.inventory.effects).length

    return {
      items: itemCounts,
      skins: skinCount,
      effects: effectCount,
      total: itemCounts + skinCount + effectCount
    }
  }
}
