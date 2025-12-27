import SubGameBase from './subgame_base.js'

/**
 * AwesomeCat 子游戏（微信小游戏/Canvas 版本）
 * 玩法：玩家选择左/右（萝卜/纸巾），猫随机走左/右并推倒多米诺，
 * 若玩家选择与猫到达的终点道具一致则显示“真棒”按钮。
 */
export default class AwesomeCatGame extends SubGameBase {
    get id () {
        return 'awesomeCat'
    }

    get name () {
        return 'Awesome Cat'
    }

    init () {
        super.init()

        this.colors = {
            bg: '#2d3436',
            path: '#636e72',
            catMain: '#dfe6e9',
            catDark: '#b2bec3',
            domino: '#ffffff',
            radish: '#ff7675',
            tissue: '#74b9ff',
            gold: '#ffeaa7',
            awesome: '#55efc4'
        }

        this.bounds = { width: 0, height: 0, centerX: 0, centerY: 0 }
        this.gameState = 'IDLE' // IDLE | ACTION | CELEBRATE | FLASHBACK | ENDED

        this.cat = {
            x: 0,
            y: 0,
            baseY: 0,
            scale: 1,
            rotation: 0,
            tailAngle: 0,
            earAngle: 0,
            direction: 0,
            state: 'idle',
            bubbleText: '',
            bubbleAlpha: 0,
            item: null
        }

        this.paths = { left: [], right: [] }
        this.particles = []

        // 动画/时间
        this.time = 0
        this.action = null
        this.flashback = null

        // 音效（微信小游戏）
        this.sfx = {
            carrot: wx.createInnerAudioContext(),
            tissue: wx.createInnerAudioContext(),
            awesome: wx.createInnerAudioContext(),
            domino: wx.createInnerAudioContext()
        }
        this.sfx.carrot.src = 'audio/carrot.mp3'
        this.sfx.tissue.src = 'audio/tissue.mp3'
        this.sfx.awesome.src = 'audio/awesome.mp3'

        // 推倒音效：项目内未提供 domino.mp3，则回退复用 awesome.mp3
        this.sfx.domino.src = 'audio/domino.mp3'

        this.lastDominoSoundIndex = -1

        this.resize()
        this.resetGameObjects()
        this.buildUI()
    }

    destroy () {
        // 无 DOM 监听需要解绑（事件由 EventManager 转发）
        try {
            this.sfx?.carrot?.destroy?.()
            this.sfx?.tissue?.destroy?.()
            this.sfx?.awesome?.destroy?.()
            this.sfx?.domino?.destroy?.()
        } catch (e) { }
    }

    playSfx (name) {
        // fallback：domino 没有资源时复用 awesome
        if (name === 'domino' && (!this.sfx?.domino?.src || this.sfx.domino.src.endsWith('audio/domino.mp3'))) {
            // 不阻断，照常尝试播放；如果失败由 catch 吃掉
        }
        const a = this.sfx?.[name]
        if (!a) return
        try {
            a.stop?.()
            a.seek?.(0)
            a.play?.()
        } catch (e) {
            try { a.play?.() } catch (e2) { }
        }
    }

    resize () {
        const { canvas } = this.ctx
        this.bounds.width = canvas.width
        this.bounds.height = canvas.height
        this.bounds.centerX = canvas.width / 2
        this.bounds.centerY = canvas.height / 2
    }

    buildUI () {
        const { canvas } = this.ctx
        const btnW = 150
        const btnH = 52

        // 安全边距，避免按钮跑出屏幕（尤其小屏/全面屏）
        const safeBottom = 80
        const y = Math.max(80, canvas.height - btnH - safeBottom)

        this.ui = {
            leftBtn: { x: canvas.width / 2 - btnW - 20, y, width: btnW, height: btnH, label: '选择左侧' },
            rightBtn: { x: canvas.width / 2 + 20, y, width: btnW, height: btnH, label: '选择右侧' },
            feedbackBtn: { x: canvas.width / 2 - 80, y: y - 70, width: 160, height: 46, label: '真棒！', visible: false },
            backBtn: { x: 20, y: 90, width: 90, height: 40, label: '返回' }
        }
    }

