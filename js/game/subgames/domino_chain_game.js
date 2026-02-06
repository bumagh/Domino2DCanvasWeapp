import SubGameBase from './subgame_base.js'

/**
 * 多米诺连锁推倒任务模式
 * 2.5D（伪3D）视角的骨牌连锁反应游戏
 */
export default class DominoChainGame extends SubGameBase {
    constructor(config) {
        super(config)
        
        // 从config中提取需要的属性
        this.main = config.main
        this.canvas = config.canvas
        this.databus = config.databus
        this.gameInfo = config.gameInfo
        this.camera = config.camera
        this.ctx = this.canvas.getContext('2d')
        
        // 游戏配置
        this.dominoCount = 0 // 当前使用的骨牌数量
        this.maxDominoes = 20 // 最大骨牌数量
        this.requiredChainCount = 10 // 需要达到的连锁数量
        this.currentChainCount = 0 // 当前连锁数量
        
        // 相机和视野配置
        this.cameraZoom = 1.0 // 视野缩放
        this.cameraOffsetX = 0 // 相机X偏移
        this.cameraOffsetY = 0 // 相机Y偏移
        this.minZoom = 0.5
        this.maxZoom = 2.0
        this.sliderValue = 0.5 // 缩放滑块值 (0-1)
        this.isDraggingCamera = false // 是否正在拖拽相机
        this.lastTouchDistance = 0 // 上次双指距离
        
        // 道具区配置
        this.dominoInventory = [] // 玩家拥有的骨牌库存
        this.inventorySlots = 8 // 道具区槽位数
        this.selectedDominoType = 0 // 当前选中的骨牌类型
        this.isDragging = false // 是否正在拖拽
        this.dragPreview = null // 拖拽预览骨牌
        this.touchStartPos = null // 触摸开始位置
        
        // 初始化骨牌库存
        this.initDominoInventory()
        
        // 2.5D视角配置
        this.perspective = 0.8 // 透视系数
        this.floorY = 0.7 // 地面位置（屏幕高度比例）
        
        // 游戏对象
        this.dominoes = [] // 骨牌数组
        this.obstacles = [] // 障碍物（摆锤、楼梯、桥梁等）
        this.startPoint = null // 起点
        this.endPoint = null // 终点
        this.pushingBall = null // 推球
        
        // 游戏状态
        this.isSimulating = false // 是否正在模拟
        this.simulationTime = 0 // 模拟时间
        this.chainCount = 0 // 连锁计数
        this.level = 1 // 当前关卡
        
        // 物理参数
        this.gravity = 0.3
        this.friction = 0.95
        this.chainDelay = 100 // 连锁延迟（毫秒）
        
        this.init()
    }
    
    /** 子游戏标识 */
    get id() {
        return 'domino-chain'
    }

    /** 子游戏显示名称 */
    get name() {
        return '多米诺连锁'
    }
    
    /**
     * 初始化骨牌库存
     */
    initDominoInventory() {
        const dominoTypes = [
            { type: 'standard', color: '#ff6b6b', name: '标准', count: 5 },
            { type: 'heavy', color: '#4ecdc4', name: '重型', count: 3 },
            { type: 'tall', color: '#45b7d1', name: '高型', count: 3 },
            { type: 'special', color: '#f9ca24', name: '特殊', count: 2 }
        ]
        
        this.dominoInventory = dominoTypes
    }
    
    /**
     * 初始化游戏
     */
    init() {
        super.init()
        this.initLevel(this.level)
        this.reset()
    }
    
    /**
     * 初始化关卡
     */
    initLevel(levelNum) {
        this.level = levelNum
        
        // 根据关卡设置参数
        switch (levelNum) {
            case 1:
                this.maxDominoes = 15
                this.requiredChainCount = 8
                break
            case 2:
                this.maxDominoes = 20
                this.requiredChainCount = 12
                break
            case 3:
                this.maxDominoes = 25
                this.requiredChainCount = 15
                break
            default:
                this.maxDominoes = 20 + levelNum * 2
                this.requiredChainCount = 10 + levelNum * 2
        }
        
        this.setupLevel()
    }
    
