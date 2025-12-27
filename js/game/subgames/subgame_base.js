/**
 * 子游戏基础接口（最小可用）
 * 每个子游戏负责自己的：初始化 / 更新 / 渲染 / 事件处理 / 销毁
 */
export default class SubGameBase {
    /**
     * @param {object} ctx
     * @param {import('../..//databus.js').default} ctx.databus
     * @param {import('../camera.js').default} ctx.camera
     * @param {import('../gameinfo.js').default} ctx.gameInfo
     * @param {import('../../main.js').default} ctx.main
     * @param {HTMLCanvasElement} ctx.canvas
     */
    constructor(ctx) {
        this.ctx = ctx
        this.isReady = false
    }

    /** 子游戏标识 */
    get id () {
        return 'base'
    }

    /** 子游戏显示名称 */
    get name () {
        return 'Base'
    }

    /** 子游戏初始化（创建资源/重置状态） */
    init () {
        this.isReady = true
    }

    /**
     * 子游戏接管主循环更新
     * @param {number} dt
     */
    update (dt) { }

    /** 子游戏渲染 */
    render () { }

    /** 触摸开始（如需自定义交互） */
    onTouchStart (e) { }

    /** 退出子游戏（释放监听/重置） */
    destroy () { }
}