    resetGameObjects () {
        this.cat.x = this.bounds.centerX
        this.cat.baseY = this.bounds.centerY - 50
        this.cat.y = this.cat.baseY
        this.cat.direction = 0
        this.cat.state = 'idle'
        this.cat.bubbleText = 'Hm...?'
        this.cat.bubbleAlpha = 1
        this.cat.item = null
        this.cat.scale = 1

        const pathY = this.cat.y + 60
        const pathLength = Math.min(this.bounds.width * 0.4, 200)
        this.paths.left = this.createDominos(-1, pathLength, pathY)
        this.paths.right = this.createDominos(1, pathLength, pathY)

        // 随机左右终点为 萝卜/纸巾
        if (Math.random() < 0.5) {
            const leftLast = this.paths.left[this.paths.left.length - 1]
            const rightLast = this.paths.right[this.paths.right.length - 1]
            leftLast.color = this.colors.tissue
            rightLast.color = this.colors.radish
        } else {
            const leftLast = this.paths.left[this.paths.left.length - 1]
            const rightLast = this.paths.right[this.paths.right.length - 1]
            leftLast.color = this.colors.radish
            rightLast.color = this.colors.tissue
        }

        this.particles.length = 0
        this.action = null
        this.flashback = null
        this.gameState = 'IDLE'

        if (this.ui?.feedbackBtn) this.ui.feedbackBtn.visible = false
    }

    createDominos (dir, length, startY) {
        const dominos = []
        const count = 8
        const spacing = length / count

        for (let i = 0; i < count; i++) {
            dominos.push({
                x: this.bounds.centerX + dir * 60 + dir * i * spacing,
                y: startY + i * 10,
                width: 12,
                height: 32,
                rotation: 0,
                color: dir === -1 ? this.colors.radish : this.colors.tissue,
                active: true
            })
        }

        return dominos
    }

