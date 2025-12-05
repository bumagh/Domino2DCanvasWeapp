/**
 * 新手引导类
 */
export default class Guide {
    constructor() {
        this.steps = [
            {
                id: 1,
                title: '欢迎来到多米诺游戏',
                content: '这是一个滚珠游戏，选择滚珠助力\n，赢取积分奖励',
                target: null,
                position: 'center',
                arrow: null,
                nextText: '开始学习'
            },
            {
                id: 2,
                title: '选择滚珠',
                content: '点击任意一个滚珠进行选择，\n被选中的滚珠会有白色边框',
                target: 'balls',
                position: 'center',
                arrow: 'down',
                nextText: '下一步'
            },
            {
                id: 3,
                title: '打开游戏菜单',
                content: '点击右上角的菜单按钮打开游戏菜单',
                target: 'menuButton',
                position: 'center',
                arrow: 'right',
                nextText: '下一步'
            },
            {
                id: 4,
                title: '开始游戏',
                content: '点击"开始游戏"按钮，\n开始预览赛道并选择助力积分',
                target: 'startButton',
                position: 'center',
                arrow: 'right',
                nextText: '下一步'
            },
            {
                id: 5,
                title: '选择助力积分',
                content: '选择你想要投入的积分，\n积分越高奖励越大',
                target: 'betModal',
                position: 'center',
                arrow: 'down',
                nextText: '明白了'
            },
            {
                id: 6,
                title: '游戏规则',
                content: '滚珠到达终点后根据排名获得奖励：\n第1名：4倍积分\n第2名：2倍积分\n其他：失去积分',
                target: null,
                position: 'center',
                arrow: null,
                nextText: '开始游戏'
            }
        ]

        this.currentStep = 0
        this.isActive = true
        this.showingModal = false

        // 引导遮罩层参数
        this.highlightPadding = 10
        this.cutoutRadius = 8
    }

    /**
     * 开始引导
     */
    start () {
        this.currentStep = 0
        this.isActive = true
        console.log('开始新手引导')
    }

