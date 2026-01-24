import SubGameBase from './subgame_base.js'

/**
 * 幸运球体竞技游戏
 * 35个球下落竞技，玩家控制主控球收集因子，最终生成7个幸运号码
 */
export default class LuckyDominoGame extends SubGameBase {
    get id() {
        return 'luckyDomino'
    }

    get name() {
        return '幸运球体竞技'
    }

    init() {
        super.init()

        // 游戏配置
        this.config = {
            leftBallCount: 35, // 左赛道球数量(1-35)
            rightBallCount: 12, // 右赛道球数量(1-12)
            ballRadius: 10, // 球半径
            gravity: 0.3, // 重力加速度
            maxVelocity: 8, // 最大下落速度
            repulsionForce: 0.5, // 球体间排斥力
            minDistance: 20, // 最小距离
            factorRadius: 6, // 因子半径
            factorAttraction: 0.2, // 因子吸引力
            skillCooldown: 2000, // 技能冷却时间(ms)
            skillForce: 3, // 技能推力
            trackWidth: 180, // 单赛道宽度
            trackHeight: 6000, // 赛道高度(10倍屏幕高度)
            trackGap: 40, // 赛道间距
            obstacleDamage: 20, // 障碍物伤害
            cameraFollowSpeed: 0.1, // 相机跟随速度
            cameraOffset: 200, // 相机偏移量
            teamColors: {
                red: '#e74c3c',
                blue: '#3498db', 
                green: '#2ecc71',
                yellow: '#f1c40f',
                purple: '#9b59b6'
            }
        }

        // 颜色配置
        this.colors = {
            bg: '#1a1a2e',
            track: '#16213e',
            divider: '#34495e',
            ball: '#ecf0f1',
            ballLowHp: '#95a5a6',
            text: '#ecf0f1',
            ui: '#3498db',
            obstacle: '#e74c3c',
            factor: '#f1c40f'
        }

        // 游戏状态
        this.gameState = 'SELECTING' // SELECTING | PLAYING | FINISHED | RESULT
        this.bounds = { width: 0, height: 0, centerX: 0, centerY: 0 }

        // 球体数组
        this.leftBalls = [] // 左赛道球体(1-35)
        this.rightBalls = [] // 右赛道球体(1-12)
        this.leftPlayerBall = null // 左赛道玩家选择的主控球
        this.rightPlayerBall = null // 右赛道玩家选择的主控球
        this.selectedLeftBallIndex = -1
        this.selectedRightBallIndex = -1

        // 因子系统
        this.leftFactors = []
        this.rightFactors = []
        this.obstacles = []

        // 技能系统
        this.skillCooldown = 0
        this.lastSkillTime = 0

        // 团队统计
        this.teamStats = {
            red: 0,
            blue: 0,
            green: 0,
            yellow: 0,
            purple: 0
        }

        // 结果数据
        this.leftLuckyNumbers = [] // 左赛道5个幸运数字
        this.rightLuckyNumbers = [] // 右赛道2个幸运数字
        this.allLuckyNumbers = [] // 所有7个幸运数字
        this.playerTeam = null

        // UI状态
        this.ui = {
            message: '',
            messageAlpha: 0,
            showConfirm: false,
            confirmAlpha: 0
        }

        // 相机系统
        this.camera = {
            y: 0,
            targetY: 0,
            minY: 0,
            maxY: this.config.trackHeight - this.bounds.height
        }

        // 结算动画系统
        this.settlement = {
            isSettling: false,
            settlementTimer: 0,
            settlementDuration: 3000, // 3秒结算时间
            cameraToBottom: false,
            showResults: false,
            resultTimer: 0,
            resultDelay: 2000 // 2秒结果显示延迟
        }

        // 调用start方法来初始化游戏
        this.start()
    }

    start() {
        this.bounds = {
            width: this.ctx.canvas.width,
            height: this.ctx.canvas.height,
            centerX: this.ctx.canvas.width / 2,
            centerY: this.ctx.canvas.height / 2
        }

        this._initializeBalls()
        this._initializeTrack()
        
        // 随机选择默认球
        this._randomSelectBalls()
        
        this._showMessage('点击"开始幸运之旅"开始游戏')
    }

    /**
     * 随机选择默认球
     */
    _randomSelectBalls() {
        // 随机选择左赛道球
        this.selectedLeftBallIndex = Math.floor(Math.random() * this.leftBalls.length)
        
        // 随机选择右赛道球
        this.selectedRightBallIndex = Math.floor(Math.random() * this.rightBalls.length)
        
        // 显示确认按钮
        this.ui.confirmAlpha = 1
    }

