import SubGameBase from './subgame_base.js'

/**
 * 旋转多米诺游戏
 * 玩法：在旋转的中央物体上放置多米诺方块，停止旋转后触发连锁反应，全部倒下即胜利
 */
export default class SpinDominoGame extends SubGameBase {
    get id() {
        return 'spinDomino'
    }

    get name() {
        return '旋转多米诺'
    }

    init() {
        super.init()

        // 游戏配置
        this.config = {
            coreRadius: 80,
            dominoWidth: 8,
            dominoHeight: 40, // 增加到原来的2倍
            dominoDepth: 4,
            rotationSpeed: 0.5, // 弧度/秒 - 多米诺旋转速度
            maxDominos: 16,
            minDominoDistance: 15, // 最小间距
            chainDelay: 50, // 连锁延迟(ms)
            fallThreshold: 0.3, // 倒下阈值
            preplacedCount: 14, // 预先摆放的多米诺数量 (80%)
            placementTolerance: 0 // 放置容差范围
        }

        // 颜色配置
        this.colors = {
            bg: '#2c3e50',
            core: '#34495e',
            coreBorder: '#ecf0f1',
            domino: '#ffffff',
            dominoFalling: '#e74c3c',
            dominoFallen: '#95a5a6',
            text: '#ecf0f1',
            success: '#2ecc71',
            fail: '#e74c3c',
            ui: '#3498db'
        }

        // 游戏状态
        this.gameState = 'PLACING' // PLACING | STOPPING | CHAINING | ENDED | RESULT
        this.bounds = { width: 0, height: 0, centerX: 0, centerY: 0 }

        // 玩家多米诺管理
        this.playerDominos = [] // 待放置的玩家多米诺
        this.currentPlayerDominoIndex = 0
        this.allPlayerDominosPlaced = false

        // 结算画面动画
        this.resultAnimation = {
            time: 0,
            dancingDomino: null,
            backgroundScale: 1,
            backgroundPulse: 0
        }

        // 连锁反应计时器
        this.chainReactionTimer = 0
        this.autoEndTime = 5000 // 2秒自动结束

        // 旋转核心
        this.core = {
            x: 0,
            y: 0,
            radius: this.config.coreRadius,
            rotation: 0,
            isRotating: false // 核心不旋转
        }

        // 多米诺旋转角度
        this.dominoRotation = 0

        // 多米诺数组
        this.dominos = []

        // 游戏统计
        this.stats = {
            placedCount: 0,
            fallenCount: 0,
            totalCount: 0,
            gameWon: false,
            gameTime: 0
        }

        // UI状态
        this.ui = {
            message: '',
            messageAlpha: 0,
            buttonAlpha: 0,
            showButton: false
        }

        // 粒子效果
        this.particles = []

        this._initBounds()
        this._preplaceDominos()
        this._createPlayerDominos()
    }

    /**
     * 初始化边界
     */
    _initBounds() {
        const { canvas } = this.ctx
        this.bounds.width = canvas.width
        this.bounds.height = canvas.height
        this.bounds.centerX = this.bounds.width / 2
        this.bounds.centerY = this.bounds.height / 2

        this.core.x = this.bounds.centerX
        this.core.y = this.bounds.centerY
    }

    /**
     * 预先摆放多米诺
     */
    _preplaceDominos() {
        const angleStep = (2 * Math.PI) / this.config.preplacedCount
        
        for (let i = 0; i < this.config.preplacedCount; i++) {
            const angle = i * angleStep
            const distance = this.core.radius + this.config.dominoHeight / 2 // 刚好在圆圈上
            
            const domino = {
                id: this.stats.placedCount,
                baseAngle: angle,
                currentAngle: angle,
                baseRotation: angle + Math.PI / 2, // 指向圆心（垂直于半径）
                angle: 0, // 初始倒下角度为0
                x: this.core.x + Math.cos(angle) * distance,
                y: this.core.y + Math.sin(angle) * distance,
                distance: distance,
                isFalling: false,
                hasFallen: false,
                fallSpeed: 3,
                triggerTime: 0,
                neighbors: [],
                isPlayerPlaced: false // 预先摆放的多米诺不旋转
            }

            this.dominos.push(domino)
            this.stats.placedCount++
        }
    }