    /**
     * 下一步
     */
    next () {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++
            console.log('引导步骤:', this.currentStep + 1)
            return true
        } else {
            this.complete()
            return false
        }
    }

    /**
     * 上一步
     */
    prev () {
        if (this.currentStep > 0) {
            this.currentStep--
            return true
        }
        return false
    }

    /**
     * 完成引导
     */
    complete () {
        this.isActive = false
        console.log('新手引导完成')

        // 保存引导完成状态到本地存储
        try {
            wx.setStorageSync('guide_completed', true)
        } catch (e) {
            console.error('保存引导状态失败:', e)
        }
    }

    /**
     * 检查是否已完成引导
     */
    hasCompleted () {
        try {
            return wx.getStorageSync('guide_completed') || false
        } catch (e) {
            return false
        }
    }

    /**
     * 获取当前步骤
     */
    getCurrentStep () {
        return this.steps[this.currentStep]
    }

    /**
     * 检查玩家操作是否匹配当前引导步骤
     */
    checkAction (action, target) {
        if (!this.isActive) return false

        const step = this.getCurrentStep()

        switch (step.id) {
            case 1: // 欢迎界面，点击任意位置继续
                return action === 'click'

            case 2: // 选择滚珠
                return action === 'ball_selected' && target === 'ball'

            case 3: // 点击菜单按钮
                return action === 'menu_clicked'

            case 4: // 点击开始游戏
                return action === 'start_clicked'

            case 5: // 显示助力选择
                return action === 'bet_modal_shown'

            default:
                return false
        }
    }

    /**
     * 渲染引导界面
     */
    render (ctx, gameState, uiElements, selectedBall, canvasWidth, canvasHeight) {
        if (!this.isActive) return

        const step = this.getCurrentStep()

        // 绘制半透明遮罩层
        this.drawMask(ctx, canvasWidth, canvasHeight, step, uiElements, selectedBall)

        // 绘制引导提示框
        this.drawGuideBox(ctx, step, canvasWidth, canvasHeight, uiElements, selectedBall)

        // 绘制高亮区域
        this.drawHighlight(ctx, step, uiElements, selectedBall, canvasWidth, canvasHeight)
    }

    /**
     * 绘制遮罩层
     */
    drawMask (ctx, canvasWidth, canvasHeight, step, uiElements, selectedBall) {
        ctx.save()

        // 整个画布半透明黑色遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        // 根据步骤创建高亮区域（挖空效果）
        ctx.globalCompositeOperation = 'destination-out'

        if (step.target === 'balls' && selectedBall) {
            // 高亮选中的滚珠
            const ball = selectedBall
            ctx.beginPath()
            ctx.arc(ball.x, ball.y - (uiElements?.cameraOffsetY || 0), ball.radius + this.highlightPadding, 0, Math.PI * 2)
            ctx.fill()
        } else if (step.target === 'menuButton' && uiElements?.menuButton) {
            // 高亮菜单按钮
            const btn = uiElements.menuButton
            this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, this.cutoutRadius)
            ctx.fill()
        } else if (step.target === 'startButton' && uiElements?.menuModal?.visible && uiElements.menuModal?.buttons?.start) {
            // 高亮开始按钮
            const btn = uiElements.menuModal.buttons.start
            this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, this.cutoutRadius)
            ctx.fill()
        } else if (step.target === 'betModal' && uiElements?.betModal?.visible) {
            // 高亮助力弹窗
            const modalWidth = 320
            const modalHeight = 280
            const x = (canvasWidth - modalWidth) / 2
            const y = (canvasHeight - modalHeight) / 2
            this.drawRoundedRect(ctx, x, y, modalWidth, modalHeight, 16)
            ctx.fill()
        }

        ctx.restore()
    }

    /**
     * 绘制圆角矩形
     */
    drawRoundedRect (ctx, x, y, width, height, radius) {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.arcTo(x + width, y, x + width, y + radius, radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
        ctx.lineTo(x + radius, y + height)
        ctx.arcTo(x, y + height, x, y + height - radius, radius)
        ctx.lineTo(x, y + radius)
        ctx.arcTo(x, y, x + radius, y, radius)
        ctx.closePath()
    }

    /**
     * 绘制高亮边框
     */
    drawHighlight (ctx, step, uiElements, selectedBall, canvasWidth, canvasHeight) {
        if (!step.target) return

        ctx.save()
        ctx.strokeStyle = '#ffcc00'
        ctx.lineWidth = 3
        ctx.shadowColor = '#ffcc00'
        ctx.shadowBlur = 15

        if (step.target === 'balls' && selectedBall) {
            // 高亮选中的滚珠
            const ball = selectedBall
            ctx.beginPath()
            ctx.arc(ball.x, ball.y - (uiElements?.cameraOffsetY || 0), ball.radius + this.highlightPadding, 0, Math.PI * 2)
            ctx.stroke()

            // 绘制指向箭头
            if (step.arrow === 'down') {
                this.drawArrow(ctx, ball.x, ball.y - (uiElements?.cameraOffsetY || 0) - ball.radius - 30, 'down')
            }
        } else if (step.target === 'menuButton' && uiElements?.menuButton) {
            // 高亮菜单按钮
            const btn = uiElements.menuButton
            this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, this.cutoutRadius)
            ctx.stroke()

            // 绘制指向箭头
            if (step.arrow === 'right') {
                this.drawArrow(ctx, btn.x + btn.width + 20, btn.y + btn.height / 2, 'right')
            }
        } else if (step.target === 'startButton' && uiElements?.menuModal?.visible && uiElements.menuModal?.buttons?.start) {
            // 高亮开始按钮
            const btn = uiElements.menuModal.buttons.start
            this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, this.cutoutRadius)
            ctx.stroke()
        } else if (step.target === 'betModal' && uiElements?.betModal?.visible) {
            // 高亮助力弹窗
            const modalWidth = 320
            const modalHeight = 280
            const x = (canvasWidth - modalWidth) / 2
            const y = (canvasHeight - modalHeight) / 2
            this.drawRoundedRect(ctx, x, y, modalWidth, modalHeight, 16)
            ctx.stroke()
        }

        ctx.restore()
    }

    /**
     * 绘制箭头
     */
    drawArrow (ctx, x, y, direction) {
        ctx.save()
        ctx.fillStyle = '#ffcc00'

        ctx.beginPath()

        switch (direction) {
            case 'up':
                ctx.moveTo(x, y)
                ctx.lineTo(x - 10, y + 20)
                ctx.lineTo(x + 10, y + 20)
                break
            case 'down':
                ctx.moveTo(x, y)
                ctx.lineTo(x - 10, y - 20)
                ctx.lineTo(x + 10, y - 20)
                break
            case 'left':
                ctx.moveTo(x, y)
                ctx.lineTo(x + 20, y - 10)
                ctx.lineTo(x + 20, y + 10)
                break
            case 'right':
                ctx.moveTo(x, y)
                ctx.lineTo(x - 20, y - 10)
                ctx.lineTo(x - 20, y + 10)
                break
        }

        ctx.closePath()
        ctx.fill()
        ctx.restore()
    }

    /**
     * 绘制引导提示框
     */
    drawGuideBox (ctx, step, canvasWidth, canvasHeight, uiElements, selectedBall) {
        // 根据步骤位置确定提示框位置
        let boxX, boxY
        const boxWidth = 300
        const boxHeight = 280

        switch (step.position) {
            case 'top':
                boxX = canvasWidth / 2 - boxWidth / 2
                boxY = 80
                break
            case 'center':
                boxX = canvasWidth / 2 - boxWidth / 2
                boxY = canvasHeight / 2 - boxHeight / 2
                break
            case 'left':
                boxX = 50
                boxY = canvasHeight / 2 - boxHeight / 2
                break
            case 'right':
                boxX = canvasWidth - boxWidth - 50
                boxY = canvasHeight / 2 - boxHeight / 2
                break
            default:
                boxX = canvasWidth / 2 - boxWidth / 2
                boxY = canvasHeight - boxHeight - 50
        }

        // 绘制提示框背景
        ctx.save()

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.strokeStyle = '#ffcc00'
        ctx.lineWidth = 2

        this.drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10)
        ctx.fill()
        ctx.stroke()

        // 标题
        ctx.fillStyle = '#ffcc00'
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(step.title, boxX + boxWidth / 2, boxY + 40)

        // 内容
        ctx.fillStyle = '#ffffff'
        ctx.font = '16px Arial'
        ctx.textAlign = 'left'

        // 处理换行
        const lines = step.content.split('\n')
        lines.forEach((line, index) => {
            ctx.fillText(line, boxX + 20, boxY + 75 + index * 25)
        })

        // 下一步按钮
        const buttonWidth = 120
        const buttonHeight = 40
        const buttonX = boxX + boxWidth / 2 - buttonWidth / 2
        const buttonY = boxY + boxHeight - 105

        // 按钮背景
        ctx.fillStyle = '#ffcc00'
        this.drawRoundedRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 5)
        ctx.fill()

        // 按钮文字
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(step.nextText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5)

        // 步骤指示器
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${step.id}/${this.steps.length}`, boxX + boxWidth / 2, boxY + boxHeight - 30)

        ctx.restore()

        // 保存按钮位置用于点击检测
        this.guideButton = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        }
    }

    /**
     * 检查是否点击了引导按钮
     */
    isPointInGuideButton (x, y) {
        console.log(x, y)
        if (!this.guideButton) return false
        return x >= this.guideButton.x && x <= this.guideButton.x + this.guideButton.width &&
            y >= this.guideButton.y && y <= this.guideButton.y + this.guideButton.height
    }
}