    /**
     * 设置关卡
     */
    setupLevel() {
        const canvas = this.canvas
        const width = canvas.width
        const height = canvas.height
        
        // 设置起点和终点
        this.startPoint = {
            x: width * 0.1,
            y: height * this.floorY,
            radius: 15
        }
        
        this.endPoint = {
            x: width * 0.9,
            y: height * this.floorY,
            radius: 20
        }
        
        // 清空并重新设置障碍物
        this.obstacles = []
        
        // 根据关卡添加特殊机关
        if (this.level >= 2) {
            // 添加摆锤
            this.obstacles.push({
                type: 'pendulum',
                x: width * 0.4,
                y: height * 0.3,
                length: 80,
                angle: 0,
                angleVelocity: 0,
                radius: 10
            })
        }
        
        if (this.level >= 3) {
            // 添加楼梯
            for (let i = 0; i < 3; i++) {
                this.obstacles.push({
                    type: 'stair',
                    x: width * (0.5 + i * 0.1),
                    y: height * (this.floorY - i * 0.05),
                    width: 40,
                    height: 10
                })
            }
        }
        
        if (this.level >= 4) {
            // 添加桥梁
            this.obstacles.push({
                type: 'bridge',
                x: width * 0.7,
                y: height * (this.floorY - 0.1),
                width: 80,
                height: 5,
                rotation: 0
            })
        }
    }
    
    /**
     * 重置游戏
     */
    reset() {
        this.dominoes = []
        this.dominoCount = 0
        this.currentChainCount = 0
        this.isSimulating = false
        this.simulationTime = 0
        this.chainCount = 0
        this.pushingBall = null
        
        // 创建推球
        this.pushingBall = {
            x: this.startPoint.x - 50,
            y: this.startPoint.y - 30,
            vx: 0,
            vy: 0,
            radius: 12,
            active: false
        }
    }
    
    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        if (this.isSimulating) {
            this.updateSimulation(deltaTime)
        }
        