    /**
     * 创建玩家多米诺
     */
    _createPlayerDominos() {
        const playerDominoCount = this.config.maxDominos - this.config.preplacedCount
        const angleOffset = Math.PI / this.config.preplacedCount // 在预摆放多米诺之间的间隙
        
        // 准备所有玩家多米诺的位置，但不创建
        for (let i = 0; i < playerDominoCount; i++) {
            const angle = (i + 0.5) * angleOffset // 在间隙中放置
            this.playerDominos.push({
                angle: angle,
                placed: false
            })
        }

        // 创建第一个玩家多米诺
        this._createNextPlayerDomino()
    }

    /**
     * 创建下一个玩家多米诺
     */
    _createNextPlayerDomino() {
        if (this.currentPlayerDominoIndex < this.playerDominos.length) {
            const dominoData = this.playerDominos[this.currentPlayerDominoIndex]
            this._createDomino(dominoData.angle, 0)
            this.currentPlayerDominoIndex++
            
            // 如果是第2个及以后的多米诺，自动出现
            if (this.currentPlayerDominoIndex > 1) {
                // 第2个及以后的多米诺自动出现并旋转
            }
        }
        // 移除这里的提示，改为在真正放置完成时触发
    }

    /**
     * 更新游戏逻辑
     */
    update(dt) {
        this.stats.gameTime += dt

        // 更新多米诺旋转（只有玩家放置的多米诺绕核心转）
        if (this.gameState === 'PLACING') {
            this.dominoRotation += this.config.rotationSpeed * dt / 1000
        }

        // 处理落下动画
        this.dominos.forEach(domino => {
            if (domino.isDropping) {
                domino.distance -= domino.dropSpeed * dt / 1000
                if (domino.distance <= domino.targetDistance) {
                    domino.distance = domino.targetDistance
                    domino.isDropping = false
                    
                    // 如果是第1个多米诺放置完成，自动创建第2个
                    if (this.currentPlayerDominoIndex === 1 && this.currentPlayerDominoIndex < this.playerDominos.length) {
                        setTimeout(() => {
                            this._createNextPlayerDomino()
                        }, 300)
                    }
                    
                    // 检查是否所有玩家多米诺都已放置完成
                    this._checkAllPlayerDominosPlaced()
                }
                
                // 更新位置（保持指向圆心）
                const currentAngle = domino.baseAngle + this.dominoRotation
                domino.x = this.core.x + Math.cos(currentAngle) * domino.distance
                domino.y = this.core.y + Math.sin(currentAngle) * domino.distance
                domino.currentAngle = currentAngle
                domino.baseRotation = currentAngle + Math.PI / 2
            }
            // 未放置的玩家多米诺绕核心旋转
            else if (domino.isPlayerPlaced && domino.distance > domino.targetDistance) {
                const currentAngle = domino.baseAngle + this.dominoRotation
                domino.x = this.core.x + Math.cos(currentAngle) * domino.distance
                domino.y = this.core.y + Math.sin(currentAngle) * domino.distance
                domino.currentAngle = currentAngle
                domino.baseRotation = currentAngle + Math.PI / 2
            }
            // 已放置的玩家多米诺不旋转，但始终指向圆心
            else if (domino.isPlayerPlaced && !domino.isFalling) {
                // 计算指向圆心的角度
                const toCenterX = this.core.x - domino.x
                const toCenterY = this.core.y - domino.y
                const angleToCenter = Math.atan2(toCenterY, toCenterX)
                domino.baseRotation = angleToCenter + Math.PI / 2
            }
            // 预摆放多米诺保持静止，但始终指向圆心
            else if (!domino.isPlayerPlaced && !domino.isFalling) {
                // 计算指向圆心的角度
                const toCenterX = this.core.x - domino.x
                const toCenterY = this.core.y - domino.y
                const angleToCenter = Math.atan2(toCenterY, toCenterX)
                domino.baseRotation = angleToCenter + Math.PI / 2
            }
        })

        // 更新多米诺状态
        this._updateDominos(dt)

        // 更新粒子效果
        this._updateParticles(dt)

        // 更新UI透明度
        this._updateUI(dt)

        // 检查连锁反应
        if (this.gameState === 'CHAINING') {
            this.chainReactionTimer += dt
            
            // 3秒自动结束
            if (this.chainReactionTimer > this.autoEndTime) {
                this._checkGameEnd()
                return
            }
            
            this._updateChainReaction(dt)
        }

        // 更新结算画面动画
        if (this.gameState === 'RESULT') {
            this._updateResultAnimation(dt)
        }
    }

