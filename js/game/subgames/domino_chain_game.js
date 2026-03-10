import SubGameBase from './subgame_base.js'
import ShareManager from '../share.js'
import { Levels, getLevel, calculateStars, unlockNextLevel, saveProgress, loadProgress } from './domino_levels.js'
import DominoLevelSelect from './domino_level_select.js'

/**
 * 多米诺骨牌效应 - 完整版
 * 功能：关卡系统、障碍物、道具、相机缩放
 */
export default class DominoChainGame extends SubGameBase {
    constructor(config) {
        super(config)
        
        this.main = config.main
        this.canvas = config.canvas
        this.ctx = this.canvas.getContext('2d')
        
        // ========== 游戏模式 ==========
        this.gameMode = 'menu'  // menu, levelSelect, playing, freePlay
        this.currentLevel = null
        this.levelSelect = null
        
        // ========== 相机系统 ==========
        this.camera = {
            x: 0,
            y: 0,
            scale: 1,
            minScale: 0.5,
            maxScale: 2.0,
            targetScale: 1,
            isDragging: false,
            lastX: 0,
            lastY: 0,
            isPinching: false,
            initialPinchDist: 0,
            initialScale: 1
        }
        
        // 世界尺寸
        this.worldWidth = this.canvas.width * 3
        this.worldHeight = this.canvas.height
        this.groundY = this.canvas.height * 0.65
        
        // ========== 多米诺类型系统 ==========
        this.dominoTypes = [
            { id: 'normal', name: '普通', color: '#ff6b6b', width: 10, height: 50, count: 10 },
            { id: 'tall', name: '高型', color: '#4ecdc4', width: 10, height: 70, count: 5 },
            { id: 'wide', name: '宽型', color: '#f9ca24', width: 15, height: 40, count: 5 },
            { id: 'heavy', name: '重型', color: '#6ab04c', width: 12, height: 55, count: 3 }
        ]
        this.selectedTypeIndex = 0
        
        // ========== 道具系统 ==========
        this.powerUps = []  // 当前关卡可用道具
        this.activePowerUp = null  // 当前激活的道具
        
        // ========== 障碍物系统 ==========
        this.obstacles = []
        
        // 骨牌数组
        this.dominoes = []
        
        // 拖拽状态
        this.isDraggingDomino = false
        this.dragX = 0
        this.dragY = 0
        this.dragType = null
        
        // 游戏状态
        this.isSimulating = false
        this.chainCount = 0
        
        // 右推触发
        this.swipeStartX = 0
        this.swipeStartY = 0
        this.isSwipingRight = false
        
        // 模拟超时检测
        this.simulationStartTime = 0
        this.lastActivityTime = 0
        this.IDLE_TIMEOUT = 3000
        this.MAX_SIMULATION_TIME = 15000
        
        // 分享管理器
        this.shareManager = new ShareManager()
        
        // 结果弹窗
        this.showingResult = false
        this.gameResult = null
        this.resultScore = 0
        this.earnedStars = 0
        
        // 加载进度
        loadProgress()
        
        this.init()
    }
    
    get id() { return 'domino-chain' }
    get name() { return '多米诺骨牌' }
    
    init() {
        super.init()
        // gameMode 由 main.js 在 enterSubGame 后设置
        this.initLevelSelect()
    }
    
    initLevelSelect() {
        this.levelSelect = new DominoLevelSelect({
            canvas: this.canvas,
            onSelectLevel: (levelId) => this.startLevel(levelId),
            onBack: () => this.exitToMenu()  // 返回主界面
        })
    }
    
    startLevel(levelId) {
        const level = getLevel(levelId)
        if (!level) return
        this.currentLevel = level
        this.gameMode = 'playing'
        this.reset()
        this.loadLevelConfig(level)
    }
    
    startFreePlay() {
        this.currentLevel = null
        this.gameMode = 'freePlay'
        this.reset()
    }
    
