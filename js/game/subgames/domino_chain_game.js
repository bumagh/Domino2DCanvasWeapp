import SubGameBase from './subgame_base.js'
import ShareManager from '../share.js'

/**
 * 多米诺骨牌效应 - 最简化MVP版本
 * 功能：拖拽放置骨牌 -> 点击开始 -> 触发多米诺效应 -> 结果弹窗
 */
export default class DominoChainGame extends SubGameBase {
    constructor(config) {
        super(config)
        
        this.main = config.main
        this.canvas = config.canvas
        this.ctx = this.canvas.getContext('2d')
        
        // 地面位置
        this.groundY = this.canvas.height * 0.65
        
        // 骨牌数组
        this.dominoes = []
        
        // 拖拽状态
        this.isDragging = false
        this.dragX = 0
        this.dragY = 0
        
        // 游戏状态
        this.isSimulating = false
        this.chainCount = 0
        
        // 模拟超时检测
        this.simulationStartTime = 0      // 模拟开始时间
        this.lastActivityTime = 0          // 最后活动时间
        this.IDLE_TIMEOUT = 3000           // 静止超时(3秒)
        this.MAX_SIMULATION_TIME = 15000   // 最大模拟时间(15秒)
        
        // 分享管理器
        this.shareManager = new ShareManager()
        
        // 结果弹窗
        this.showingResult = false
        this.gameResult = null
        this.resultScore = 0
        
        this.init()
    }
    
    get id() { return 'domino-chain' }
    get name() { return '多米诺骨牌' }
    
    init() {
        super.init()
        this.reset()
    }
    
    reset() {
        this.dominoes = []
        this.isSimulating = false
        this.chainCount = 0
        this.showingResult = false
        this.gameResult = null
        this.resultScore = 0
        this.simulationStartTime = 0
        this.lastActivityTime = 0
    }
    
    // ========== 游戏更新 ==========
    
    update(deltaTime) {
        if (!this.isSimulating) return
        
        const now = Date.now()
        let hasActivity = false
        
        // 更新每个骨牌的倒下动画
        let allFallen = true
        this.dominoes.forEach((domino, index) => {
            if (domino.falling) {
                hasActivity = true  // 有骨牌在倒下，记录活动
                
                // 骨牌倒下动画
                domino.angle += domino.fallSpeed
                if (domino.angle >= Math.PI / 2) {
                    domino.angle = Math.PI / 2
                    domino.falling = false
                    domino.fallen = true
                    
                    // 触发下一个骨牌
                    if (index < this.dominoes.length - 1) {
                        const next = this.dominoes[index + 1]
                        if (!next.falling && !next.fallen) {
                            const dist = next.x - domino.x
                            if (dist < 50) { // 距离足够近才能推倒
                                next.falling = true
                                next.fallSpeed = 0.08
                                this.chainCount++
                            }
                        }
                    }
                }
                allFallen = false
            } else if (!domino.fallen) {
                allFallen = false
            }
        })
        
        // 更新最后活动时间
        if (hasActivity) {
            this.lastActivityTime = now
        }
        
        // 检查游戏结束条件
        if (allFallen && this.dominoes.length > 0) {
            // 所有骨牌都倒下了
            this.endGame()
        } else if (now - this.lastActivityTime > this.IDLE_TIMEOUT) {
            // 静止超时(3秒无活动)
            console.log('静止超时，结束游戏')
            this.endGame()
        } else if (now - this.simulationStartTime > this.MAX_SIMULATION_TIME) {
            // 总超时(15秒)
            console.log('模拟超时，强制结束')
            this.endGame()
        }
    }
    
    // ========== 开始模拟 ==========
    
    startSimulation() {
        if (this.dominoes.length === 0) {
            wx.showToast({ title: '请先放置骨牌', icon: 'none' })
            return
        }
        
        // 按X坐标排序骨牌
        this.dominoes.sort((a, b) => a.x - b.x)
        
        // 初始化超时检测
        const now = Date.now()
        this.simulationStartTime = now
        this.lastActivityTime = now
        
        // 推倒第一个骨牌
        this.isSimulating = true
        this.chainCount = 1
        this.dominoes[0].falling = true
        this.dominoes[0].fallSpeed = 0.08
    }
    