    /**
     * 初始化球体
     */
    _initializeBalls() {
        this.leftBalls = []
        this.rightBalls = []

        // 左赛道球体(1-35)
        const leftRows = 5
        const leftCols = 7
        const leftSpacing = 25
        const leftStartX = this.bounds.centerX - this.config.trackGap / 2 - this.config.trackWidth + (this.config.trackWidth - (leftCols - 1) * leftSpacing) / 2
        const startY = 50

        for (let i = 0; i < this.config.leftBallCount; i++) {
            const row = Math.floor(i / leftCols)
            const col = i % leftCols
            
            const ball = {
                id: i,
                number: i + 1,
                x: leftStartX + col * leftSpacing + (Math.random() - 0.5) * 5,
                y: startY + row * leftSpacing,
                vx: 0,
                vy: 0,
                hp: 100,
                maxHp: 100,
                isPlayer: false,
                factors: {
                    red: 0,
                    blue: 0,
                    green: 0,
                    yellow: 0,
                    purple: 0
                },
                dominantTeam: null,
                finished: false,
                finishTime: 0,
                score: 0,
                track: 'left'
            }
            
            this.leftBalls.push(ball)
        }

        // 右赛道球体(1-12)
        const rightRows = 3
        const rightCols = 4
        const rightSpacing = 30
        const rightStartX = this.bounds.centerX + this.config.trackGap / 2 + (this.config.trackWidth - (rightCols - 1) * rightSpacing) / 2

        for (let i = 0; i < this.config.rightBallCount; i++) {
            const row = Math.floor(i / rightCols)
            const col = i % rightCols
            
            const ball = {
                id: i + this.config.leftBallCount,
                number: i + 1,
                x: rightStartX + col * rightSpacing + (Math.random() - 0.5) * 5,
                y: startY + row * rightSpacing,
                vx: 0,
                vy: 0,
                hp: 100,
                maxHp: 100,
                isPlayer: false,
                factors: {
                    red: 0,
                    blue: 0,
                    green: 0,
                    yellow: 0,
                    purple: 0
                },
                dominantTeam: null,
                finished: false,
                finishTime: 0,
                score: 0,
                track: 'right'
            }
            
            this.rightBalls.push(ball)
        }
    }

    /**
     * 触摸开始事件处理
     */
    onTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return
        
        const touch = e.touches[0]
        const x = touch.clientX
        const y = touch.clientY
        