    loadLevelConfig(level) {
        this.dominoTypes.forEach(type => {
            type.count = level.dominoes[type.id] || 0
        })
        this.obstacles = (level.obstacles || []).map(obs => ({
            ...obs,
            y: obs.y !== undefined ? this.groundY - obs.height : this.groundY
        }))
        this.powerUps = (level.powerUps || []).map(pu => ({ ...pu }))
        if (level.preset && level.preset.length > 0) {
            level.preset.forEach(preset => {
                const typeData = this.dominoTypes.find(t => t.id === preset.type)
                if (typeData) this.placeDomino(preset.x, this.groundY, typeData)
            })
        }
    }
    
    reset() {
        this.dominoes = []
        this.isSimulating = false
        this.chainCount = 0
        this.showingResult = false
        this.gameResult = null
        this.resultScore = 0
        this.earnedStars = 0
        this.simulationStartTime = 0
        this.lastActivityTime = 0
        this.obstacles = []
        this.powerUps = []
        this.activePowerUp = null
        this.camera.x = 0
        this.camera.y = 0
        this.camera.scale = 1
        this.dominoTypes.forEach(type => {
            if (type.id === 'normal') type.count = 10
            else if (type.id === 'tall') type.count = 5
            else if (type.id === 'wide') type.count = 5
            else if (type.id === 'heavy') type.count = 3
        })
        this.selectedTypeIndex = 0
    }
    
    // 获取总剩余骨牌数
    getTotalRemainingDominoes() {
        return this.dominoTypes.reduce((sum, type) => sum + type.count, 0)
    }
    
    // 检查是否全部摆完
    isAllPlaced() {
        return this.getTotalRemainingDominoes() === 0
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
        
        if (this.currentLevel) {
            // 关卡模式：根据目标判断
            const target = this.currentLevel.target
            this.earnedStars = calculateStars(this.chainCount, target)
            this.gameResult = this.earnedStars > 0 ? 'win' : 'lose'
            this.resultScore = this.chainCount * 10 + this.earnedStars * 50
            
            // 更新关卡星级
            if (this.earnedStars > this.currentLevel.stars) {
                this.currentLevel.stars = this.earnedStars
                if (this.earnedStars > 0) {
                    unlockNextLevel(this.currentLevel.id)
                }
                saveProgress()
            }
        } else {
            // 自由模式
            const threshold = Math.floor(this.dominoes.length * 0.8)
            this.gameResult = this.chainCount >= threshold ? 'win' : 'lose'
            this.resultScore = this.chainCount * 10
        }
    }
    
    // ========== 坐标转换 ==========
    