        // 更新障碍物动画
        this.updateObstacles(deltaTime)
    }
    
    /**
     * 更新模拟
     */
    updateSimulation(deltaTime) {
        this.simulationTime += deltaTime
        
        // 更新推球
        if (this.pushingBall && this.pushingBall.active) {
            this.pushingBall.x += this.pushingBall.vx
            this.pushingBall.y += this.pushingBall.vy
            this.pushingBall.vy += this.gravity
            
            // 检查推球碰撞
            this.checkBallCollisions()
        }
        
        // 更新骨牌倒下
        this.updateDominoes(deltaTime)
        
        // 检查连锁反应
        this.checkChainReaction()
        
        // 检查胜利条件
        this.checkWinCondition()
    }
    
    /**
     * 更新障碍物
     */
    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'pendulum') {
                // 摆锤运动
                obstacle.angleVelocity += Math.sin(obstacle.angle) * 0.01
                obstacle.angle += obstacle.angleVelocity
                obstacle.angleVelocity *= 0.99 // 阻尼
            }
        })
    }
    
    /**
     * 更新骨牌
     */
    updateDominoes(deltaTime) {
        this.dominoes.forEach(domino => {
            if (domino.falling) {
                domino.angle += domino.angleVelocity
                domino.angleVelocity *= 0.98 // 阻尼
                
                // 如果骨牌完全倒下
                if (Math.abs(domino.angle) > Math.PI / 2) {
                    domino.angle = Math.sign(domino.angle) * Math.PI / 2
                    domino.angleVelocity = 0
                    domino.fallen = true
                }
            }
        })
    }
    
    /**
     * 检查推球碰撞
     */
    checkBallCollisions() {
        if (!this.pushingBall || !this.pushingBall.active) return
        
        // 检查与骨牌的碰撞
        this.dominoes.forEach(domino => {
            if (!domino.falling && this.checkBallDominoCollision(this.pushingBall, domino)) {
                this.pushDomino(domino, this.pushingBall.vx > 0 ? 1 : -1)
                this.chainCount++
            }
        })
        
        // 检查与障碍物的碰撞
        this.obstacles.forEach(obstacle => {
            if (this.checkBallObstacleCollision(this.pushingBall, obstacle)) {
                this.handleObstacleCollision(obstacle)
            }
        })
    }
    
    /**
     * 检查球与骨牌碰撞
     */
    checkBallDominoCollision(ball, domino) {
        const dx = ball.x - domino.x
        const dy = ball.y - domino.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance < ball.radius + domino.width / 2
    }
    
    /**
     * 检查球与障碍物碰撞
     */
    checkBallObstacleCollision(ball, obstacle) {
        switch (obstacle.type) {
            case 'pendulum':
                const pendulumX = obstacle.x + Math.sin(obstacle.angle) * obstacle.length
                const pendulumY = obstacle.y + Math.cos(obstacle.angle) * obstacle.length
                const dx = ball.x - pendulumX
                const dy = ball.y - pendulumY
                return Math.sqrt(dx * dx + dy * dy) < ball.radius + obstacle.radius
            default:
                return false
        }
    }
    
    /**
     * 处理障碍物碰撞
     */
    handleObstacleCollision(obstacle) {
        switch (obstacle.type) {
            case 'pendulum':
                // 摆锤被撞击后加速
                obstacle.angleVelocity += 0.1
                break
        }
    }
    
    /**
     * 推倒骨牌
     */
    pushDomino(domino, direction) {
        if (!domino.falling && !domino.fallen) {
            domino.falling = true
            domino.angleVelocity = direction * 0.1
            domino.fallTime = this.simulationTime
        }
    }
    
    /**
     * 检查连锁反应
     */
    checkChainReaction() {
        this.dominoes.forEach((domino, index) => {
            if (domino.falling && !domino.triggeredNext) {
                // 检查是否碰到下一个骨牌
                for (let i = index + 1; i < this.dominoes.length; i++) {
                    const nextDomino = this.dominoes[i]
                    if (!nextDomino.falling && this.checkDominoCollision(domino, nextDomino)) {
                        // 延迟推倒下一个骨牌
                        setTimeout(() => {
                            this.pushDomino(nextDomino, 1)
                            this.chainCount++
                        }, this.chainDelay)
                        domino.triggeredNext = true
                        break
                    }
                }
            }
        })
    }
    
    /**
     * 检查骨牌碰撞
     */
    checkDominoCollision(domino1, domino2) {
        const dx = domino1.x - domino2.x
        const dy = domino1.y - domino2.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance < domino1.width + domino2.width
    }
    
    /**
     * 检查胜利条件
     */
    checkWinCondition() {
        // 检查是否达到终点
        const reachedEnd = this.dominoes.some(domino => {
            const dx = domino.x - this.endPoint.x
            const dy = domino.y - this.endPoint.y
            return Math.sqrt(dx * dx + dy * dy) < this.endPoint.radius
        })
        
        if (reachedEnd && this.chainCount >= this.requiredChainCount) {
            this.win()
        }
        
        // 检查是否失败（所有骨牌都停止了但没达到条件）
        const allStopped = this.dominoes.every(domino => domino.fallen || !domino.falling)
        if (allStopped && !reachedEnd) {
            this.lose()
        }
    }
    
    /**
     * 胜利
     */
    win() {
        this.isSimulating = false
        wx.showModal({
            title: '胜利！',
            content: `恭喜完成关卡${this.level}！连锁数：${this.chainCount}`,
            showCancel: false,
            confirmText: '下一关',
            success: () => {
                this.level++
                this.initLevel(this.level)
                this.reset()
            }
        })
    }
    
    /**
     * 失败
     */
    lose() {
        this.isSimulating = false
        wx.showModal({
            title: '失败',
            content: `连锁数：${this.chainCount}/${this.requiredChainCount}，请再试一次！`,
            showCancel: false,
            confirmText: '重试',
            success: () => {
                this.reset()
            }
        })
    }
    
    /**
     * 开始模拟
     */
    startSimulation() {
        if (this.dominoCount === 0) {
            wx.showToast({
                title: '请先放置骨牌',
                icon: 'none'
            })
            return
        }
        
        this.isSimulating = true
        this.pushingBall.active = true
        this.pushingBall.vx = 3
        this.pushingBall.vy = -2
    }
    
    /**
     * 触摸事件处理
     */
    onTouchStart(e) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        
        if (this.isSimulating) {
            return // 模拟中不允许操作
        }
        
        // 检查是否点击了缩放滑块
        if (this.checkZoomSliderClick(x, y)) {
            this.startZoomSliderDrag(x, y)
            return
        }
        
        // 检查是否点击了开始按钮
        if (this.checkStartButtonClick(x, y)) {
            this.startSimulation()
            return
        }
        
        // 检查是否点击了重置按钮
        if (this.checkResetButtonClick(x, y)) {
            this.reset()
            return
        }
        
        // 检查是否点击了道具区
        const inventorySlot = this.checkInventoryClick(x, y)
        if (inventorySlot !== -1) {
            this.startDragFromInventory(inventorySlot, x, y)
            return
        }
        
        // 如果正在拖拽骨牌，放置骨牌
        if (this.isDragging) {
            this.placeDominoFromDrag(x, y)
            return
        }
        
        // 开始相机拖拽（右键或双指）
        if (e.touches.length === 2) {
            this.startCameraDrag(x, y, e.touches[1].clientX, e.touches[1].clientY)
        } else if (e.touches.length === 1) {
            // 单指开始相机拖拽（用于空区域）
            this.startCameraDragSingle(x, y)
        }
    }
    
    /**
     * 触摸移动事件
     */
    onTouchMove(e) {
        // 处理缩放滑块拖拽
        if (this.isDraggingZoomSlider) {
            this.updateZoomSlider(e.touches[0].clientX)
            return
        }
        
        // 处理骨牌拖拽
        if (this.isDragging) {
            const x = e.touches[0].clientX
            const y = e.touches[0].clientY
            if (this.dragPreview) {
                this.dragPreview.x = x
                this.dragPreview.y = y
            }
            return
        }
        
        // 处理相机移动
        if (e.touches.length === 2) {
            this.updateCameraZoom(e.touches[0].clientX, e.touches[0].clientY, e.touches[1].clientX, e.touches[1].clientY)
        } else if (this.isDraggingCamera && e.touches.length === 1) {
            this.updateCameraPan(e.touches[0].clientX, e.touches[0].clientY)
        }
    }
    
    /**
     * 触摸结束事件
     */
    onTouchEnd(e) {
        // 结束缩放滑块拖拽
        if (this.isDraggingZoomSlider) {
            this.endZoomSliderDrag()
            return
        }
        
        // 结束骨牌拖拽
        if (this.isDragging) {
            const x = e.changedTouches[0].clientX
            const y = e.changedTouches[0].clientY
            this.placeDominoFromDrag(x, y)
            this.endDrag()
            return
        }
        
        // 结束相机拖拽
        if (this.isDraggingCamera) {
            this.endCameraDrag()
        }
    }
    
    /**
     * 检查缩放滑块点击
     */
    checkZoomSliderClick(x, y) {
        const canvas = this.canvas
        const sliderX = 20
        const sliderY = 150
        const sliderWidth = 150
        const sliderHeight = 20
        
        return x >= sliderX && x <= sliderX + sliderWidth &&
               y >= sliderY && y <= sliderY + sliderHeight
    }
    
    /**
     * 开始缩放滑块拖拽
     */
    startZoomSliderDrag(x, y) {
        this.isDraggingZoomSlider = true
        this.updateZoomSlider(x)
    }
    
    /**
     * 更新缩放滑块
     */
    updateZoomSlider(x) {
        const canvas = this.canvas
        const sliderX = 20
        const sliderWidth = 150
        
        // 计算滑块值 (0-1)
        this.sliderValue = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth))
        
        // 更新缩放
        this.cameraZoom = this.minZoom + (this.maxZoom - this.minZoom) * this.sliderValue
    }
    
    /**
     * 结束缩放滑块拖拽
     */
    endZoomSliderDrag() {
        this.isDraggingZoomSlider = false
    }
    
    /**
     * 开始相机拖拽（双指）
     */
    startCameraDrag(x1, y1, x2, y2) {
        this.isDraggingCamera = true
        this.lastTouchDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
        this.cameraStartOffsetX = this.cameraOffsetX
        this.cameraStartOffsetY = this.cameraOffsetY
        this.touchStartX = (x1 + x2) / 2
        this.touchStartY = (y1 + y2) / 2
    }
    
    /**
     * 开始相机拖拽（单指）
     */
    startCameraDragSingle(x, y) {
        // 只在空区域开始相机拖拽
        if (!this.checkUIButtonClick(x, y) && !this.checkInventoryClick(x, y)) {
            this.isDraggingCamera = true
            this.cameraStartOffsetX = this.cameraOffsetX
            this.cameraStartOffsetY = this.cameraOffsetY
            this.touchStartX = x
            this.touchStartY = y
        }
    }
    
    /**
     * 更新相机缩放（双指）
     */
    updateCameraZoom(x1, y1, x2, y2) {
        if (!this.isDraggingCamera) return
        
        const currentDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
        const scale = currentDistance / this.lastTouchDistance
        
        // 更新缩放
        this.cameraZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.cameraZoom * scale))
        
        // 更新滑块值
        this.sliderValue = (this.cameraZoom - this.minZoom) / (this.maxZoom - this.minZoom)
        
        this.lastTouchDistance = currentDistance
    }
    
    /**
     * 更新相机平移
     */
    updateCameraPan(x, y) {
        if (!this.isDraggingCamera) return
        
        const deltaX = x - this.touchStartX
        const deltaY = y - this.touchStartY
        
        this.cameraOffsetX = this.cameraStartOffsetX + deltaX / this.cameraZoom
        this.cameraOffsetY = this.cameraStartOffsetY + deltaY / this.cameraZoom
    }
    
    /**
     * 结束相机拖拽
     */
    endCameraDrag() {
        this.isDraggingCamera = false
    }
    
    /**
     * 检查UI按钮点击
     */
    checkUIButtonClick(x, y) {
        return this.checkStartButtonClick(x, y) || 
               this.checkResetButtonClick(x, y) ||
               this.checkZoomSliderClick(x, y)
    }
    
    /**
     * 应用相机变换
     */
    applyCameraTransform(ctx) {
        ctx.save()
        ctx.translate(this.canvas.width / 2, this.canvas.height / 2)
        ctx.scale(this.cameraZoom, this.cameraZoom)
        ctx.translate(-this.canvas.width / 2 + this.cameraOffsetX, -this.canvas.height / 2 + this.cameraOffsetY)
    }
    
    /**
     * 屏幕坐标转世界坐标（考虑相机）
     */
    screenToWorld(screenX, screenY) {
        const canvas = this.canvas
        
        // 转换为相机空间坐标
        const cameraX = (screenX - this.canvas.width / 2) / this.cameraZoom - this.cameraOffsetX + this.canvas.width / 2
        const cameraY = (screenY - this.canvas.height / 2) / this.cameraZoom - this.cameraOffsetY + this.canvas.height / 2
        
        // 简单的2.5D投影
        const worldX = cameraX
        const worldY = cameraY * (1 + (cameraY / canvas.height) * this.perspective)
        
        return { x: worldX, y: worldY }
    }
    checkInventoryClick(x, y) {
        const canvas = this.canvas
        const inventoryY = canvas.height - 80
        const slotWidth = 60
        const slotHeight = 60
        const startX = (canvas.width - this.inventorySlots * slotWidth) / 2
        
        for (let i = 0; i < this.inventorySlots; i++) {
            const slotX = startX + i * slotWidth
            if (x >= slotX && x <= slotX + slotWidth &&
                y >= inventoryY && y <= inventoryY + slotHeight) {
                return i
            }
        }
        
        return -1
    }
    
    /**
     * 从道具区开始拖拽
     */
    startDragFromInventory(slotIndex, x, y) {
        if (slotIndex >= this.dominoInventory.length) return
        
        const dominoType = this.dominoInventory[slotIndex]
        if (dominoType.count <= 0) {
            wx.showToast({
                title: '该骨牌已用完',
                icon: 'none'
            })
            return
        }
        
        this.isDragging = true
        this.selectedDominoType = slotIndex
        this.touchStartPos = { x, y }
        
        // 创建拖拽预览
        this.dragPreview = {
            x: x,
            y: y,
            width: 8,
            height: this.getDominoHeight(dominoType.type),
            angle: 0,
            color: dominoType.color,
            type: dominoType.type,
            alpha: 0.7 // 半透明
        }
    }
    
    /**
     * 从拖拽放置骨牌
     */
    placeDominoFromDrag(x, y) {
        if (!this.isDragging || !this.dragPreview) return
        
        const dominoType = this.dominoInventory[this.selectedDominoType]
        if (dominoType.count <= 0) return
        
        // 转换为2.5D坐标
        const worldPos = this.screenToWorld(x, y)
        
        // 检查位置是否有效
        if (!this.isValidPosition(worldPos.x, worldPos.y)) {
            wx.showToast({
                title: '不能放置在这里',
                icon: 'none'
            })
            return
        }
        
        // 创建骨牌
        const domino = {
            x: worldPos.x,
            y: worldPos.y,
            width: 8,
            height: this.getDominoHeight(dominoType.type),
            angle: 0,
            angleVelocity: 0,
            falling: false,
            fallen: false,
            triggeredNext: false,
            fallTime: 0,
            color: dominoType.color,
            type: dominoType.type
        }
        
        this.dominoes.push(domino)
        this.dominoCount++
        
        // 减少库存
        dominoType.count--
        
        // 如果库存用完，结束拖拽
        if (dominoType.count <= 0) {
            this.endDrag()
        }
    }
    
    /**
     * 结束拖拽
     */
    endDrag() {
        this.isDragging = false
        this.dragPreview = null
        this.touchStartPos = null
    }
    
    /**
     * 获取骨牌高度
     */
    getDominoHeight(type) {
        switch (type) {
            case 'standard': return 30
            case 'heavy': return 25
            case 'tall': return 40
            case 'special': return 35
            default: return 30
        }
    }
    placeDomino(x, y) {
        if (this.dominoCount >= this.maxDominoes) {
            wx.showToast({
                title: `已达到最大骨牌数${this.maxDominoes}`,
                icon: 'none'
            })
            return
        }
        
        // 转换为2.5D坐标
        const worldPos = this.screenToWorld(x, y)
        
        // 检查位置是否有效
        if (!this.isValidPosition(worldPos.x, worldPos.y)) {
            return
        }
        
        // 创建骨牌
        const domino = {
            x: worldPos.x,
            y: worldPos.y,
            width: 8,
            height: 30,
            angle: 0,
            angleVelocity: 0,
            falling: false,
            fallen: false,
            triggeredNext: false,
            fallTime: 0,
            color: this.getDominoColor(this.dominoCount)
        }
        
        this.dominoes.push(domino)
        this.dominoCount++
    }
    
    /**
     * 屏幕坐标转世界坐标
     */
    screenToWorld(screenX, screenY) {
        const canvas = this.canvas
        const width = canvas.width
        const height = canvas.height
        
        // 简单的2.5D投影
        const worldX = screenX
        const worldY = screenY * (1 + (screenY / height) * this.perspective)
        
        return { x: worldX, y: worldY }
    }
    
    /**
     * 检查位置是否有效
     */
    isValidPosition(x, y) {
        // 检查是否在地面附近
        const canvas = this.canvas
        const groundY = canvas.height * this.floorY
        if (Math.abs(y - groundY) > 50) {
            return false
        }
        
        // 检查是否与其他骨牌重叠
        for (let domino of this.dominoes) {
            const dx = x - domino.x
            const dy = y - domino.y
            if (Math.sqrt(dx * dx + dy * dy) < domino.width * 2) {
                return false
            }
        }
        
        return true
    }
    
    /**
     * 获取骨牌颜色
     */
    getDominoColor(index) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c', '#c44569']
        return colors[index % colors.length]
    }
    
    /**
     * 检查开始按钮点击
     */
    checkStartButtonClick(x, y) {
        const canvas = this.canvas
        const buttonX = canvas.width - 100
        const buttonY = 140 // 下移到140
        const buttonWidth = 80
        const buttonHeight = 40
        
        return x >= buttonX && x <= buttonX + buttonWidth &&
               y >= buttonY && y <= buttonY + buttonHeight
    }
    
    /**
     * 检查重置按钮点击
     */
    checkResetButtonClick(x, y) {
        const canvas = this.canvas
        const buttonX = canvas.width - 100
        const buttonY = 190 // 下移到190
        const buttonWidth = 80
        const buttonHeight = 40
        
        return x >= buttonX && x <= buttonX + buttonWidth &&
               y >= buttonY && y <= buttonY + buttonHeight
    }
    
    /**
     * 渲染游戏
     */
    render() {
        const ctx = this.ctx
        const canvas = this.canvas
        const width = canvas.width
        const height = canvas.height
        
        // 清空画布
        ctx.clearRect(0, 0, width, height)
        
        // 绘制背景（不受相机影响）
        this.drawBackground()
        
        // 应用相机变换
        this.applyCameraTransform(ctx)
        
        // 绘制地面
        this.drawGround()
        
        // 绘制起点和终点
        this.drawStartEndPoints()
        
        // 绘制障碍物
        this.drawObstacles()
        
        // 绘制骨牌
        this.drawDominoes()
        
        // 绘制推球
        if (this.pushingBall) {
            this.drawBall(this.pushingBall)
        }
        
        // 绘制拖拽预览
        if (this.isDragging && this.dragPreview) {
            this.drawDragPreview()
        }
        
        // 恢复相机变换
        ctx.restore()
        
        // 绘制道具区（不受相机影响）
        this.drawInventory()
        
        // 绘制UI（不受相机影响）
        this.drawUI()
        
        // 绘制缩放滑块（不受相机影响）
        this.drawZoomSlider()
    }
    
    /**
     * 绘制背景
     */
    drawBackground() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(1, '#98D8C8')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    /**
     * 绘制地面
     */
    drawGround() {
        const ctx = this.ctx
        const canvas = this.canvas
        const groundY = canvas.height * this.floorY
        
        // 地面渐变
        const gradient = ctx.createLinearGradient(0, groundY, 0, canvas.height)
        gradient.addColorStop(0, '#8B7355')
        gradient.addColorStop(1, '#6B5B45')
        ctx.fillStyle = gradient
        ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY)
        
        // 地面线条
        ctx.strokeStyle = '#5B4B35'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, groundY)
        ctx.lineTo(canvas.width, groundY)
        ctx.stroke()
    }
    
    /**
     * 绘制起点和终点
     */
    drawStartEndPoints() {
        const ctx = this.ctx
        
        // 起点
        ctx.fillStyle = '#4CAF50'
        ctx.beginPath()
        ctx.arc(this.startPoint.x, this.startPoint.y, this.startPoint.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'white'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('起点', this.startPoint.x, this.startPoint.y + 4)
        
        // 终点
        ctx.fillStyle = '#FF5722'
        ctx.beginPath()
        ctx.arc(this.endPoint.x, this.endPoint.y, this.endPoint.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'white'
        ctx.fillText('终点', this.endPoint.x, this.endPoint.y + 4)
    }
    
    /**
     * 绘制障碍物
     */
    drawObstacles() {
        const ctx = this.ctx
        
        this.obstacles.forEach(obstacle => {
            switch (obstacle.type) {
                case 'pendulum':
                    // 摆锤
                    const pendulumX = obstacle.x + Math.sin(obstacle.angle) * obstacle.length
                    const pendulumY = obstacle.y + Math.cos(obstacle.angle) * obstacle.length
                    
                    // 摆锤线
                    ctx.strokeStyle = '#8B4513'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(obstacle.x, obstacle.y)
                    ctx.lineTo(pendulumX, pendulumY)
                    ctx.stroke()
                    
                    // 摆锤球
                    ctx.fillStyle = '#CD853F'
                    ctx.beginPath()
                    ctx.arc(pendulumX, pendulumY, obstacle.radius, 0, Math.PI * 2)
                    ctx.fill()
                    break
                    
                case 'stair':
                    // 楼梯
                    ctx.fillStyle = '#696969'
                    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
                    break
                    
                case 'bridge':
                    // 桥梁
                    ctx.save()
                    ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2)
                    ctx.rotate(obstacle.rotation)
                    ctx.fillStyle = '#8B4513'
                    ctx.fillRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height)
                    ctx.restore()
                    break
            }
        })
    }
    
    /**
     * 绘制骨牌
     */
    drawDominoes() {
        const ctx = this.ctx
        
        // 按Y坐标排序，实现正确的遮挡关系
        const sortedDominoes = [...this.dominoes].sort((a, b) => a.y - b.y)
        
        sortedDominoes.forEach(domino => {
            ctx.save()
            ctx.translate(domino.x, domino.y)
            ctx.rotate(domino.angle)
            
            // 骨牌阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
            ctx.fillRect(-domino.width/2 + 2, -domino.height/2 + 2, domino.width, domino.height)
            
            // 骨牌主体
            ctx.fillStyle = domino.color
            ctx.fillRect(-domino.width/2, -domino.height/2, domino.width, domino.height)
            
            // 骨牌边框
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.lineWidth = 1
            ctx.strokeRect(-domino.width/2, -domino.height/2, domino.width, domino.height)
            
            ctx.restore()
        })
    }
    
    /**
     * 绘制球
     */
    drawBall(ball) {
        const ctx = this.ctx
        
        // 球的阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.beginPath()
        ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2)
        ctx.fill()
        
        // 球主体
        const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius)
        gradient.addColorStop(0, '#FF6B6B')
        gradient.addColorStop(1, '#C44569')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
        ctx.fill()
        
        // 球边框
        ctx.strokeStyle = '#8B2635'
        ctx.lineWidth = 1
        ctx.stroke()
    }
    
    /**
     * 绘制拖拽预览
     */
    drawDragPreview() {
        const ctx = this.ctx
        
        ctx.save()
        ctx.globalAlpha = this.dragPreview.alpha
        ctx.translate(this.dragPreview.x, this.dragPreview.y)
        ctx.rotate(this.dragPreview.angle)
        
        // 骨牌主体
        ctx.fillStyle = this.dragPreview.color
        ctx.fillRect(-this.dragPreview.width/2, -this.dragPreview.height/2, this.dragPreview.width, this.dragPreview.height)
        
        // 骨牌边框
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.lineWidth = 1
        ctx.strokeRect(-this.dragPreview.width/2, -this.dragPreview.height/2, this.dragPreview.width, this.dragPreview.height)
        
        ctx.restore()
    }
    
    /**
     * 绘制道具区
     */
    drawInventory() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 道具区背景
        const inventoryY = canvas.height - 80
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(0, inventoryY, canvas.width, 80)
        
        // 道具区标题
        ctx.fillStyle = 'white'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('多米诺道具', canvas.width / 2, inventoryY + 20)
        
        // 绘制道具槽位
        const slotWidth = 60
        const slotHeight = 60
        const startX = (canvas.width - this.inventorySlots * slotWidth) / 2
        const slotY = inventoryY + 25
        
        for (let i = 0; i < this.inventorySlots; i++) {
            const slotX = startX + i * slotWidth
            
            // 槽位背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.fillRect(slotX, slotY, slotWidth, slotHeight)
            
            // 槽位边框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.lineWidth = 1
            ctx.strokeRect(slotX, slotY, slotWidth, slotHeight)
            
            // 如果有对应的骨牌类型，绘制骨牌
            if (i < this.dominoInventory.length) {
                const dominoType = this.dominoInventory[i]
                
                if (dominoType.count > 0) {
                    // 绘制骨牌图标
                    const dominoHeight = this.getDominoHeight(dominoType.type)
                    const scale = Math.min(40 / dominoHeight, 1)
                    const scaledHeight = dominoHeight * scale
                    const scaledWidth = 8 * scale
                    
                    ctx.save()
                    ctx.translate(slotX + slotWidth/2, slotY + slotHeight/2)
                    
                    // 骨牌主体
                    ctx.fillStyle = dominoType.color
                    ctx.fillRect(-scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight)
                    
                    // 骨牌边框
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
                    ctx.lineWidth = 1
                    ctx.strokeRect(-scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight)
                    
                    ctx.restore()
                    
                    // 显示数量
                    ctx.fillStyle = 'white'
                    ctx.font = '12px Arial'
                    ctx.textAlign = 'center'
                    ctx.fillText(`×${dominoType.count}`, slotX + slotWidth/2, slotY + slotHeight - 5)
                    
                    // 显示名称
                    ctx.font = '10px Arial'
                    ctx.fillText(dominoType.name, slotX + slotWidth/2, slotY + 10)
                } else {
                    // 已用完的骨牌显示灰色
                    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)'
                    ctx.font = '12px Arial'
                    ctx.textAlign = 'center'
                    ctx.fillText('已用完', slotX + slotWidth/2, slotY + slotHeight/2)
                }
            }
        }
    }
    
    /**
     * 绘制缩放滑块
     */
    drawZoomSlider() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        const sliderX = 20
        const sliderY = 150
        const sliderWidth = 150
        const sliderHeight = 20
        
        // 滑块背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight)
        
        // 滑块轨道
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(sliderX + 5, sliderY + 5, sliderWidth - 10, sliderHeight - 10)
        
        // 滑块按钮
        const buttonX = sliderX + 5 + (sliderWidth - 10) * this.sliderValue
        ctx.fillStyle = '#4CAF50'
        ctx.fillRect(buttonX - 5, sliderY + 2, 10, sliderHeight - 4)
        
        // 缩放标签
        ctx.fillStyle = 'white'
        ctx.font = '12px Arial'
        ctx.textAlign = 'left'
        ctx.fillText('缩放', sliderX, sliderY - 5)
        
        // 缩放值
        ctx.textAlign = 'right'
        ctx.fillText(`${Math.round(this.cameraZoom * 100)}%`, sliderX + sliderWidth, sliderY - 5)
    }
    
    /**
     * 绘制UI
     */
    drawUI() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        // 顶部信息栏背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, canvas.width, 40)
        
        // 关卡信息
        ctx.fillStyle = 'white'
        ctx.font = '16px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`关卡 ${this.level}`, 20, 25)
        
        // 骨牌数量
        ctx.textAlign = 'center'
        ctx.fillText(`骨牌: ${this.dominoCount}/${this.maxDominoes}`, canvas.width / 2, 25)
        
        // 连锁数量
        ctx.textAlign = 'right'
        ctx.fillText(`连锁: ${this.chainCount}/${this.requiredChainCount}`, canvas.width - 20, 25)
        
        // 开始按钮（位置下移）
        const startButtonX = canvas.width - 100
        const startButtonY = 140
        ctx.fillStyle = this.isSimulating ? '#999' : '#4CAF50'
        ctx.fillRect(startButtonX, startButtonY, 80, 40)
        ctx.fillStyle = 'white'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(this.isSimulating ? '模拟中' : '开始', startButtonX + 40, startButtonY + 25)
        
        // 重置按钮（位置下移）
        const resetButtonX = canvas.width - 100
        const resetButtonY = 190
        ctx.fillStyle = '#f44336'
        ctx.fillRect(resetButtonX, resetButtonY, 80, 40)
        ctx.fillStyle = 'white'
        ctx.fillText('重置', resetButtonX + 40, resetButtonY + 25)
        
        // 操作提示
        if (!this.isSimulating) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, canvas.height - 110, canvas.width, 30)
            ctx.fillStyle = 'white'
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('拖拽底部骨牌到场地进行摆放，连接起点到终点', canvas.width / 2, canvas.height - 90)
        }
    }
    
    /**
     * 销毁游戏
     */
    destroy() {
        this.reset()
        super.destroy()
    }
}