        this.onTouch(x, y)
    }

    /**
     * 初始化赛道
     */
    _initializeTrack() {
        // 清空现有元素
        this.leftFactors = []
        this.rightFactors = []
        this.obstacles = []

        // 左赛道因子 - 分布在整个赛道高度
        for (let i = 0; i < 100; i++) {
            const teams = Object.keys(this.config.teamColors)
            const team = teams[Math.floor(Math.random() * teams.length)]
            
            this.leftFactors.push({
                x: this.bounds.centerX - this.config.trackGap / 2 - this.config.trackWidth / 2 + Math.random() * this.config.trackWidth,
                y: 150 + Math.random() * (this.config.trackHeight - 300), // 分布在整个赛道
                team: team,
                collected: false,
                value: Math.random() * 5 + 3,
                track: 'left'
            })
        }

        // 右赛道因子 - 分布在整个赛道高度
        for (let i = 0; i < 60; i++) {
            const teams = Object.keys(this.config.teamColors)
            const team = teams[Math.floor(Math.random() * teams.length)]
            
            this.rightFactors.push({
                x: this.bounds.centerX + this.config.trackGap / 2 - this.config.trackWidth / 2 + Math.random() * this.config.trackWidth,
                y: 150 + Math.random() * (this.config.trackHeight - 300), // 分布在整个赛道
                team: team,
                collected: false,
                value: Math.random() * 5 + 3,
                track: 'right'
            })
        }

        // 左赛道障碍物 - 减少数量
        for (let i = 0; i < 15; i++) {
            this.obstacles.push({
                x: this.bounds.centerX - this.config.trackGap / 2 - this.config.trackWidth / 2 + Math.random() * this.config.trackWidth,
                y: 500 + Math.random() * (this.config.trackHeight - 1000), // 从500米开始分布
                width: 25 + Math.random() * 15,
                height: 8,
                type: Math.random() > 0.5 ? 'spike' : 'blade',
                rotation: Math.random() * Math.PI * 2,
                track: 'left'
            })
        }

        // 右赛道障碍物 - 减少数量
        for (let i = 0; i < 10; i++) {
            this.obstacles.push({
                x: this.bounds.centerX + this.config.trackGap / 2 - this.config.trackWidth / 2 + Math.random() * this.config.trackWidth,
                y: 500 + Math.random() * (this.config.trackHeight - 1000), // 从500米开始分布
                width: 25 + Math.random() * 15,
                height: 8,
                type: Math.random() > 0.5 ? 'spike' : 'blade',
                rotation: Math.random() * Math.PI * 2,
                track: 'right'
            })
        }
    }

    update(dt) {
        if (this.gameState === 'PLAYING') {
            this._updateBalls(dt)
            this._updateSkillCooldown(dt)
            this._checkCollisions()
            this._updateTeamStats()
            this._updateCamera(dt) // 更新相机跟随
            this._checkGameEnd()
        } else if (this.gameState === 'FINISHED') {
            this._updateSettlement(dt)
        }

        // 更新UI透明度
        if (this.ui.messageAlpha > 0) {
            this.ui.messageAlpha = Math.max(0, this.ui.messageAlpha - dt / 1000)
        }
    }

    /**
     * 更新结算动画
     */
    _updateSettlement(dt) {
        this.settlement.settlementTimer += dt

        // 第一阶段：相机移到底部（1.5秒）
        if (this.settlement.settlementTimer < 1500 && !this.settlement.cameraToBottom) {
            const targetY = this.config.trackHeight - this.bounds.height
            this.camera.y += (targetY - this.camera.y) * 0.05
            
            if (Math.abs(targetY - this.camera.y) < 10) {
                this.camera.y = targetY
                this.settlement.cameraToBottom = true
            }
        }

        // 第二阶段：等待结算完成
        if (this.settlement.settlementTimer >= this.settlement.settlementDuration) {
            if (!this.settlement.showResults) {
                this._generateLuckyNumbers()
                this.settlement.showResults = true
                this._showMessage('幸运号码生成完成！')
            }

            this.settlement.resultTimer += dt
            
            // 第三阶段：显示结果（延迟2秒）
            if (this.settlement.resultTimer >= this.settlement.resultDelay) {
                this.gameState = 'RESULT'
            }
        }
    }

    /**
     * 更新相机跟随
     */
    _updateCamera(dt) {
        // 在游戏中跟随左玩家球
        if (this.gameState === 'PLAYING' && this.leftPlayerBall) {
            // 设置相机目标位置为左玩家球的位置，加上偏移量
            this.camera.targetY = this.leftPlayerBall.y - this.config.cameraOffset
            
            // 限制相机范围
            this.camera.targetY = Math.max(this.camera.minY, Math.min(this.camera.maxY, this.camera.targetY))
            
            // 平滑跟随
            const diff = this.camera.targetY - this.camera.y
            this.camera.y += diff * this.config.cameraFollowSpeed
        }
    }

    /**
     * 更新球体
     */
    _updateBalls(dt) {
        // 更新左赛道球体
        this.leftBalls.forEach(ball => {
            if (ball.finished) return
            this._updateSingleBall(ball, 'left', dt)
        })

        // 更新右赛道球体
        this.rightBalls.forEach(ball => {
            if (ball.finished) return
            this._updateSingleBall(ball, 'right', dt)
        })
    }

    /**
     * 更新单个球体
     */
    _updateSingleBall(ball, track, dt) {
        // 应用重力
        ball.vy = Math.min(ball.vy + this.config.gravity, this.config.maxVelocity)

        // 应用排斥力
        this._applyRepulsion(ball, track)

        // 应用因子吸引力（仅对玩家球）
        if (ball.isPlayer) {
            this._applyFactorAttraction(ball, track)
        }

        // 更新位置
        ball.x += ball.vx
        ball.y += ball.vy

        // 应用阻尼
        ball.vx *= 0.98

        // 边界检测
        let leftBound, rightBound
        if (track === 'left') {
            leftBound = this.bounds.centerX - this.config.trackGap / 2 - this.config.trackWidth
            rightBound = this.bounds.centerX - this.config.trackGap / 2
        } else {
            leftBound = this.bounds.centerX + this.config.trackGap / 2
            rightBound = this.bounds.centerX + this.config.trackGap / 2 + this.config.trackWidth
        }
        
        if (ball.x - this.config.ballRadius < leftBound) {
            ball.x = leftBound + this.config.ballRadius
            ball.vx = Math.abs(ball.vx) * 0.5
        }
        if (ball.x + this.config.ballRadius > rightBound) {
            ball.x = rightBound - this.config.ballRadius
            ball.vx = -Math.abs(ball.vx) * 0.5
        }

        // 血量影响速度
        const hpRatio = ball.hp / ball.maxHp
        if (hpRatio < 0.5) {
            ball.vy *= 0.8 // 血量低于50%时变慢
        }

        // 更新主导团队
        this._updateDominantTeam(ball)
    }

    /**
     * 应用排斥力
     */
    _applyRepulsion(ball, track) {
        const balls = track === 'left' ? this.leftBalls : this.rightBalls
        balls.forEach(other => {
            if (other === ball || other.finished) return

            const dx = ball.x - other.x
            const dy = ball.y - other.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < this.config.minDistance && distance > 0) {
                const force = this.config.repulsionForce * (1 - distance / this.config.minDistance)
                ball.vx += (dx / distance) * force
                ball.vy += (dy / distance) * force
            }
        })
    }

    /**
     * 应用因子吸引力
     */
    _applyFactorAttraction(ball, track) {
        const factors = track === 'left' ? this.leftFactors : this.rightFactors
        factors.forEach(factor => {
            if (factor.collected) return

            const dx = factor.x - ball.x
            const dy = factor.y - ball.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 100) { // 吸引范围
                const force = this.config.factorAttraction * (1 - distance / 100)
                ball.vx += (dx / distance) * force
                ball.vy += (dy / distance) * force
            }
        })
    }

    /**
     * 检查碰撞
     */
    _checkCollisions() {
        // 检查左赛道碰撞
        this.leftBalls.forEach(ball => {
            if (ball.finished) return
            this._checkBallCollisions(ball, 'left')
        })

        // 检查右赛道碰撞
        this.rightBalls.forEach(ball => {
            if (ball.finished) return
            this._checkBallCollisions(ball, 'right')
        })
    }

    /**
     * 检查单个球体的碰撞
     */
    _checkBallCollisions(ball, track) {
        const factors = track === 'left' ? this.leftFactors : this.rightFactors
        
        // 检查球与因子碰撞
        factors.forEach(factor => {
            if (factor.collected) return

            const dx = ball.x - factor.x
            const dy = ball.y - factor.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < this.config.ballRadius + this.config.factorRadius) {
                factor.collected = true
                ball.factors[factor.team] += factor.value
            }
        })

        // 检查球与障碍物碰撞
        this.obstacles.forEach(obstacle => {
            if (obstacle.track !== track) return
            if (this._checkBallObstacleCollision(ball, obstacle)) {
                ball.hp = Math.max(0, ball.hp - this.config.obstacleDamage)
            }
        })
    }

    /**
     * 检查球与障碍物碰撞
     */
    _checkBallObstacleCollision(ball, obstacle) {
        const closestX = Math.max(obstacle.x - obstacle.width / 2, 
                                  Math.min(ball.x, obstacle.x + obstacle.width / 2))
        const closestY = Math.max(obstacle.y - obstacle.height / 2, 
                                  Math.min(ball.y, obstacle.y + obstacle.height / 2))
        
        const dx = ball.x - closestX
        const dy = ball.y - closestY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        return distance < this.config.ballRadius
    }

    /**
     * 更新主导团队
     */
    _updateDominantTeam(ball) {
        let maxFactor = 0
        let dominantTeam = null

        Object.entries(ball.factors).forEach(([team, value]) => {
            if (value > maxFactor) {
                maxFactor = value
                dominantTeam = team
            }
        })

        ball.dominantTeam = dominantTeam
    }

    /**
     * 更新团队统计
     */
    _updateTeamStats() {
        // 重置统计
        Object.keys(this.teamStats).forEach(team => {
            this.teamStats[team] = 0
        })

        // 统计左赛道各队球数
        this.leftBalls.forEach(ball => {
            if (ball.dominantTeam) {
                this.teamStats[ball.dominantTeam]++
            }
        })

        // 统计右赛道各队球数
        this.rightBalls.forEach(ball => {
            if (ball.dominantTeam) {
                this.teamStats[ball.dominantTeam]++
            }
        })
    }

    /**
     * 更新技能冷却
     */
    _updateSkillCooldown(dt) {
        if (this.skillCooldown > 0) {
            this.skillCooldown = Math.max(0, this.skillCooldown - dt)
        }
    }

    /**
     * 检查游戏结束
     */
    _checkGameEnd() {
        // 检查左赛道所有球是否到达底部
        const allLeftFinished = this.leftBalls.every(ball => 
            ball.finished || ball.y > this.config.trackHeight - 50
        )
        
        // 检查右赛道所有球是否到达底部
        const allRightFinished = this.rightBalls.every(ball => 
            ball.finished || ball.y > this.config.trackHeight - 50
        )
        
        if (allLeftFinished && allRightFinished) {
            this.gameState = 'FINISHED'
            this.settlement.isSettling = true
            this._showMessage('所有球已到达终点，正在结算...')
        }
    }

    /**
     * 生成幸运号码
     */
    _generateLuckyNumbers() {
        // 左赛道生成5个幸运数字(1-35)
        if (this.leftPlayerBall) {
            const leftTeam = this.leftPlayerBall.dominantTeam || 'red'
            const leftTeamBalls = this.leftBalls.filter(ball => ball.dominantTeam === leftTeam)
            
            leftTeamBalls.sort((a, b) => {
                const scoreA = a.factors[leftTeam] * (a.hp / a.maxHp)
                const scoreB = b.factors[leftTeam] * (b.hp / b.maxHp)
                return scoreB - scoreA
            })
            
            this.leftLuckyNumbers = leftTeamBalls.slice(0, 5).map(ball => ball.number)
            
            // 如果不足5个，用其他球补足
            if (this.leftLuckyNumbers.length < 5) {
                const otherBalls = this.leftBalls.filter(ball => ball.dominantTeam !== leftTeam)
                otherBalls.sort((a, b) => b.hp - a.hp)
                const needed = 5 - this.leftLuckyNumbers.length
                this.leftLuckyNumbers.push(...otherBalls.slice(0, needed).map(ball => ball.number))
            }
        }

        // 右赛道生成2个幸运数字(1-12)
        if (this.rightPlayerBall) {
            const rightTeam = this.rightPlayerBall.dominantTeam || 'blue'
            const rightTeamBalls = this.rightBalls.filter(ball => ball.dominantTeam === rightTeam)
            
            rightTeamBalls.sort((a, b) => {
                const scoreA = a.factors[rightTeam] * (a.hp / a.maxHp)
                const scoreB = b.factors[rightTeam] * (b.hp / b.maxHp)
                return scoreB - scoreA
            })
            
            this.rightLuckyNumbers = rightTeamBalls.slice(0, 2).map(ball => ball.number)
            
            // 如果不足2个，用其他球补足
            if (this.rightLuckyNumbers.length < 2) {
                const otherBalls = this.rightBalls.filter(ball => ball.dominantTeam !== rightTeam)
                otherBalls.sort((a, b) => b.hp - a.hp)
                const needed = 2 - this.rightLuckyNumbers.length
                this.rightLuckyNumbers.push(...otherBalls.slice(0, needed).map(ball => ball.number))
            }
        }

        // 合并所有幸运数字（不重新排序）
        this.allLuckyNumbers = [...this.leftLuckyNumbers, ...this.rightLuckyNumbers]
    }

    render() {
        const { main, canvas } = this.ctx
        const ctx = main.ctx

        // 清空画布
        ctx.fillStyle = this.colors.bg
        ctx.fillRect(0, 0, this.bounds.width, this.bounds.height)

        // 保存相机状态
        ctx.save()
        
        // 应用相机偏移
        if (this.gameState === 'PLAYING' || this.gameState === 'FINISHED') {
            ctx.translate(0, -this.camera.y)
        }

        if (this.gameState === 'SELECTING') {
            this._renderSelectionScreen(ctx)
        } else if (this.gameState === 'PLAYING') {
            this._renderGame(ctx)
        } else if (this.gameState === 'FINISHED') {
            this._renderSettlement(ctx) // 渲染结算画面
        } else if (this.gameState === 'RESULT') {
            this._renderResult(ctx)
        }

        // 恢复相机状态
        ctx.restore()

        // UI元素不受相机影响
        this._renderUI(ctx)
    }

    /**
     * 渲染选择界面
     */
    _renderSelectionScreen(ctx) {
        // 标题
        ctx.fillStyle = '#f1c40f'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('🍀 幸运球体竞技 🍀', this.bounds.centerX,this.bounds.height/2 )
        
        // 选择提示
        ctx.fillStyle = '#ecf0f1'
        ctx.font = '16px Arial'
        ctx.fillText('点击球体可以重新选择，或直接开始游戏', this.bounds.centerX, this.bounds.height/2+80)

        // 显示当前选择
        if (this.selectedLeftBallIndex >= 0 && this.selectedRightBallIndex >= 0) {
            const leftBall = this.leftBalls[this.selectedLeftBallIndex]
            const rightBall = this.rightBalls[this.selectedRightBallIndex]
            
            ctx.fillStyle = '#2ecc71'
            ctx.font = 'bold 18px Arial'
            ctx.fillText(`已选择：左[${leftBall.number}]号 右[${rightBall.number}]号`, this.bounds.centerX, this.bounds.height/2+110)
        }

        // 渲染左赛道球体
        this.leftBalls.forEach((ball, index) => {
            const isSelected = index === this.selectedLeftBallIndex
            
            // 球体
            ctx.fillStyle = isSelected ? this.colors.ui : this.colors.ball
            ctx.beginPath()
            ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, Math.PI * 2)
            ctx.fill()

            // 选中光环
            if (isSelected) {
                ctx.strokeStyle = this.colors.ui
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(ball.x, ball.y, this.config.ballRadius + 5, 0, Math.PI * 2)
                ctx.stroke()
            }

            // 编号
            ctx.fillStyle = '#2c3e50'
            ctx.font = 'bold 10px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(ball.number.toString(), ball.x, ball.y)
        })

        // 渲染右赛道球体
        this.rightBalls.forEach((ball, index) => {
            const isSelected = index === this.selectedRightBallIndex
            
            // 球体
            ctx.fillStyle = isSelected ? this.colors.ui : this.colors.ball
            ctx.beginPath()
            ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, Math.PI * 2)
            ctx.fill()

            // 选中光环
            if (isSelected) {
                ctx.strokeStyle = this.colors.ui
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(ball.x, ball.y, this.config.ballRadius + 5, 0, Math.PI * 2)
                ctx.stroke()
            }

            // 编号
            ctx.fillStyle = '#2c3e50'
            ctx.font = 'bold 10px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(ball.number.toString(), ball.x, ball.y)
        })

        // 确认按钮 - 始终显示
        if (this.selectedLeftBallIndex >= 0 && this.selectedRightBallIndex >= 0) {
            const buttonY = this.bounds.height - 100
            
            // 按钮背景
            ctx.fillStyle = `rgba(52, 152, 219, ${this.ui.confirmAlpha})`
            ctx.fillRect(this.bounds.centerX - 100, buttonY, 200, 40)
            
            // 按钮边框
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.strokeRect(this.bounds.centerX - 100, buttonY, 200, 40)
            
            // 按钮文字
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 16px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('开始幸运之旅', this.bounds.centerX, buttonY + 25)
            
            // 按钮提示
            ctx.fillStyle = '#95a5a6'
            ctx.font = '12px Arial'
            ctx.fillText('点击按钮开始游戏', this.bounds.centerX, buttonY + 55)
        }
    }

    /**
     * 渲染游戏画面
     */
    _renderGame(ctx) {
        // 渲染赛道边界 - 扩展到完整赛道高度
        ctx.strokeStyle = this.colors.track
        ctx.lineWidth = 2
        
        // 左赛道边界
        const leftLeft = this.bounds.centerX - this.config.trackGap / 2 - this.config.trackWidth
        const leftRight = this.bounds.centerX - this.config.trackGap / 2
        ctx.beginPath()
        ctx.moveTo(leftLeft, 0)
        ctx.lineTo(leftLeft, this.config.trackHeight)
        ctx.moveTo(leftRight, 0)
        ctx.lineTo(leftRight, this.config.trackHeight)
        ctx.stroke()
        
        // 右赛道边界
        const rightLeft = this.bounds.centerX + this.config.trackGap / 2
        const rightRight = this.bounds.centerX + this.config.trackGap / 2 + this.config.trackWidth
        ctx.beginPath()
        ctx.moveTo(rightLeft, 0)
        ctx.lineTo(rightLeft, this.config.trackHeight)
        ctx.moveTo(rightRight, 0)
        ctx.lineTo(rightRight, this.config.trackHeight)
        ctx.stroke()

        // 渲染中间分隔
        ctx.fillStyle = this.colors.divider
        ctx.fillRect(this.bounds.centerX - this.config.trackGap / 2, 0, this.config.trackGap, this.config.trackHeight)

        // 渲染高度标记
        ctx.fillStyle = this.colors.text
        ctx.font = '12px Arial'
        ctx.textAlign = 'left'
        for (let y = 0; y <= this.config.trackHeight; y += 1000) {
            ctx.fillText(`${y}m`, 10, y)
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(50, y)
            ctx.strokeStyle = this.colors.text
            ctx.stroke()
        }

        // 渲染左赛道因子
        this.leftFactors.forEach(factor => {
            if (factor.collected) return

            ctx.fillStyle = this.config.teamColors[factor.team]
            ctx.beginPath()
            ctx.arc(factor.x, factor.y, this.config.factorRadius, 0, Math.PI * 2)
            ctx.fill()
        })

        // 渲染右赛道因子
        this.rightFactors.forEach(factor => {
            if (factor.collected) return

            ctx.fillStyle = this.config.teamColors[factor.team]
            ctx.beginPath()
            ctx.arc(factor.x, factor.y, this.config.factorRadius, 0, Math.PI * 2)
            ctx.fill()
        })

        // 渲染障碍物
        this.obstacles.forEach(obstacle => {
            ctx.save()
            ctx.translate(obstacle.x, obstacle.y)
            ctx.rotate(obstacle.rotation)
            
            ctx.fillStyle = this.colors.obstacle
            ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height)
            
            ctx.restore()
        })

        // 渲染左赛道球体
        this.leftBalls.forEach(ball => {
            if (ball.finished) return

            // 球体颜色
            const hpRatio = ball.hp / ball.maxHp
            ctx.fillStyle = hpRatio > 0.5 ? this.colors.ball : this.colors.ballLowHp
            ctx.beginPath()
            ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, Math.PI * 2)
            ctx.fill()

            // 主导团队光环
            if (ball.dominantTeam) {
                ctx.strokeStyle = this.config.teamColors[ball.dominantTeam]
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(ball.x, ball.y, this.config.ballRadius + 3, 0, Math.PI * 2)
                ctx.stroke()
            }

            // 玩家球标记
            if (ball.isPlayer) {
                ctx.strokeStyle = this.colors.ui
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(ball.x, ball.y, this.config.ballRadius + 6, 0, Math.PI * 2)
                ctx.stroke()
                
                // 玩家球特殊标记
                ctx.fillStyle = this.colors.ui
                ctx.font = 'bold 10px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('★', ball.x, ball.y - this.config.ballRadius - 10)
            }

            // 编号
            ctx.fillStyle = '#2c3e50'
            ctx.font = 'bold 8px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(ball.number.toString(), ball.x, ball.y)

            // 血量条
            if (ball.hp < ball.maxHp) {
                ctx.fillStyle = '#e74c3c'
                ctx.fillRect(ball.x - 15, ball.y - 20, 30, 3)
                ctx.fillStyle = '#2ecc71'
                ctx.fillRect(ball.x - 15, ball.y - 20, 30 * hpRatio, 3)
            }
        })

        // 渲染右赛道球体
        this.rightBalls.forEach(ball => {
            if (ball.finished) return

            // 球体颜色
            const hpRatio = ball.hp / ball.maxHp
            ctx.fillStyle = hpRatio > 0.5 ? this.colors.ball : this.colors.ballLowHp
            ctx.beginPath()
            ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, Math.PI * 2)
            ctx.fill()

            // 主导团队光环
            if (ball.dominantTeam) {
                ctx.strokeStyle = this.config.teamColors[ball.dominantTeam]
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(ball.x, ball.y, this.config.ballRadius + 3, 0, Math.PI * 2)
                ctx.stroke()
            }

            // 玩家球标记
            if (ball.isPlayer) {
                ctx.strokeStyle = this.colors.ui
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(ball.x, ball.y, this.config.ballRadius + 6, 0, Math.PI * 2)
                ctx.stroke()
            }

            // 编号
            ctx.fillStyle = '#2c3e50'
            ctx.font = 'bold 8px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(ball.number.toString(), ball.x, ball.y)

            // 血量条
            if (ball.hp < ball.maxHp) {
                ctx.fillStyle = '#e74c3c'
                ctx.fillRect(ball.x - 15, ball.y - 20, 30, 3)
                ctx.fillStyle = '#2ecc71'
                ctx.fillRect(ball.x - 15, ball.y - 20, 30 * hpRatio, 3)
            }
        })
    }

    /**
     * 渲染结算画面
     */
    _renderSettlement(ctx) {
        // 渲染赛道和球体（与游戏画面相同）
        this._renderGame(ctx)

        // 添加结算特效
        const progress = this.settlement.settlementTimer / this.settlement.settlementDuration
        
        // 结算光效
        if (progress < 0.5) {
            const alpha = (0.5 - progress) * 2
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.3})`
            ctx.fillRect(0, 0, this.bounds.width, this.bounds.height)
        }

        // 结算文字（固定在屏幕上，不受相机影响）
        ctx.save()
        ctx.restore() // 重置相机变换
        
        ctx.fillStyle = '#f1c40f'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 10
        
        if (progress < 0.5) {
            ctx.fillText('🎯 竞技结束！🎯', this.bounds.centerX, 100)
            ctx.font = '18px Arial'
            ctx.fillStyle = '#ecf0f1'
            ctx.fillText('正在统计最终结果...', this.bounds.centerX, 140)
        } else if (this.settlement.showResults) {
            ctx.fillText('🍀 幸运降临！🍀', this.bounds.centerX, 100)
            ctx.font = '18px Arial'
            ctx.fillStyle = '#ecf0f1'
            ctx.fillText('幸运号码生成完成！', this.bounds.centerX, 140)
            
            // 显示生成的幸运号码（预览）
            if (this.allLuckyNumbers.length > 0) {
                ctx.font = 'bold 20px Arial'
                ctx.fillStyle = '#2ecc71'
                const numbersStr = this.allLuckyNumbers.map(n => n.toString().padStart(2, '0')).join(' · ')
                ctx.fillText(numbersStr, this.bounds.centerX, 180)
            }
        }
        
        ctx.shadowBlur = 0
    }

    /**
     * 渲染结果
     */
    _renderResult(ctx) {
        // 背景效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(0, 0, this.bounds.width, this.bounds.height)

        // 结果面板
        const panelY = 100
        ctx.fillStyle = '#2c3e50'
        ctx.fillRect(this.bounds.centerX - 200, panelY, 400, 400)

        // 标题
        ctx.fillStyle = '#f1c40f'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('🍀 您的幸运降临！ 🍀', this.bounds.centerX, panelY + 40)

        // 玩家信息
        ctx.fillStyle = '#ecf0f1'
        ctx.font = '16px Arial'
        const leftTeamName = this.leftPlayerBall ? this._getTeamName(this.leftPlayerBall.dominantTeam) : '未知'
        const rightTeamName = this.rightPlayerBall ? this._getTeamName(this.rightPlayerBall.dominantTeam) : '未知'
        ctx.fillText(`左赛道支持：${leftTeamName}`, this.bounds.centerX, panelY + 70)
        ctx.fillText(`右赛道支持：${rightTeamName}`, this.bounds.centerX, panelY + 90)
        
        if (this.leftPlayerBall && this.rightPlayerBall) {
            ctx.fillText(`您的引导球 左[${this.leftPlayerBall.number}] 右[${this.rightPlayerBall.number}]`, this.bounds.centerX, panelY + 110)
        }

        // 幸运号码
        ctx.fillStyle = '#f1c40f'
        ctx.font = 'bold 18px Arial'
        ctx.fillText('为您生成的幸运七码是：', this.bounds.centerX, panelY + 150)

        const numbersStr = this.allLuckyNumbers.map(n => n.toString().padStart(2, '0')).join(' · ')
        ctx.fillStyle = '#2ecc71'
        ctx.font = 'bold 24px Arial'
        ctx.fillText(numbersStr, this.bounds.centerX, panelY + 190)

        // 生成依据
        ctx.fillStyle = '#95a5a6'
        ctx.font = '14px Arial'
        ctx.fillText('生成依据：', this.bounds.centerX, panelY + 230)
        ctx.fillText(`• 左赛道(1-35)最强5个战球的编号`, this.bounds.centerX, panelY + 255)
        ctx.fillText(`• 右赛道(1-12)最强2个战球的编号`, this.bounds.centerX, panelY + 280)
        if (this.leftPlayerBall && this.rightPlayerBall) {
            ctx.fillText(`• 包含您的引导球 左[${this.leftPlayerBall.number}] 右[${this.rightPlayerBall.number}]`, this.bounds.centerX, panelY + 305)
        }

        // 重新开始按钮
        ctx.fillStyle = this.colors.ui
        ctx.fillRect(this.bounds.centerX - 80, panelY + 330, 160, 40)
        ctx.fillStyle = '#fff'
        ctx.font = '16px Arial'
        ctx.fillText('再次挑战', this.bounds.centerX, panelY + 355)
    }

    /**
     * 渲染UI
     */
    _renderUI(ctx) {
        // 消息
        if (this.ui.messageAlpha > 0) {
            ctx.fillStyle = `rgba(236, 240, 241, ${this.ui.messageAlpha})`
            ctx.font = '18px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(this.ui.message, this.bounds.centerX, 50)
        }

        // 相机指示器（仅在游戏中显示）
        if (this.gameState === 'PLAYING' && this.leftPlayerBall) {
            // 高度指示器
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(this.bounds.width - 120, 10, 110, 80)
            
            ctx.fillStyle = '#ecf0f1'
            ctx.font = '12px Arial'
            ctx.textAlign = 'right'
            ctx.fillText(`高度: ${Math.round(this.leftPlayerBall.y)}m`, this.bounds.width - 15, 30)
            ctx.fillText(`进度: ${Math.round((this.leftPlayerBall.y / this.config.trackHeight) * 100)}%`, this.bounds.width - 15, 50)
            ctx.fillText(`相机: ${Math.round(this.camera.y)}`, this.bounds.width - 15, 70)
            
            // 进度条
            ctx.fillStyle = '#34495e'
            ctx.fillRect(this.bounds.width - 115, 75, 100, 5)
            ctx.fillStyle = '#2ecc71'
            ctx.fillRect(this.bounds.width - 115, 75, 100 * (this.leftPlayerBall.y / this.config.trackHeight), 5)
        }

        // 技能冷却
        if (this.gameState === 'PLAYING' && this.skillCooldown > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(10, this.bounds.height - 60, 150, 50)
            
            ctx.fillStyle = '#ecf0f1'
            ctx.font = '14px Arial'
            ctx.textAlign = 'left'
            ctx.fillText(`技能冷却: ${Math.ceil(this.skillCooldown / 1000)}s`, 20, this.bounds.height - 35)
            
            // 冷却条
            ctx.fillStyle = '#34495e'
            ctx.fillRect(20, this.bounds.height - 25, 130, 5)
            ctx.fillStyle = '#3498db'
            ctx.fillRect(20, this.bounds.height - 25, 130 * (1 - this.skillCooldown / this.config.skillCooldown), 5)
        }

        // 团队统计
        if (this.gameState === 'PLAYING') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(10, 10, 150, 120)
            
            ctx.fillStyle = '#ecf0f1'
            ctx.font = '14px Arial'
            ctx.textAlign = 'left'
            ctx.fillText('团队统计:', 20, 30)
            
            let yOffset = 50
            Object.entries(this.teamStats).forEach(([team, count]) => {
                ctx.fillStyle = this.config.teamColors[team]
                ctx.fillText(`${this._getTeamName(team)}: ${count}`, 20, yOffset)
                yOffset += 20
            })
        }
    }

    /**
     * 获取团队名称
     */
    _getTeamName(team) {
        const names = {
            red: '火焰红队',
            blue: '寒冰蓝队',
            green: '自然绿队',
            yellow: '光明黄队',
            purple: '暗影紫队'
        }
        return names[team] || '未知队伍'
    }

    /**
     * 获取团队图标
     */
    _getTeamIcon(team) {
        const icons = {
            red: '🔴',
            blue: '🔵',
            green: '🟢',
            yellow: '🟡',
            purple: '🟣'
        }
        return icons[team] || '⚪'
    }

    /**
     * 显示消息
     */
    _showMessage(message) {
        this.ui.message = message
        this.ui.messageAlpha = 1
    }

    /**
     * 处理触摸事件
     */
    onTouch(x, y) {
        if (this.gameState === 'SELECTING') {
            this._handleSelection(x, y)
        } else if (this.gameState === 'PLAYING') {
            this._handleGameTouch(x, y)
        } else if (this.gameState === 'RESULT') {
            this._handleResultTouch(x, y)
        }
    }

    /**
     * 处理选择阶段的触摸
     */
    _handleSelection(x, y) {
        // 增加触摸区域容错
        const touchRadius = this.config.ballRadius + 10 // 增加触摸区域
        
        // 检查左赛道球体点击
        this.leftBalls.forEach((ball, index) => {
            const dx = x - ball.x
            const dy = y - ball.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < touchRadius) {
                this.selectedLeftBallIndex = index
                this.ui.confirmAlpha = 1
                this._showMessage(`已选择左[${ball.number}]号球`)
            }
        })

        // 检查右赛道球体点击
        this.rightBalls.forEach((ball, index) => {
            const dx = x - ball.x
            const dy = y - ball.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < touchRadius) {
                this.selectedRightBallIndex = index
                this.ui.confirmAlpha = 1
                this._showMessage(`已选择右[${ball.number}]号球`)
            }
        })

        // 检查确认按钮 - 增加按钮区域
        if (this.selectedLeftBallIndex >= 0 && this.selectedRightBallIndex >= 0) {
            const buttonY = this.bounds.height - 100
            const buttonLeft = this.bounds.centerX - 100
            const buttonRight = this.bounds.centerX + 100
            const buttonTop = buttonY
            const buttonBottom = buttonY + 40
            
            // 增加按钮触摸区域
            const expandedButtonLeft = buttonLeft - 10
            const expandedButtonRight = buttonRight + 10
            const expandedButtonTop = buttonTop - 10
            const expandedButtonBottom = buttonBottom + 10
            
            if (x > expandedButtonLeft && x < expandedButtonRight &&
                y > expandedButtonTop && y < expandedButtonBottom) {
                this._startGame()
            }
        }
    }

    /**
     * 处理游戏中的触摸
     */
    _handleGameTouch(x, y) {
        if (this.skillCooldown > 0 || !this.leftPlayerBall) return

        const isLeftSide = x < this.bounds.centerX
        const force = isLeftSide ? -this.config.skillForce : this.config.skillForce

        this.leftPlayerBall.vx += force
        this.skillCooldown = this.config.skillCooldown
        this.lastSkillTime = Date.now()
    }

    /**
     * 处理结果界面的触摸
     */
    _handleResultTouch(x, y) {
        const panelY = 100
        if (x > this.bounds.centerX - 80 && x < this.bounds.centerX + 80 &&
            y > panelY + 330 && y < panelY + 370) {
            this.restart()
        }
    }

    /**
     * 开始游戏
     */
    _startGame() {
        if (this.selectedLeftBallIndex < 0 || this.selectedRightBallIndex < 0) return

        // 设置左赛道玩家球
        this.leftPlayerBall = this.leftBalls[this.selectedLeftBallIndex]
        this.leftPlayerBall.isPlayer = true

        // 设置右赛道玩家球
        this.rightPlayerBall = this.rightBalls[this.selectedRightBallIndex]
        this.rightPlayerBall.isPlayer = true

        this.gameState = 'PLAYING'
        this._showMessage(`您选择了左[${this.leftPlayerBall.number}]号和右[${this.rightPlayerBall.number}]号球`)
    }

    /**
     * 重新开始
     */
    restart() {
        this.gameState = 'SELECTING'
        this.leftBalls = []
        this.rightBalls = []
        this.leftPlayerBall = null
        this.rightPlayerBall = null
        this.selectedLeftBallIndex = -1
        this.selectedRightBallIndex = -1
        this.leftFactors = []
        this.rightFactors = []
        this.obstacles = []
        this.skillCooldown = 0
        this.leftLuckyNumbers = []
        this.rightLuckyNumbers = []
        this.allLuckyNumbers = []
        this.playerTeam = null

        // 重置相机
        this.camera.y = 0
        this.camera.targetY = 0

        // 重置结算系统
        this.settlement.isSettling = false
        this.settlement.settlementTimer = 0
        this.settlement.cameraToBottom = false
        this.settlement.showResults = false
        this.settlement.resultTimer = 0

        this._initializeBalls()
        this._initializeTrack()
        
        // 重新随机选择默认球
        this._randomSelectBalls()
        
        this._showMessage('点击"开始幸运之旅"开始游戏')
    }

    /**
     * 销毁游戏
     */
    destroy() {
        this.leftBalls = []
        this.rightBalls = []
        this.leftFactors = []
        this.rightFactors = []
        this.obstacles = []
        this.leftPlayerBall = null
        this.rightPlayerBall = null
    }
}