    /**
     * 检查所有玩家多米诺是否放置完成
     */
    _checkAllPlayerDominosPlaced() {
        // 检查是否所有玩家多米诺都已创建且都已放置
        const allCreated = this.currentPlayerDominoIndex >= this.playerDominos.length
        const allPlaced = this.dominos
            .filter(d => d.isPlayerPlaced)
            .every(d => d.distance <= d.targetDistance)
        
        if (allCreated && allPlaced && !this.allPlayerDominosPlaced) {
            this.allPlayerDominosPlaced = true
            this._showMessage('所有多米诺已放置! 点击屏幕开始连锁反应!')
        }
    }

    /**
     * 更新多米诺状态
     */
    _updateDominos(dt) {
        this.dominos.forEach(domino => {
            if (domino.isFalling && !domino.hasFallen) {
                domino.angle += domino.fallSpeed * dt / 1000
                if (Math.abs(domino.angle) >= Math.PI / 2) {
                    domino.angle = Math.sign(domino.angle) * Math.PI / 2
                    domino.hasFallen = true
                    this.stats.fallenCount++

                    // 生成粒子效果
                    this._createFallParticles(domino)
                }
            }
        })
    }

    /**
     * 更新结算画面动画
     */
    _updateResultAnimation(dt) {
        this.resultAnimation.time += dt / 1000
        const t = this.resultAnimation.time

        // 背景圆圈缩放动画
        this.resultAnimation.backgroundPulse = Math.sin(t * 2) * 0.1
        this.resultAnimation.backgroundScale = 1 + this.resultAnimation.backgroundPulse

        // 多米诺跳舞动画
        const domino = this.resultAnimation.dancingDomino
        domino.rotation = Math.sin(t * 4) * 0.3 // 左右摇摆
        domino.bounceY = Math.abs(Math.sin(t * 6)) * 20 // 上下跳动
        domino.scale = 1 + Math.sin(t * 8) * 0.1 // 缩放律动

        // 移除自动重新开始，等待玩家点击
    }