    endGame() {
        this.isSimulating = false
        this.showingResult = true
        
        // 判断胜负：连锁数达到骨牌数量的80%算胜利
        const threshold = Math.floor(this.dominoes.length * 0.8)
        this.gameResult = this.chainCount >= threshold ? 'win' : 'lose'
        this.resultScore = this.chainCount * 10
    }
    
    // ========== 触摸事件 ==========
    
    onTouchStart(e) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        
        // 结果弹窗点击
        if (this.showingResult) {
            const action = this.handleResultClick(x, y)
            if (action === 'share') this.handleShare()
            else if (action === 'continue') this.handleContinue()
            return
        }
        
        // 检查重置按钮（任何时候都可以点击）
        if (this.checkResetButton(x, y)) {
            this.reset()
            return
        }
        
        // 模拟中禁止其他操作
        if (this.isSimulating) return
        
        // 检查开始按钮
        if (this.checkStartButton(x, y)) {
            this.startSimulation()
            return
        }
        
        // 检查道具区点击 - 开始拖拽
        if (this.checkInventoryArea(y)) {
            this.isDragging = true
            this.dragX = x
            this.dragY = y
            return
        }
    }
    
    onTouchMove(e) {
        if (!this.isDragging) return
        this.dragX = e.touches[0].clientX
        this.dragY = e.touches[0].clientY
    }
    
    onTouchEnd(e) {
        if (!this.isDragging) return
        
        const x = e.changedTouches[0].clientX
        const y = e.changedTouches[0].clientY
        
        // 如果在游戏区域释放，放置骨牌
        if (y < this.canvas.height - 100) {
            this.placeDomino(x, this.groundY)
        }
        
        this.isDragging = false
    }
    
    // ========== 骨牌放置 ==========
    
    placeDomino(x, y) {
        const domino = {
            x: x,
            y: y,
            width: 10,
            height: 50,
            angle: 0,
            falling: false,
            fallen: false,
            fallSpeed: 0,
            color: this.getRandomColor()
        }
        this.dominoes.push(domino)
    }
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6ab04c', '#eb4d4b']
        return colors[Math.floor(Math.random() * colors.length)]
    }
    
    // ========== UI检测 ==========
    
    checkStartButton(x, y) {
        const btnX = this.canvas.width - 90
        const btnY = 60
        return x >= btnX && x <= btnX + 70 && y >= btnY && y <= btnY + 35
    }
    
    checkResetButton(x, y) {
        const btnX = this.canvas.width - 90
        const btnY = 105
        return x >= btnX && x <= btnX + 70 && y >= btnY && y <= btnY + 35
    }
    
    checkInventoryArea(y) {
        return y >= this.canvas.height - 100
    }
    
    handleResultClick(x, y) {
        const canvas = this.canvas
        const modalW = 280
        const modalH = 260
        const modalX = (canvas.width - modalW) / 2
        const modalY = (canvas.height - modalH) / 2
        
        // 分享按钮
        if (x >= modalX + 40 && x <= modalX + modalW - 40 &&
            y >= modalY + 150 && y <= modalY + 190) {
            return 'share'
        }
        
        // 继续按钮
        if (x >= modalX + 40 && x <= modalX + modalW - 40 &&
            y >= modalY + 200 && y <= modalY + 240) {
            return 'continue'
        }
        
        return null
    }
    
    handleShare() {
        this.shareManager.share({
            score: this.resultScore,
            canvas: this.canvas,
            ctx: this.ctx
        })
    }
    
    handleContinue() {
        this.showingResult = false
        this.reset()
    }
    
    // ========== 渲染 ==========
    
    render() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // 绘制背景
        this.drawBackground()
        
        // 绘制地面
        this.drawGround()
        
        // 绘制骨牌
        this.drawDominoes()
        
        // 绘制拖拽预览
        if (this.isDragging) {
            this.drawDragPreview()
        }
        
        // 绘制道具区
        this.drawInventory()
        
        // 绘制UI按钮
        this.drawUI()
        
        // 绘制结果弹窗
        if (this.showingResult) {
            this.drawResultModal()
        }
    }
    
    drawBackground() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(1, '#98D8C8')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    drawGround() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        ctx.fillStyle = '#8B7355'
        ctx.fillRect(0, this.groundY, canvas.width, canvas.height - this.groundY - 100)
        
        // 地面线
        ctx.strokeStyle = '#6B5335'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, this.groundY)
        ctx.lineTo(canvas.width, this.groundY)
        ctx.stroke()
    }
    
    drawDominoes() {
        const ctx = this.ctx
        
        this.dominoes.forEach(domino => {
            ctx.save()
            ctx.translate(domino.x, domino.y)
            ctx.rotate(domino.angle)
            
            // 骨牌主体（从底部向上绘制）
            ctx.fillStyle = domino.color
            ctx.fillRect(-domino.width / 2, -domino.height, domino.width, domino.height)
            
            // 骨牌边框
            ctx.strokeStyle = '#333'
            ctx.lineWidth = 2
            ctx.strokeRect(-domino.width / 2, -domino.height, domino.width, domino.height)
            
            ctx.restore()
        })
    }
    
    drawDragPreview() {
        const ctx = this.ctx
        
        ctx.save()
        ctx.globalAlpha = 0.6
        ctx.fillStyle = '#ff6b6b'
        ctx.fillRect(this.dragX - 5, this.dragY - 50, 10, 50)
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.strokeRect(this.dragX - 5, this.dragY - 50, 10, 50)
        ctx.restore()
    }
    
    drawInventory() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 道具区背景
        const invY = canvas.height - 100
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(0, invY, canvas.width, 100)
        
        // 提示文字
        ctx.fillStyle = '#fff'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('👆 从这里拖拽骨牌到上方放置', canvas.width / 2, invY + 30)
        
        // 骨牌示例
        ctx.fillStyle = '#ff6b6b'
        ctx.fillRect(canvas.width / 2 - 5, invY + 45, 10, 40)
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        ctx.strokeRect(canvas.width / 2 - 5, invY + 45, 10, 40)
        
        // 已放置数量
        ctx.fillStyle = '#fff'
        ctx.font = '14px Arial'
        ctx.fillText(`已放置: ${this.dominoes.length}`, canvas.width / 2, invY + 95)
    }
    
    drawUI() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 开始按钮
        const startX = canvas.width - 90
        const startY = 60
        ctx.fillStyle = this.isSimulating ? '#666' : '#4CAF50'
        ctx.fillRect(startX, startY, 70, 35)
        ctx.fillStyle = '#fff'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('开始', startX + 35, startY + 23)
        
        // 重置按钮
        const resetY = 105
        ctx.fillStyle = '#f44336'
        ctx.fillRect(startX, resetY, 70, 35)
        ctx.fillStyle = '#fff'
        ctx.fillText('重置', startX + 35, resetY + 23)
        
        // 连锁数显示
        ctx.fillStyle = '#333'
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`连锁: ${this.chainCount}`, 20, 80)
    }
    
    drawResultModal() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        const modalW = 280
        const modalH = 260
        const x = (canvas.width - modalW) / 2
        const y = (canvas.height - modalH) / 2
        
        // 遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 弹窗背景
        ctx.fillStyle = 'rgba(40, 40, 50, 0.95)'
        ctx.fillRect(x, y, modalW, modalH)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, modalW, modalH)
        
        // 标题
        ctx.fillStyle = this.gameResult === 'win' ? '#FFD700' : '#FF6B6B'
        ctx.font = 'bold 26px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(this.gameResult === 'win' ? '🎉 成功!' : '😢 失败', canvas.width / 2, y + 45)
        
        // 连锁数
        ctx.fillStyle = '#4ecdc4'
        ctx.font = '20px Arial'
        ctx.fillText(`连锁数: ${this.chainCount}`, canvas.width / 2, y + 85)
        
        // 得分
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 22px Arial'
        ctx.fillText(`得分: ${this.resultScore}`, canvas.width / 2, y + 120)
        
        // 分享按钮
        ctx.fillStyle = 'rgba(76, 175, 80, 0.5)'
        ctx.fillRect(x + 40, y + 150, modalW - 80, 40)
        ctx.fillStyle = '#fff'
        ctx.font = '16px Arial'
        ctx.fillText('📤 分享成绩', canvas.width / 2, y + 175)
        
        // 继续按钮
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fillRect(x + 40, y + 200, modalW - 80, 40)
        ctx.fillStyle = '#fff'
        ctx.fillText('继续游戏', canvas.width / 2, y + 225)
    }
}