    update (dt) {
        this.time += dt / 1000

        // 仅在尺寸变化时重建 UI，避免每帧抖动/闪烁导致“看起来没按钮”
        const { canvas } = this.ctx
        if (this._lastW !== canvas.width || this._lastH !== canvas.height) {
            this._lastW = canvas.width
            this._lastH = canvas.height
            this.resize()
            this.buildUI()
        }

        // 尾巴/耳朵摆动：无条件持续（不要依赖 state）
        this.cat.tailAngle = Math.sin(this.time * 2.4) * 0.28 + Math.sin(this.time * 6.5) * 0.04
        this.cat.earAngle = Math.sin(this.time * 3.2) * 0.14

        // 呼吸缩放只在 idle 时叠加，且不要覆盖到 action 里的拉伸
        if (this.cat.state === 'idle') {
            this.cat.scale = 1 + Math.sin(this.time * 1.6) * 0.015
        } else {
            this.cat.scale = 1
        }

        // 动作流程
        if (this.action) this.updateAction(dt)
        if (this.flashback) this.updateFlashback(dt)

        // 粒子更新
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]
            p.x += p.vx
            p.y += p.vy
            p.vy += 0.2
            p.rotation += p.vRot
            p.life -= 0.02
            if (p.life <= 0) this.particles.splice(i, 1)
        }

        // 对话气泡淡出
        if (this.cat.bubbleAlpha > 0 && this.gameState !== 'IDLE') {
            this.cat.bubbleAlpha = Math.max(0, this.cat.bubbleAlpha - 0.02)
        }
    }

    updateAction (dt) {
        const a = this.action
        a.t += dt

        // 阶段：移动 -> push -> domino -> celebrate -> flashback
        if (a.phase === 'move') {
            const p = Math.min(1, a.t / 520)
            const eased = this.easeOutBack(p)
            this.cat.x = a.fromX + (a.toX - a.fromX) * eased
            this.cat.direction = a.dir
            this.cat.state = 'idle'
            this.cat.y = this.cat.baseY + Math.sin(p * Math.PI * 4) * 3
            if (p >= 1) {
                this.cat.y = this.cat.baseY
                a.phase = 'push'
                a.t = 0
            }
            return
        }

        if (a.phase === 'push') {
            this.cat.state = 'push'
            this.cat.tailAngle = Math.sin(this.time * 10) * 0.35
            if (a.t >= 260) {
                this.cat.state = 'idle'
                a.phase = 'domino'
                a.t = 0
            }
            return
        }

        if (a.phase === 'domino') {
            const per = 130
            const idx = Math.floor(a.t / per)

            // 推倒音效：每推进到一块新 domino 时播放一次
            if (idx !== this.lastDominoSoundIndex && idx >= 0 && idx < a.targetPaths.length) {
                this.lastDominoSoundIndex = idx
                this.playSfx('domino')
            }

            for (let i = 0; i < a.targetPaths.length; i++) {
                const d = a.targetPaths[i]
                const localT = a.t - i * per
                if (localT <= 0) continue

                const pp = Math.min(1, localT / 220)
                const rot = (a.dir * Math.PI) / 2.5
                const over = rot * (1 + 0.18 * Math.sin(pp * Math.PI))
                d.rotation = over * this.easeOutBounce(pp)
            }

            if (idx >= a.targetPaths.length - 1) {
                const last = a.targetPaths[a.targetPaths.length - 1]
                this.spawnParticles(last.x, last.y)
                this.spawnParticles(last.x, last.y - 50)

                this.gameState = 'CELEBRATE'
                this.cat.item = '🐟'

                const isCorrect = a.playerTargetItem === a.catEndItem
                if (this.ui?.feedbackBtn) this.ui.feedbackBtn.visible = isCorrect

                a.phase = 'celebrate'
                a.t = 0
            }
            return
        }

        if (a.phase === 'celebrate') {
            const total = 2200
            const p = Math.min(1, a.t / total)
            const jump = this.easeOutBounce((a.t % 420) / 420)
            this.cat.y = this.cat.baseY - jump * 26
            this.cat.state = 'jump'

            if (p >= 1) {
                this.cat.y = this.cat.baseY
                this.cat.state = 'idle'
                this.action = null
                this.startFlashback(a.dir)
            }
            return
        }
    }

    startFlashback (targetDir) {
        this.gameState = 'FLASHBACK'

        // 重置但保留这次的终点随机状态：这里直接重新 reset 会改终点；
        // 参考原代码 flashback 会 reset，所以这里也 reset，保持一致。
        this.resetGameObjects()

        const targetPaths = targetDir === -1 ? this.paths.left : this.paths.right

        this.flashback = {
            dir: targetDir,
            targetPaths,
            t: 0,
            phase: 'move'
        }

        this.cat.bubbleText = '如果我选择...'
        this.cat.bubbleAlpha = 1
    }

    updateFlashback (dt) {
        const f = this.flashback
        f.t += dt

        if (f.phase === 'move') {
            const fromX = this.bounds.centerX
            const toX = this.bounds.centerX + f.dir * 40
            const p = Math.min(1, f.t / 500)
            this.cat.x = fromX + (toX - fromX) * this.easeOut(p)
            if (p >= 1) {
                f.phase = 'push'
                f.t = 0
            }
            return
        }

        if (f.phase === 'push') {
            this.cat.state = 'push'
            if (f.t >= 250) {
                f.phase = 'fail'
                f.t = 0
            }
            return
        }

        if (f.phase === 'fail') {
            // 推第一块并失败
            const d0 = f.targetPaths[0]
            if (d0.rotation === 0) d0.rotation = (f.dir * Math.PI) / 2.5

            this.cat.state = 'shock'
            this.cat.bubbleText = '???'
            this.cat.bubbleAlpha = 1
            this.spawnParticles(d0.x, d0.y, '#ff0000')

            f.phase = 'shake'
            f.t = 0
            return
        }

        if (f.phase === 'shake') {
            // 用 render 时的屏幕抖动替代 DOM canvas.x
            if (f.t >= 1200) {
                this.flashback = null
                this.gameState = 'ENDED'
                this.cat.state = 'idle'
            }
        }
    }

    triggerAction (choice) {
        if (this.gameState !== 'IDLE') return

        this.gameState = 'ACTION'

        const playerTargetItem = choice === 'left' ? 'radish' : 'tissue'

        // 按你提供的“logic”版本：猫随机选择左右
        const targetDir = Math.random() < 0.5 ? -1 : 1
        const targetPaths = targetDir === 1 ? this.paths.right : this.paths.left

        // 猫最终到达的终点道具（左=萝卜，右=纸巾；此处按方向语义，与原稿一致）
        const catEndItem = targetDir === -1 ? 'radish' : 'tissue'

        this.cat.bubbleAlpha = 0

        this.action = {
            t: 0,
            phase: 'move',
            dir: targetDir,
            fromX: this.cat.x,
            toX: this.bounds.centerX + targetDir * 40,
            targetPaths,
            playerTargetItem,
            catEndItem
        }
    }

    triggerFeedback () {
        // 参考原版：ACTION/FLASHBACK 不允许
        if (this.gameState === 'ACTION' || this.gameState === 'FLASHBACK') return

        this.cat.bubbleText = '喵! ❤️'
        this.cat.bubbleAlpha = 1

        this.spawnParticles(this.cat.x, this.cat.y - 40, this.colors.awesome)

        // 简单跳跃一下
        this.cat.state = 'jump'
        const startY = this.cat.baseY
        this.cat.y = startY - 60
        setTimeout(() => {
            // 防止已退出子游戏
            if (!this.ctx?.main?.subGame) return
            this.cat.y = startY
            if (this.gameState !== 'ENDED') this.cat.state = 'idle'
            setTimeout(() => {
                if (!this.ctx?.main?.subGame) return
                this.cat.bubbleAlpha = 0
            }, 1400)
        }, 300)
    }

    spawnParticles (x, y, color) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                vRot: (Math.random() - 0.5) * 0.5,
                rotation: 0,
                life: 1,
                color: color ?? `hsl(${Math.random() * 360}, 80%, 60%)`
            })
        }
    }

    // 更“弹”的缓动
    easeOut (p) {
        return 1 - Math.pow(1 - p, 3)
    }

    easeOutBack (p) {
        const c1 = 1.70158
        const c3 = c1 + 1
        return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
    }

    easeOutBounce (x) {
        const n1 = 7.5625
        const d1 = 2.75
        if (x < 1 / d1) {
            return n1 * x * x
        } else if (x < 2 / d1) {
            x -= 1.5 / d1
            return n1 * x * x + 0.75
        } else if (x < 2.5 / d1) {
            x -= 2.25 / d1
            return n1 * x * x + 0.9375
        }
        x -= 2.625 / d1
        return n1 * x * x + 0.984375
    }

    render () {
        const { main, canvas } = this.ctx
        const ctx2d = main.ctx

        // FLASHBACK shake
        let shakeX = 0
        if (this.flashback && this.flashback.phase === 'shake') {
            shakeX = (Math.random() - 0.5) * 10
        }

        ctx2d.save()
        ctx2d.translate(shakeX, 0)

        // 背景
        ctx2d.fillStyle = this.colors.bg
        ctx2d.fillRect(0, 0, canvas.width, canvas.height)

        this.drawGrid(ctx2d)

        // 终点图标（用 emoji 文本，兼容微信 canvas）
        this.drawTarget(ctx2d, this.paths.left[this.paths.left.length - 1], '🥕', '萝卜')
        this.drawTarget(ctx2d, this.paths.right[this.paths.right.length - 1], '🧻', '纸巾')

        this.drawDominos(ctx2d, this.paths.left)
        this.drawDominos(ctx2d, this.paths.right)

        this.drawPixelCat(ctx2d)
        this.drawParticles(ctx2d)

        if (this.cat.bubbleAlpha > 0) this.drawBubble(ctx2d)

        // UI
        this.drawTopBar(ctx2d)
        this.drawControls(ctx2d)

        // debug：如果你仍看不到按钮，可以临时打开这个矩形
        // ctx2d.save(); ctx2d.strokeStyle='red'; ctx2d.strokeRect(this.ui.leftBtn.x,this.ui.leftBtn.y,this.ui.leftBtn.width,this.ui.leftBtn.height); ctx2d.restore();

        // 结束遮罩
        if (this.gameState === 'ENDED') {
            ctx2d.fillStyle = 'rgba(0,0,0,0.7)'
            ctx2d.fillRect(0, 0, canvas.width, canvas.height)

            ctx2d.save()
            ctx2d.translate(this.bounds.centerX, this.bounds.centerY)
            ctx2d.rotate(-0.1)
            ctx2d.fillStyle = this.colors.radish
            ctx2d.font = 'bold 40px Arial'
            ctx2d.textAlign = 'center'
            ctx2d.shadowColor = '#000'
            ctx2d.shadowBlur = 10
            ctx2d.fillText('真棒猫!', 0, 0)

            ctx2d.shadowBlur = 0
            ctx2d.font = '18px Arial'
            ctx2d.fillStyle = '#fff'
            ctx2d.fillText('点屏幕任意位置再来一局', 0, 40)
            ctx2d.restore()
        }

        ctx2d.restore()
    }

    drawTopBar (ctx) {
        // 返回按钮
        this.drawButton(ctx, this.ui.backBtn, this.ui.backBtn.label, '#ffffff', 'rgba(255,255,255,0.12)')
    }

    drawControls (ctx) {
        if (this.gameState === 'ENDED') return

        // 明确显示 + 高对比
        this.drawButton(ctx, this.ui.leftBtn, '左：🥕', '#111', this.colors.radish)
        this.drawButton(ctx, this.ui.rightBtn, '右：🧻', '#111', this.colors.tissue)

        if (this.ui.feedbackBtn.visible) {
            this.drawButton(ctx, this.ui.feedbackBtn, this.ui.feedbackBtn.label, '#111', this.colors.awesome)
        }

        ctx.save()
        ctx.fillStyle = 'rgba(255,255,255,0.78)'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('选择一侧：选对终点道具才会出现“真棒”按钮', this.bounds.centerX, this.ui.leftBtn.y - 18)
        ctx.restore()
    }

    drawButton (ctx, btn, text, textColor, bgColor) {
        ctx.save()

        ctx.fillStyle = bgColor
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height)

        ctx.strokeStyle = 'rgba(0,0,0,0.35)'
        ctx.lineWidth = 2
        ctx.strokeRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2)

        ctx.fillStyle = 'rgba(255,255,255,0.18)'
        ctx.fillRect(btn.x + 2, btn.y + 2, btn.width - 4, Math.max(6, btn.height * 0.25))

        ctx.fillStyle = textColor
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2)

        ctx.restore()
    }

    drawGrid (ctx) {
        ctx.save()
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        ctx.lineWidth = 1
        const size = 32

        for (let x = 0; x < this.bounds.width; x += size) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, this.bounds.height)
            ctx.stroke()
        }

        for (let y = 0; y < this.bounds.height; y += size) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(this.bounds.width, y)
            ctx.stroke()
        }

        ctx.restore()
    }

    drawTarget (ctx, lastDomino, emoji, label) {
        if (!lastDomino) return

        const margin = 24
        const rawX = lastDomino.x + (lastDomino.x < this.bounds.centerX ? -30 : 30)
        const rawY = lastDomino.y
        const x = Math.max(margin, Math.min(this.bounds.width - margin, rawX))
        const y = Math.max(margin, Math.min(this.bounds.height - margin, rawY))

        ctx.save()
        ctx.font = '32px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#fff'
        ctx.fillText(emoji, x, y)

        ctx.font = '10px monospace'
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillText(label, x, y + 25)
        ctx.restore()
    }

    drawDominos (ctx, list) {
        list.forEach((d) => {
            ctx.save()
            ctx.translate(d.x, d.y)
            ctx.rotate(d.rotation)

            ctx.fillStyle = 'rgba(0,0,0,0.3)'
            ctx.fillRect(-d.width / 2 + 2, -d.height + 2, d.width, d.height)

            ctx.fillStyle = d.color
            ctx.fillRect(-d.width / 2, -d.height, d.width, d.height)

            // IDLE 闪烁高光
            if (this.gameState === 'IDLE' && Math.random() > 0.95) {
                ctx.fillStyle = 'rgba(255,255,255,0.8)'
                ctx.fillRect(-d.width / 2, -d.height, d.width, 2)
            }

            ctx.restore()
        })
    }

    drawPixelCat (ctx) {
        ctx.save()
        ctx.translate(this.cat.x, this.cat.y)

        let scaleY = this.cat.scale
        if (this.cat.state === 'idle') {
            scaleY *= 1 + Math.sin(Date.now() / 500) * 0.02
        }

        ctx.scale(this.cat.scale, scaleY)
        ctx.scale(this.cat.direction === 0 ? 1 : this.cat.direction === 1 ? -1 : 1, 1)

        const s = 4

        ctx.fillStyle = this.colors.catMain
        ctx.fillRect(-4 * s, -6 * s, 8 * s, 6 * s)
        ctx.fillRect(-5 * s, -10 * s, 10 * s, 6 * s)

        ctx.fillStyle = this.colors.catDark
        ctx.save()
        ctx.translate(-3 * s, -10 * s)
        ctx.rotate(this.cat.earAngle)
        ctx.fillRect(-1 * s, -2 * s, 2 * s, 2 * s)
        ctx.restore()

        ctx.save()
        ctx.translate(3 * s, -10 * s)
        ctx.rotate(-this.cat.earAngle)
        ctx.fillRect(-1 * s, -2 * s, 2 * s, 2 * s)
        ctx.restore()

        // 眼睛
        ctx.fillStyle = '#000'
        if (this.cat.state === 'shock') {
            ctx.fillRect(-3 * s, -8 * s, 2 * s, 2 * s)
            ctx.fillRect(1 * s, -8 * s, 2 * s, 2 * s)
        } else if (this.cat.state === 'jump') {
            ctx.fillRect(-3 * s, -8 * s, 2 * s, 1 * s)
            ctx.fillRect(-4 * s, -7 * s, 1 * s, 1 * s)
            ctx.fillRect(1 * s, -8 * s, 2 * s, 1 * s)
            ctx.fillRect(3 * s, -7 * s, 1 * s, 1 * s)
        } else {
            if (Math.sin(Date.now() / 200) > 0.98 && this.cat.state === 'idle') {
                ctx.fillRect(-3 * s, -7 * s, 2 * s, 1)
                ctx.fillRect(1 * s, -7 * s, 2 * s, 1)
            } else {
                ctx.fillRect(-3 * s, -8 * s, 1 * s, 1 * s)
                ctx.fillRect(1 * s, -8 * s, 1 * s, 1 * s)
            }
        }

        // 嘴/手
        ctx.fillStyle = '#fff'
        if (this.cat.state === 'push') {
            ctx.fillRect(2 * s, -4 * s, 3 * s, 2 * s)
        } else if (this.cat.state === 'jump') {
            ctx.fillRect(-5 * s, -5 * s, 2 * s, 2 * s)
            ctx.fillRect(3 * s, -5 * s, 2 * s, 2 * s)
        } else {
            ctx.fillRect(-2 * s, 0, 2 * s, 1 * s)
            ctx.fillRect(0, 0, 2 * s, 1 * s)
        }

        // 尾巴
        ctx.save()
        ctx.translate(0, -1 * s)
        ctx.rotate(this.cat.tailAngle)
        ctx.fillStyle = this.colors.catDark
        ctx.fillRect(-1 * s, 0, 2 * s, 4 * s)
        ctx.restore()

        // 道具
        if (this.cat.item) {
            ctx.font = '20px Arial'
            ctx.fillStyle = '#fff'
            ctx.fillText(this.cat.item, 0, -12 * s)
        }

        ctx.restore()
    }

    drawBubble (ctx) {
        ctx.save()
        ctx.globalAlpha = this.cat.bubbleAlpha
        const x = this.cat.x
        const y = this.cat.y - 60

        // roundRect 兼容处理
        const drawRoundRect = (x0, y0, w, h, r) => {
    
            ctx.beginPath()
            ctx.moveTo(x0 + r, y0)
            ctx.lineTo(x0 + w - r, y0)
            ctx.arcTo(x0 + w, y0, x0 + w, y0 + r, r)
            ctx.lineTo(x0 + w, y0 + h - r)
            ctx.arcTo(x0 + w, y0 + h, x0 + w - r, y0 + h, r)
            ctx.lineTo(x0 + r, y0 + h)
            ctx.arcTo(x0, y0 + h, x0, y0 + h - r, r)
            ctx.lineTo(x0, y0 + r)
            ctx.arcTo(x0, y0, x0 + r, y0, r)
            ctx.closePath()
        }

        ctx.fillStyle = '#fff'
        drawRoundRect(x - 60, y - 22, 120, 34, 10)
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(x, y + 12)
        ctx.lineTo(x - 6, y + 18)
        ctx.lineTo(x + 6, y + 18)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#000'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(this.cat.bubbleText, x, y - 5)

        ctx.restore()
    }

    drawParticles (ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]
            ctx.save()
            ctx.translate(p.x, p.y)
            ctx.rotate(p.rotation)
            ctx.fillStyle = p.color
            ctx.globalAlpha = p.life
            ctx.fillRect(-3, -3, 6, 6)
            ctx.restore()
        }
    }

    onTouchStart (e) {
        const touch = e.touches?.[0]
        if (!touch) return

        const x = touch.clientX
        const y = touch.clientY

        // 顶部返回
        if (this.isInRect(x, y, this.ui.backBtn)) {
            this.ctx.main.exitSubGame()
            return
        }

        // ENDED：点任意位置重开
        if (this.gameState === 'ENDED') {
            this.resetGameObjects()
            return
        }

        // 真棒按钮
        if (this.ui.feedbackBtn.visible && this.isInRect(x, y, this.ui.feedbackBtn)) {
            this.playSfx('awesome')
            this.triggerFeedback()
            return
        }

        // 左右选择
        if (this.isInRect(x, y, this.ui.leftBtn)) {
            this.playSfx('carrot')
            this.triggerAction('left')
            return
        }

        if (this.isInRect(x, y, this.ui.rightBtn)) {
            this.playSfx('tissue')
            this.triggerAction('right')
            return
        }
    }

    isInRect (x, y, r) {
        return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
    }
}