    /**
     * 更新粒子效果
     */
    _updateParticles(dt) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * dt / 1000
            particle.y += particle.vy * dt / 1000
            particle.life -= dt / 1000
            particle.alpha = particle.life / particle.maxLife
            return particle.life > 0
        })
    }

    /**
     * 更新UI透明度
     */
    _updateUI(dt) {
        if (this.ui.messageAlpha > 0) {
            this.ui.messageAlpha = Math.max(0, this.ui.messageAlpha - dt / 1000)
        }
        if (this.ui.buttonAlpha > 0 && this.ui.showButton) {
            this.ui.buttonAlpha = Math.min(1, this.ui.buttonAlpha + dt / 500)
        }
    }

    /**
     * 更新连锁反应
     */
    _updateChainReaction(dt) {
        let allStable = true
        
        this.dominos.forEach(domino => {
            if (!domino.physics) return
            
            // 应用重力（朝向圆心）
            const toCenterX = this.core.x - domino.x
            const toCenterY = this.core.y - domino.y
            const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY)
            
            if (distance > 0) {
                const gravity = 80 // 增加重力强度
                domino.physics.velocity.x += (toCenterX / distance) * gravity * dt / 1000
                domino.physics.velocity.y += (toCenterY / distance) * gravity * dt / 1000
            }
            
            // 应用切线力（垂直于径向的力）
            const radialAngle = Math.atan2(domino.y - this.core.y, domino.x - this.core.x)
            const tangentAngle = radialAngle + Math.PI / 2 // 切线方向
            
            // 如果多米诺倒下，产生切线力影响周围
            if (domino.isFalling) {
                const tangentForce = 100 // 增加切线力强度
                domino.physics.velocity.x += Math.cos(tangentAngle) * tangentForce * dt / 1000
                domino.physics.velocity.y += Math.sin(tangentAngle) * tangentForce * dt / 1000
                
                // 影响周围的多米诺
                this._applyTangentForceToNeighbors(domino, tangentForce)
            }
            
            // 应用阻尼
            const damping = 0.95 // 增加阻尼
            domino.physics.velocity.x *= damping
            domino.physics.velocity.y *= damping
            
            // 更新位置
            domino.x += domino.physics.velocity.x * dt / 1000
            domino.y += domino.physics.velocity.y * dt / 1000
            
            // 圆圈碰撞检测 - 使用力来推开
            const currentDistance = Math.sqrt(
                Math.pow(domino.x - this.core.x, 2) + 
                Math.pow(domino.y - this.core.y, 2)
            )
            
            const minDistance = this.core.radius + this.config.dominoHeight / 2
            if (currentDistance < minDistance) {
                // 计算推力
                const pushAngle = Math.atan2(domino.y - this.core.y, domino.x - this.core.x)
                const penetration = minDistance - currentDistance
                const pushForce = penetration * 200 // 推力与穿透深度成正比
                
                // 应用推力
                domino.physics.velocity.x += Math.cos(pushAngle) * pushForce * dt / 1000
                domino.physics.velocity.y += Math.sin(pushAngle) * pushForce * dt / 1000
                
                // 位置修正
                domino.x = this.core.x + Math.cos(pushAngle) * minDistance
                domino.y = this.core.y + Math.sin(pushAngle) * minDistance
            }
            
            // 多米诺之间的碰撞检测
            this._checkDominoCollisions(domino)
            
            // 检查是否倒下（基于位置偏移和角度）
            const expectedX = this.core.x + Math.cos(domino.baseAngle) * domino.distance
            const expectedY = this.core.y + Math.sin(domino.baseAngle) * domino.distance
            const positionOffset = Math.sqrt(
                Math.pow(domino.x - expectedX, 2) + 
                Math.pow(domino.y - expectedY, 2)
            )
            
            // 计算当前角度与径向的偏差
            const currentRadialAngle = Math.atan2(domino.y - this.core.y, domino.x - this.core.x)
            const expectedRadialAngle = domino.baseAngle
            let angleDeviation = currentRadialAngle - expectedRadialAngle
            
            // 标准化角度到[-π, π]范围
            while (angleDeviation > Math.PI) angleDeviation -= 2 * Math.PI
            while (angleDeviation < -Math.PI) angleDeviation += 2 * Math.PI
            
            // 如果位置偏移超过阈值或角度偏差过大，认为倒下了
            if (positionOffset > this.config.dominoHeight / 3 || Math.abs(angleDeviation) > Math.PI / 6) {
                if (!domino.isFalling) {
                    domino.isFalling = true
                    domino.hasFallen = true
                    this.stats.fallenCount++
                    this._createFallParticles(domino)
                    
                    // 强制设置倒下角度（与半径相切）
                    domino.angle = Math.sign(angleDeviation) * Math.PI / 2
                }
            }
            
            // 检查稳定性
            const speed = Math.sqrt(domino.physics.velocity.x ** 2 + domino.physics.velocity.y ** 2)
            if (speed < 3) { // 降低速度阈值到3
                domino.physics.stabilityTimer += dt
                if (domino.physics.stabilityTimer > 300) { // 减少稳定时间到0.3秒
                    domino.physics.isStable = true
                }
            } else {
                domino.physics.stabilityTimer = 0
                domino.physics.isStable = false
                allStable = false
            }
        })
        
        // 检查是否所有多米诺都稳定了
        const allDominos = this.dominos.filter(d => d.physics)
        const totalSpeed = allDominos.reduce((sum, domino) => {
            const speed = Math.sqrt(domino.physics.velocity.x ** 2 + domino.physics.velocity.y ** 2)
            return sum + speed
        }, 0)
        const averageSpeed = totalSpeed / allDominos.length
        
        // 如果平均速度很低，认为可以结束游戏
        if (averageSpeed < 0.5) {
            this._checkGameEnd()
        }
    }

    /**
     * 应用切线力到周围的多米诺
     */
    _applyTangentForceToNeighbors(fallingDomino, tangentForce) {
        this.dominos.forEach(other => {
            if (other === fallingDomino || other.isFalling) return
            
            const dx = other.x - fallingDomino.x
            const dy = other.y - fallingDomino.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const influenceRadius = this.config.dominoHeight * 2 // 影响半径
            
            if (distance < influenceRadius) {
                // 计算影响力（距离越近影响越大）
                const influence = 1 - (distance / influenceRadius)
                const appliedForce = tangentForce * influence * 0.8 // 增加影响力到80%
                
                // 应用切线力
                const angleToFalling = Math.atan2(dy, dx)
                other.physics.velocity.x += Math.cos(angleToFalling + Math.PI / 2) * appliedForce * 0.016
                other.physics.velocity.y += Math.sin(angleToFalling + Math.PI / 2) * appliedForce * 0.016
            }
        })
    }

    /**
     * 检查多米诺之间的碰撞
     */
    _checkDominoCollisions(domino) {
        this.dominos.forEach(other => {
            if (other === domino) return
            
            const dx = domino.x - other.x
            const dy = domino.y - other.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const minDistance = this.config.dominoHeight
            
            if (distance < minDistance && distance > 0) {
                // 计算碰撞推力
                const pushAngle = Math.atan2(dy, dx)
                const penetration = minDistance - distance
                const pushForce = penetration * 150 // 推力与穿透深度成正比
                
                // 应用推力给两个多米诺
                const forceX = Math.cos(pushAngle) * pushForce
                const forceY = Math.sin(pushAngle) * pushForce
                
                domino.physics.velocity.x += forceX * 0.016 // 假设60fps
                domino.physics.velocity.y += forceY * 0.016
                
                other.physics.velocity.x -= forceX * 0.016
                other.physics.velocity.y -= forceY * 0.016
                
                // 分离多米诺
                const separation = (minDistance - distance) / 2
                const separationX = Math.cos(pushAngle) * separation
                const separationY = Math.sin(pushAngle) * separation
                
                domino.x += separationX
                domino.y += separationY
                other.x -= separationX
                other.y -= separationY
            }
        })
    }

    /**
     * 渲染游戏
     */
    render() {
        const { main, canvas } = this.ctx
        const ctx = main.ctx

        // 清空画布
        ctx.fillStyle = this.colors.bg
        ctx.fillRect(0, 0, this.bounds.width, this.bounds.height)

        if (this.gameState === 'RESULT') {
            // 渲染结算画面
            this._renderResultScreen(ctx)
        } else {
            // 渲染游戏画面
            this._renderCore(ctx)
            this._renderDominos(ctx)
            this._renderParticles(ctx)
            this._renderUI(ctx)
        }
    }

    /**
     * 渲染结算画面
     */
    _renderResultScreen(ctx) {
        // 渲染背景圆圈动画
        this._renderAnimatedBackground(ctx)

        // 渲染跳舞的多米诺
        this._renderDancingDomino(ctx)

        // 渲染结果文本
        this._renderResultText(ctx)
    }

    /**
     * 渲染动画背景
     */
    _renderAnimatedBackground(ctx) {
        const scale = this.resultAnimation.backgroundScale
        
        ctx.save()
        ctx.translate(this.core.x, this.core.y)
        ctx.scale(scale, scale)

        // 多层圆圈动画
        for (let i = 3; i > 0; i--) {
            const radius = this.core.radius * i * 0.8
            const alpha = 0.1 / i
            
            ctx.fillStyle = this.stats.gameWon ? 
                `rgba(46, 204, 113, ${alpha})` : 
                `rgba(231, 76, 60, ${alpha})`
            ctx.beginPath()
            ctx.arc(0, 0, radius, 0, Math.PI * 2)
            ctx.fill()
        }

        // 核心圆圈
        ctx.fillStyle = this.colors.core
        ctx.beginPath()
        ctx.arc(0, 0, this.core.radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = this.colors.coreBorder
        ctx.lineWidth = 3
        ctx.stroke()

        ctx.restore()
    }

    /**
     * 渲染跳舞的多米诺
     */
    _renderDancingDomino(ctx) {
        const domino = this.resultAnimation.dancingDomino
        
        ctx.save()
        ctx.translate(domino.x, domino.y - domino.bounceY)
        ctx.rotate(domino.rotation)
        ctx.scale(domino.scale, domino.scale)

        // 多米诺主体
        ctx.fillStyle = domino.color
        ctx.fillRect(
            -this.config.dominoWidth * 2,
            -this.config.dominoHeight * 2,
            this.config.dominoWidth * 4,
            this.config.dominoHeight * 4
        )

        // 边框
        ctx.strokeStyle = '#2c3e50'
        ctx.lineWidth = 2
        ctx.strokeRect(
            -this.config.dominoWidth * 2,
            -this.config.dominoHeight * 2,
            this.config.dominoWidth * 4,
            this.config.dominoHeight * 4
        )

        ctx.restore()
    }

    /**
     * 渲染结果文本
     */
    _renderResultText(ctx) {
        const title = this.stats.gameWon ? '🎉 完美胜利!' : '😢 游戏失败'
        const subtitle = this.stats.gameWon ? 
            '所有多米诺都倒下了!' : 
            `倒下: ${this.stats.fallenCount}/${this.stats.totalCount}`

        // 标题
        ctx.fillStyle = this.stats.gameWon ? this.colors.success : this.colors.fail
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(title, this.bounds.centerX, this.bounds.centerY + 100)

        // 副标题
        ctx.fillStyle = this.colors.text
        ctx.font = '24px Arial'
        ctx.fillText(subtitle, this.bounds.centerX, this.bounds.centerY + 150)

        // 提示
        ctx.fillStyle = this.colors.text
        ctx.font = '16px Arial'
        ctx.globalAlpha = 0.7
        ctx.fillText('点击屏幕重新开始...', this.bounds.centerX, this.bounds.centerY + 200)
        ctx.globalAlpha = 1
    }

    /**
     * 渲染旋转核心
     */
    _renderCore(ctx) {
        ctx.save()
        ctx.translate(this.core.x, this.core.y)
        ctx.rotate(this.core.rotation)

        // 核心主体
        ctx.fillStyle = this.colors.core
        ctx.beginPath()
        ctx.arc(0, 0, this.core.radius, 0, Math.PI * 2)
        ctx.fill()

        // 核心边框
        ctx.strokeStyle = this.colors.coreBorder
        ctx.lineWidth = 3
        ctx.stroke()

        ctx.restore()
    }

    /**
     * 渲染多米诺
     */
    _renderDominos(ctx) {
        this.dominos.forEach(domino => {
            ctx.save()
            ctx.translate(domino.x, domino.y)
            ctx.rotate(domino.baseRotation + domino.angle)

            // 选择颜色
            if (domino.hasFallen) {
                ctx.fillStyle = this.colors.dominoFallen
            } else if (domino.isFalling) {
                ctx.fillStyle = this.colors.dominoFalling
            } else if (domino.isDropping) {
                ctx.fillStyle = '#f39c12' // 落下中的多米诺用橙色
            } else if (domino.isPlayerPlaced) {
                ctx.fillStyle = '#3498db' // 玩家放置的多米诺用蓝色
            } else {
                ctx.fillStyle = this.colors.domino
            }

            // 绘制多米诺
            ctx.fillRect(
                -this.config.dominoWidth / 2,
                -this.config.dominoHeight / 2,
                this.config.dominoWidth,
                this.config.dominoHeight
            )

            // 边框
            ctx.strokeStyle = '#2c3e50'
            ctx.lineWidth = 1
            ctx.strokeRect(
                -this.config.dominoWidth / 2,
                -this.config.dominoHeight / 2,
                this.config.dominoWidth,
                this.config.dominoHeight
            )

            ctx.restore()
        })
    }

    /**
     * 渲染粒子效果
     */
    _renderParticles(ctx) {
        this.particles.forEach(particle => {
            ctx.save()
            ctx.globalAlpha = particle.alpha
            ctx.fillStyle = particle.color
            ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4)
            ctx.restore()
        })
    }

    /**
     * 渲染UI
     */
    _renderUI(ctx) {
        // 游戏信息
        ctx.fillStyle = this.colors.text
        ctx.font = '16px Arial'
        ctx.fillText(`已放置: ${this.stats.placedCount}/${this.config.maxDominos}`, 10, 30)
        ctx.fillText(`状态: ${this._getStateText()}`, 10, 50)

        // 消息
        if (this.ui.messageAlpha > 0) {
            ctx.save()
            ctx.globalAlpha = this.ui.messageAlpha
            ctx.fillStyle = this.colors.text
            ctx.font = '24px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(this.ui.message, this.bounds.centerX, this.bounds.centerY - 100)
            ctx.restore()
        }

        // 按钮
        if (this.ui.showButton && this.ui.buttonAlpha > 0) {
            this._renderButton(ctx)
        }
    }

    /**
     * 渲染按钮
     */
    _renderButton(ctx) {
        const buttonWidth = 120
        const buttonHeight = 40
        const buttonX = this.bounds.centerX - buttonWidth / 2
        const buttonY = this.bounds.centerY + 50

        ctx.save()
        ctx.globalAlpha = this.ui.buttonAlpha

        // 按钮背景
        ctx.fillStyle = this.colors.ui
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight)

        // 按钮文字
        ctx.fillStyle = '#ffffff'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('停止旋转', this.bounds.centerX, buttonY + buttonHeight / 2)

        ctx.restore()
    }

    /**
     * 获取状态文本
     */
    _getStateText() {
        switch (this.gameState) {
            case 'PLACING': return '放置多米诺'
            case 'STOPPING': return '停止中...'
            case 'CHAINING': return '连锁反应'
            case 'ENDED': return this.stats.gameWon ? '胜利!' : '失败!'
            default: return '未知'
        }
    }

    /**
     * 处理触摸开始
     */
    onTouchStart(e) {
        // 结算画面时点击重新开始
        if (this.gameState === 'RESULT') {
            this._restart()
            return
        }

        if (this.gameState !== 'PLACING') return

        const touch = e.touches[0]
        const x = touch.clientX
        const y = touch.clientY

        // 检查是否点击了停止按钮
        if (this.ui.showButton && this._isButtonClicked(x, y)) {
            this._stopRotation()
            return
        }

        // 如果所有多米诺都已放置，触发连锁反应
        if (this.allPlayerDominosPlaced) {
            this._startChainReaction()
            return
        }

        // 检查是否有正在落下的多米诺
        const hasDroppingDomino = this.dominos.some(domino => 
            domino.isPlayerPlaced && domino.isDropping
        )

        if (hasDroppingDomino) {
            // 如果有正在落下的多米诺，不处理点击
            return
        }

        // 检查是否有未放置的当前多米诺
        const currentDomino = this.dominos.find(domino => 
            domino.isPlayerPlaced && domino.distance > domino.targetDistance
        )

        if (currentDomino) {
            // 触发当前多米诺落下
            this._triggerDropDominos()
        } else if (!this.allPlayerDominosPlaced) {
            // 当前多米诺已放置，创建下一个（第2个及以后自动出现）
            this._createNextPlayerDomino()
        }
    }

    /**
     * 触发多米诺倒下
     */
    _triggerDominoFall(domino) {
        if (domino.isFalling) return
        
        domino.isFalling = true
        domino.angle = 0
        
        // 给初始倒下速度
        if (domino.physics) {
            domino.physics.velocity.x = (Math.random() - 0.5) * 100
            domino.physics.velocity.y = (Math.random() - 0.5) * 100
            domino.physics.angularVelocity = (Math.random() - 0.5) * 5
        }
    }

    /**
     * 触发多米诺落下
     */
    _triggerDropDominos() {
        let hasDroppingDominos = false
        this.dominos.forEach(domino => {
            if (domino.isPlayerPlaced && !domino.isDropping && domino.distance > domino.targetDistance) {
                domino.isDropping = true
                hasDroppingDominos = true
            }
        })

        // 移除提示信息
    }

    /**
     * 检查按钮点击
     */
    _isButtonClicked(x, y) {
        const buttonWidth = 120
        const buttonHeight = 40
        const buttonX = this.bounds.centerX - buttonWidth / 2
        const buttonY = this.bounds.centerY + 50

        return x >= buttonX && x <= buttonX + buttonWidth &&
               y >= buttonY && y <= buttonY + buttonHeight
    }

    /**
     * 尝试放置多米诺
     */
    _tryPlaceDomino(x, y) {
        if (this.stats.placedCount >= this.config.maxDominos) {
            this._showMessage('已达到最大数量!')
            return
        }

        // 计算相对于核心的位置
        const dx = x - this.core.x
        const dy = y - this.core.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)

        // 创建多米诺（从远处开始）
        this._createDomino(angle, distance)
    }

    /**
     * 检查碰撞
     */
    _checkCollision(newAngle, newDistance) {
        return this.dominos.some(domino => {
            const angleDiff = Math.abs(domino.baseAngle - newAngle)
            const minAngle = this.config.minDominoDistance / newDistance
            
            return angleDiff < minAngle || angleDiff > (2 * Math.PI - minAngle)
        })
    }

    /**
     * 创建多米诺
     */
    _createDomino(angle, clickDistance) {
        // 从半径+25的位置开始
        const startDistance = this.core.radius + 25
        const targetDistance = this.core.radius + this.config.dominoHeight / 2 // 刚好在圆圈上
        
        const domino = {
            id: this.stats.placedCount,
            baseAngle: angle,
            currentAngle: angle,
            baseRotation: angle + Math.PI / 2, // 指向圆心（垂直于半径）
            angle: 0, // 初始倒下角度为0
            x: this.core.x + Math.cos(angle) * startDistance,
            y: this.core.y + Math.sin(angle) * startDistance,
            distance: startDistance,
            targetDistance: targetDistance,
            isFalling: false,
            hasFallen: false,
            fallSpeed: 3,
            triggerTime: 0,
            neighbors: [],
            isPlayerPlaced: true, // 玩家放置的多米诺会旋转
            isDropping: false, // 初始不落下，等待点击
            dropSpeed: 200 // 落下速度（像素/秒）
        }

        this.dominos.push(domino)
        this.stats.placedCount++

        this._showMessage('点击屏幕放置多米诺!')
    }

    /**
     * 停止旋转
     */
    _stopRotation() {
        if (this.gameState !== 'PLACING') return

        this.gameState = 'STOPPING'
        this.ui.showButton = false

        // 开始连锁反应
        setTimeout(() => {
            this._startChainReaction()
        }, 500)
    }

    /**
     * 开始连锁反应
     */
    _startChainReaction() {
        this.gameState = 'CHAINING'
        this.stats.totalCount = this.dominos.length

        // 只触发最后放置的那个多米诺倒下
        const lastPlacedDomino = this.dominos
            .filter(d => d.isPlayerPlaced)
            .reduce((last, current) => {
                // 找到最后一个被放置的多米诺（distance == targetDistance且不是倒下状态）
                if (current.distance <= current.targetDistance && !current.isFalling && !current.hasFallen) {
                    return current
                }
                return last
            }, null)

        if (lastPlacedDomino) {
            this._triggerDominoFall(lastPlacedDomino)
        } else if (this.dominos.length > 0) {
            // 如果没有玩家多米诺，触发第一个
            this._triggerDominoFall(this.dominos[0])
        }

        // 开始检查物理效应
        this._startPhysicsSimulation()
    }

    /**
     * 开始物理模拟
     */
    _startPhysicsSimulation() {
        // 为所有多米诺添加物理属性（包括预摆放的）
        this.dominos.forEach(domino => {
            if (domino.hasFallen) {
                return // 跳过已经倒下的多米诺
            }
            
            domino.physics = {
                velocity: { x: 0, y: 0 },
                angularVelocity: 0,
                isStable: false,
                stabilityTimer: 0
            }
        })
    }

    /**
     * 计算邻居关系
     */
    _calculateNeighbors() {
        this.dominos.forEach((domino, i) => {
            domino.neighbors = []
            this.dominos.forEach((other, j) => {
                if (i !== j) {
                    const distance = this._calculateDominoDistance(domino, other)
                    if (distance < this.config.minDominoDistance * 2) {
                        domino.neighbors.push({ domino: other, distance })
                    }
                }
            })
        })
    }

    /**
     * 计算多米诺间距离
     */
    _calculateDominoDistance(domino1, domino2) {
        const dx = domino1.x - domino2.x
        const dy = domino1.y - domino2.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    /**
     * 创建落下粒子
     */
    _createFallParticles(domino) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: domino.x,
                y: domino.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                color: this.colors.domino,
                life: 1,
                maxLife: 1,
                alpha: 1
            })
        }
    }

    /**
     * 检查游戏结束
     */
    _checkGameEnd() {
        this.gameState = 'ENDED'
        this.stats.gameWon = this.stats.fallenCount === this.stats.totalCount

        // 初始化结算画面动画
        this._initResultAnimation()

        // 1秒后进入结算画面
        setTimeout(() => {
            this.gameState = 'RESULT'
        }, 1000)
    }

    /**
     * 初始化结算画面动画
     */
    _initResultAnimation() {
        this.resultAnimation.time = 0
        this.resultAnimation.backgroundScale = 1
        this.resultAnimation.backgroundPulse = 0
        
        // 创建跳舞的多米诺
        this.resultAnimation.dancingDomino = {
            x: this.bounds.centerX,
            y: this.bounds.centerY - 50,
            rotation: 0,
            scale: 1,
            bounceY: 0,
            color: this.stats.gameWon ? this.colors.success : this.colors.fail
        }
    }

    /**
     * 显示消息
     */
    _showMessage(message) {
        this.ui.message = message
        this.ui.messageAlpha = 1
    }

    /**
     * 重新开始游戏
     */
    _restart() {
        this.gameState = 'PLACING'
        this.dominoRotation = 0
        this.dominos = []
        this.particles = []
        
        // 重置玩家多米诺管理
        this.playerDominos = []
        this.currentPlayerDominoIndex = 0
        this.allPlayerDominosPlaced = false
        
        // 重置连锁反应计时器
        this.chainReactionTimer = 0
        
        // 重置结算动画
        this.resultAnimation = {
            time: 0,
            dancingDomino: null,
            backgroundScale: 1,
            backgroundPulse: 0
        }
        
        this.stats = {
            placedCount: 0,
            fallenCount: 0,
            totalCount: 0,
            gameWon: false,
            gameTime: 0
        }
        this.ui = {
            message: '',
            messageAlpha: 0,
            buttonAlpha: 0,
            showButton: false
        }

        // 重新初始化游戏
        this._preplaceDominos()
        this._createPlayerDominos()
    }

    /**
     * 销毁游戏
     */
    destroy() {
        this.dominos = []
        this.particles = []
        this.core.isRotating = false
    }
}