    // 屏幕坐标转世界坐标
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.camera.x) / this.camera.scale,
            y: (screenY - this.camera.y) / this.camera.scale
        }
    }
    
    // 世界坐标转屏幕坐标
    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.camera.scale + this.camera.x,
            y: worldY * this.camera.scale + this.camera.y
        }
    }
    
    // 计算两点距离
    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX
        const dy = touch1.clientY - touch2.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }
    
    // ========== 触摸事件 ==========
    
    onTouchStart(e) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        
        // 选关模式
        if (this.gameMode === 'levelSelect') {
            this.levelSelect.onTouchStart(e)
            return
        }
        
        // 结果弹窗点击
        if (this.showingResult) {
            const action = this.handleResultClick(x, y)
            if (action === 'share') this.handleShare()
            else if (action === 'continue') this.handleContinue()
            else if (action === 'next') this.goNextLevel()
            else if (action === 'levels') this.gameMode = 'levelSelect'
            return
        }
        
        // 检查返回按钮（任何时候都可以点击）
        if (this.checkBackButton(x, y)) {
            this.exitToMenu()
            return
        }
        
        // 检查重置按钮（任何时候都可以点击）
        if (this.checkResetButton(x, y)) {
            if (this.currentLevel) {
                this.loadLevelConfig(this.currentLevel)
            }
            this.reset()
            if (this.currentLevel) this.loadLevelConfig(this.currentLevel)
            return
        }
        
        // 模拟中禁止其他操作
        if (this.isSimulating) return
        
        // 检查开始按钮
        if (this.checkStartButton(x, y)) {
            this.startSimulation()
            return
        }
        
        // 双指缩放检测
        if (e.touches.length === 2) {
            this.camera.isPinching = true
            this.camera.initialPinchDist = this.getDistance(e.touches[0], e.touches[1])
            this.camera.initialScale = this.camera.scale
            return
        }
        
        // 检查道具区点击 - 选择骨牌类型或开始拖拽
        if (this.checkInventoryArea(y)) {
            // 检查是否点击了某个骨牌类型
            const typeIndex = this.getClickedTypeIndex(x, y)
            if (typeIndex !== -1 && this.dominoTypes[typeIndex].count > 0) {
                this.selectedTypeIndex = typeIndex
                this.isDraggingDomino = true
                this.dragX = x
                this.dragY = y
                this.dragType = this.dominoTypes[typeIndex]
            }
            return
        }
        
        // 记录右推起始位置（用于全部摆完后的右推触发）
        if (this.isAllPlaced() && !this.isSimulating) {
            this.swipeStartX = x
            this.swipeStartY = y
            this.isSwipingRight = true
        }
        
        // 游戏区域：相机拖拽
        this.camera.isDragging = true
        this.camera.lastX = x
        this.camera.lastY = y
    }
    
    onTouchMove(e) {
        // 选关模式
        if (this.gameMode === 'levelSelect') {
            this.levelSelect.onTouchMove(e)
            return
        }
        
        // 双指缩放
        if (this.camera.isPinching && e.touches.length === 2) {
            const currentDist = this.getDistance(e.touches[0], e.touches[1])
            const scaleRatio = currentDist / this.camera.initialPinchDist
            this.camera.scale = Math.max(
                this.camera.minScale,
                Math.min(this.camera.maxScale, this.camera.initialScale * scaleRatio)
            )
            return
        }
        
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        
        // 骨牌拖拽
        if (this.isDraggingDomino) {
            this.dragX = x
            this.dragY = y
            return
        }
        
        // 相机拖拽
        if (this.camera.isDragging && !this.isSwipingRight) {
            const dx = x - this.camera.lastX
            const dy = y - this.camera.lastY
            this.camera.x += dx
            this.camera.y += dy
            this.camera.lastX = x
            this.camera.lastY = y
        }
    }
    
    onTouchEnd(e) {
        // 选关模式
        if (this.gameMode === 'levelSelect') {
            this.levelSelect.onTouchEnd(e)
            return
        }
        
        const x = e.changedTouches[0].clientX
        const y = e.changedTouches[0].clientY
        
        // 双指缩放结束
        if (this.camera.isPinching) {
            this.camera.isPinching = false
            return
        }
        
        // 骨牌拖拽结束
        if (this.isDraggingDomino) {
            // 检查是否与障碍物碰撞
            const worldPos = this.screenToWorld(x, y)
            if (y < this.canvas.height - 120 && this.dragType && this.dragType.count > 0) {
                if (!this.checkObstacleCollision(worldPos.x, this.groundY, this.dragType)) {
                    this.placeDomino(worldPos.x, this.groundY, this.dragType)
                    this.dragType.count--
                } else {
                    wx.showToast({ title: '不能放在障碍物上', icon: 'none' })
                }
            }
            this.isDraggingDomino = false
            this.dragType = null
            return
        }
        
        // 右推触发检测
        if (this.isSwipingRight && this.isAllPlaced()) {
            const swipeDist = x - this.swipeStartX
            if (swipeDist > 80) {
                this.startSimulation()
            }
        }
        this.isSwipingRight = false
        
        // 相机拖拽结束
        this.camera.isDragging = false
    }
    
    // ========== 骨牌放置 ==========
    
    placeDomino(x, y, type) {
        const domino = {
            x: x,
            y: y,
            width: type ? type.width : 10,
            height: type ? type.height : 50,
            angle: 0,
            falling: false,
            fallen: false,
            fallSpeed: 0,
            color: type ? type.color : '#ff6b6b',
            typeId: type ? type.id : 'normal'
        }
        this.dominoes.push(domino)
    }
    
    // 获取点击的骨牌类型索引
    getClickedTypeIndex(x, y) {
        const invY = this.canvas.height - 120
        const typeWidth = 70
        const startX = (this.canvas.width - this.dominoTypes.length * typeWidth) / 2
        
        for (let i = 0; i < this.dominoTypes.length; i++) {
            const typeX = startX + i * typeWidth
            if (x >= typeX && x <= typeX + typeWidth - 10 &&
                y >= invY + 20 && y <= invY + 90) {
                return i
            }
        }
        return -1
    }
    
    // 障碍物碰撞检测
    checkObstacleCollision(x, y, type) {
        const w = type ? type.width : 10
        const h = type ? type.height : 50
        
        for (const obs of this.obstacles) {
            if (obs.type === 'wall') {
                if (x + w/2 > obs.x && x - w/2 < obs.x + obs.width &&
                    y > obs.y && y - h < obs.y + obs.height) {
                    return true
                }
            } else if (obs.type === 'pit') {
                if (x + w/2 > obs.x && x - w/2 < obs.x + obs.width) {
                    return true
                }
            }
        }
        return false
    }
    
    
    // 下一关
    goNextLevel() {
        if (this.currentLevel) {
            const nextId = this.currentLevel.id + 1
            const nextLevel = getLevel(nextId)
            if (nextLevel && nextLevel.unlocked) {
                this.startLevel(nextId)
            } else {
                this.gameMode = 'levelSelect'
            }
        }
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
    
    checkBackButton(x, y) {
        return x >= 20 && x <= 90 && y >= 20 && y <= 55
    }
    
    checkInventoryArea(y) {
        return y >= this.canvas.height - 120
    }
    
    handleResultClick(x, y) {
        const canvas = this.canvas
        const modalW = 300
        const modalH = this.currentLevel ? 320 : 260
        const modalX = (canvas.width - modalW) / 2
        const modalY = (canvas.height - modalH) / 2
        
        if (this.currentLevel) {
            // 关卡模式按钮布局
            const btnW = 120
            const btnH = 40
            
            // 重玩按钮（左）
            if (x >= modalX + 20 && x <= modalX + 20 + btnW &&
                y >= modalY + 200 && y <= modalY + 200 + btnH) {
                return 'continue'
            }
            
            // 下一关按钮（右）- 仅胜利时可用
            if (this.gameResult === 'win' &&
                x >= modalX + modalW - 20 - btnW && x <= modalX + modalW - 20 &&
                y >= modalY + 200 && y <= modalY + 200 + btnH) {
                return 'next'
            }
            
            // 选关按钮
            if (x >= modalX + 40 && x <= modalX + modalW - 40 &&
                y >= modalY + 260 && y <= modalY + 260 + btnH) {
                return 'levels'
            }
        } else {
            // 自由模式
            if (x >= modalX + 40 && x <= modalX + modalW - 40 &&
                y >= modalY + 150 && y <= modalY + 190) {
                return 'share'
            }
            if (x >= modalX + 40 && x <= modalX + modalW - 40 &&
                y >= modalY + 200 && y <= modalY + 240) {
                return 'continue'
            }
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
    
    exitToMenu() {
        // 根据当前模式决定返回到哪里
        if (this.gameMode === 'playing') {
            // 关卡模式游戏中 → 返回关卡选择
            this.gameMode = 'levelSelect'
            this.showingResult = false
            this.isSimulating = false
        } else if (this.gameMode === 'freePlay') {
            // 自由模式游戏中 → 返回主界面
            if (this.main && typeof this.main.exitSubGame === 'function') {
                this.main.exitSubGame()
            }
        } else if (this.gameMode === 'levelSelect') {
            // 关卡选择界面 → 返回主界面
            if (this.main && typeof this.main.exitSubGame === 'function') {
                this.main.exitSubGame()
            }
        } else {
            // 其他情况（如菜单）→ 返回主界面
            if (this.main && typeof this.main.exitSubGame === 'function') {
                this.main.exitSubGame()
            }
        }
    }
    
    // ========== 渲染 ==========
    
    render() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // 根据游戏模式渲染
        if (this.gameMode === 'levelSelect') {
            this.levelSelect.render()
            return
        }
        
        // 游戏模式渲染
        this.drawBackground()
        
        // 应用相机变换
        ctx.save()
        ctx.translate(this.camera.x, this.camera.y)
        ctx.scale(this.camera.scale, this.camera.scale)
        
        // 绘制地面
        this.drawGround()
        
        // 绘制障碍物
        this.drawObstacles()
        
        // 绘制骨牌
        this.drawDominoes()
        
        ctx.restore()
        
        // 绘制拖拽预览
        if (this.isDraggingDomino) {
            this.drawDragPreview()
        }
        
        // 绘制右推提示
        if (this.isAllPlaced() && !this.isSimulating && !this.showingResult) {
            this.drawSwipeHint()
        }
        
        // 绘制道具区
        this.drawInventory()
        
        // 绘制UI按钮
        this.drawUI()
        
        // 绘制关卡信息
        if (this.currentLevel) {
            this.drawLevelInfo()
        }
        
        // 绘制缩放指示器
        this.drawZoomIndicator()
        
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
        
        // 使用世界宽度绘制地面
        ctx.fillStyle = '#8B7355'
        ctx.fillRect(-this.worldWidth, this.groundY, this.worldWidth * 3, 200)
        
        // 地面线
        ctx.strokeStyle = '#6B5335'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(-this.worldWidth, this.groundY)
        ctx.lineTo(this.worldWidth * 2, this.groundY)
        ctx.stroke()
        
        // 绘制刻度线（帮助判断距离）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.lineWidth = 1
        for (let x = -this.worldWidth; x < this.worldWidth * 2; x += 50) {
            ctx.beginPath()
            ctx.moveTo(x, this.groundY)
            ctx.lineTo(x, this.groundY + 10)
            ctx.stroke()
        }
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
        
        if (!this.dragType) return
        
        ctx.save()
        ctx.globalAlpha = 0.6
        ctx.fillStyle = this.dragType.color
        ctx.fillRect(
            this.dragX - this.dragType.width / 2, 
            this.dragY - this.dragType.height, 
            this.dragType.width, 
            this.dragType.height
        )
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.strokeRect(
            this.dragX - this.dragType.width / 2, 
            this.dragY - this.dragType.height, 
            this.dragType.width, 
            this.dragType.height
        )
        ctx.restore()
    }
    
    drawInventory() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 道具区背景
        const invY = canvas.height - 120
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, invY, canvas.width, 120)
        
        // 提示文字
        ctx.fillStyle = '#fff'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('选择骨牌类型，拖拽到上方放置', canvas.width / 2, invY + 15)
        
        // 绘制各种骨牌类型
        const typeWidth = 70
        const startX = (canvas.width - this.dominoTypes.length * typeWidth) / 2
        
        this.dominoTypes.forEach((type, index) => {
            const typeX = startX + index * typeWidth
            const isSelected = index === this.selectedTypeIndex
            const isEmpty = type.count === 0
            
            // 选中框
            if (isSelected && !isEmpty) {
                ctx.strokeStyle = '#FFD700'
                ctx.lineWidth = 3
                ctx.strokeRect(typeX, invY + 20, typeWidth - 10, 70)
            }
            
            // 骨牌预览
            ctx.save()
            if (isEmpty) ctx.globalAlpha = 0.3
            ctx.fillStyle = type.color
            const previewX = typeX + (typeWidth - 10 - type.width) / 2
            const previewY = invY + 35
            ctx.fillRect(previewX, previewY, type.width, Math.min(type.height, 40))
            ctx.strokeStyle = '#333'
            ctx.lineWidth = 1
            ctx.strokeRect(previewX, previewY, type.width, Math.min(type.height, 40))
            ctx.restore()
            
            // 剩余数量
            ctx.fillStyle = isEmpty ? '#ff4444' : '#fff'
            ctx.font = 'bold 12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(`x${type.count}`, typeX + (typeWidth - 10) / 2, invY + 85)
            
            // 类型名称
            ctx.fillStyle = '#aaa'
            ctx.font = '10px Arial'
            ctx.fillText(type.name, typeX + (typeWidth - 10) / 2, invY + 100)
        })
        
        // 已放置数量
        ctx.fillStyle = '#4ecdc4'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'right'
        ctx.fillText(`已放置: ${this.dominoes.length}`, canvas.width - 20, invY + 115)
        
        // 剩余总数
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'left'
        ctx.fillText(`剩余: ${this.getTotalRemainingDominoes()}`, 20, invY + 115)
    }
    
    // 绘制右推提示
    drawSwipeHint() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, canvas.width, canvas.height - 120)
        
        // 提示框
        const hintW = 250
        const hintH = 80
        const hintX = (canvas.width - hintW) / 2
        const hintY = (canvas.height - 120 - hintH) / 2
        
        ctx.fillStyle = 'rgba(76, 175, 80, 0.9)'
        ctx.fillRect(hintX, hintY, hintW, hintH)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.strokeRect(hintX, hintY, hintW, hintH)
        
        // 提示文字
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('👉 向右滑动开始!', canvas.width / 2, hintY + 35)
        
        ctx.font = '14px Arial'
        ctx.fillText('或点击右上角"开始"按钮', canvas.width / 2, hintY + 60)
    }
    
    // 绘制缩放指示器
    drawZoomIndicator() {
        const ctx = this.ctx
        
        // 只在非1倍缩放时显示
        if (Math.abs(this.camera.scale - 1) < 0.01) return
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(this.canvas.width - 80, 150, 60, 25)
        ctx.fillStyle = '#fff'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${Math.round(this.camera.scale * 100)}%`, this.canvas.width - 50, 167)
    }
    
    drawUI() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 返回按钮（左上角）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(20, 20, 70, 35)
        ctx.fillStyle = '#fff'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('← 返回', 55, 43)
        
        // 开始按钮
        const startX = canvas.width - 90
        const startY = 60
        ctx.fillStyle = this.isSimulating ? '#666' : '#4CAF50'
        ctx.fillRect(startX, startY, 70, 35)
        ctx.fillStyle = '#fff'
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
    
    // 绘制障碍物
    drawObstacles() {
        const ctx = this.ctx
        
        this.obstacles.forEach(obs => {
            if (obs.type === 'wall') {
                ctx.fillStyle = '#555'
                ctx.fillRect(obs.x, this.groundY - obs.height, obs.width, obs.height)
                ctx.strokeStyle = '#333'
                ctx.lineWidth = 2
                ctx.strokeRect(obs.x, this.groundY - obs.height, obs.width, obs.height)
            } else if (obs.type === 'pit') {
                ctx.fillStyle = '#222'
                ctx.fillRect(obs.x, this.groundY, obs.width, 30)
                ctx.strokeStyle = '#ff4444'
                ctx.lineWidth = 2
                ctx.setLineDash([5, 5])
                ctx.strokeRect(obs.x, this.groundY - 5, obs.width, 5)
                ctx.setLineDash([])
            } else if (obs.type === 'spring') {
                ctx.fillStyle = '#ff9800'
                ctx.beginPath()
                ctx.moveTo(obs.x - 15, this.groundY)
                ctx.lineTo(obs.x + 15, this.groundY)
                ctx.lineTo(obs.x, this.groundY - 20)
                ctx.closePath()
                ctx.fill()
                ctx.strokeStyle = '#e65100'
                ctx.lineWidth = 2
                ctx.stroke()
            } else if (obs.type === 'portal') {
                const portalColor = obs.color || '#9b59b6'
                // 入口
                ctx.fillStyle = portalColor
                ctx.globalAlpha = 0.7
                ctx.fillRect(obs.x1 - 5, this.groundY - 60, 10, 60)
                // 出口
                ctx.fillRect(obs.x2 - 5, this.groundY - 60, 10, 60)
                ctx.globalAlpha = 1
            }
        })
    }
    
    // 绘制关卡信息
    drawLevelInfo() {
        const ctx = this.ctx
        const level = this.currentLevel
        if (!level) return
        
        // 关卡名称
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(100, 20, 180, 35)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`第${level.id}关: ${level.name}`, 190, 43)
        
        // 目标提示
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(100, 60, 180, 25)
        ctx.fillStyle = '#FFD700'
        ctx.font = '12px Arial'
        ctx.fillText(`目标: 连锁 ${level.target.value}+`, 190, 77)
    }
    
    drawResultModal() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        const modalW = 300
        const modalH = this.currentLevel ? 320 : 260
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
        ctx.fillText(this.gameResult === 'win' ? '🎉 成功!' : '😢 再试一次', canvas.width / 2, y + 45)
        
        // 关卡模式显示星级
        if (this.currentLevel) {
            // 星级
            ctx.font = '28px Arial'
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = i < this.earnedStars ? '#FFD700' : '#444'
                ctx.fillText('★', canvas.width / 2 - 40 + i * 40, y + 85)
            }
            
            // 连锁数和目标
            ctx.fillStyle = '#4ecdc4'
            ctx.font = '18px Arial'
            ctx.fillText(`连锁: ${this.chainCount} / 目标: ${this.currentLevel.target.value}`, canvas.width / 2, y + 120)
            
            // 得分
            ctx.fillStyle = '#FFD700'
            ctx.font = 'bold 20px Arial'
            ctx.fillText(`得分: ${this.resultScore}`, canvas.width / 2, y + 155)
            
            // 按钮
            const btnW = 120
            const btnH = 40
            
            // 重玩按钮
            ctx.fillStyle = 'rgba(244, 67, 54, 0.7)'
            ctx.fillRect(x + 20, y + 200, btnW, btnH)
            ctx.fillStyle = '#fff'
            ctx.font = '16px Arial'
            ctx.fillText('🔄 重玩', x + 20 + btnW/2, y + 225)
            
            // 下一关按钮
            if (this.gameResult === 'win') {
                ctx.fillStyle = 'rgba(76, 175, 80, 0.7)'
                ctx.fillRect(x + modalW - 20 - btnW, y + 200, btnW, btnH)
                ctx.fillStyle = '#fff'
                ctx.fillText('下一关 ▶', x + modalW - 20 - btnW/2, y + 225)
            } else {
                ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'
                ctx.fillRect(x + modalW - 20 - btnW, y + 200, btnW, btnH)
                ctx.fillStyle = '#666'
                ctx.fillText('下一关 ▶', x + modalW - 20 - btnW/2, y + 225)
            }
            
            // 选关按钮
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.fillRect(x + 40, y + 260, modalW - 80, btnH)
            ctx.fillStyle = '#fff'
            ctx.fillText('📋 选择关卡', canvas.width / 2, y + 285)
        } else {
            // 自由模式
            ctx.fillStyle = '#4ecdc4'
            ctx.font = '20px Arial'
            ctx.fillText(`连锁数: ${this.chainCount}`, canvas.width / 2, y + 85)
            
            ctx.fillStyle = '#FFD700'
            ctx.font = 'bold 22px Arial'
            ctx.fillText(`得分: ${this.resultScore}`, canvas.width / 2, y + 120)
            
            ctx.fillStyle = 'rgba(76, 175, 80, 0.5)'
            ctx.fillRect(x + 40, y + 150, modalW - 80, 40)
            ctx.fillStyle = '#fff'
            ctx.font = '16px Arial'
            ctx.fillText('📤 分享成绩', canvas.width / 2, y + 175)
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.fillRect(x + 40, y + 200, modalW - 80, 40)
            ctx.fillStyle = '#fff'
            ctx.fillText('继续游戏', canvas.width / 2, y + 225)
        }
    }
}
