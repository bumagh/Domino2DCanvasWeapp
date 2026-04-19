/**
 * 多米诺骨牌选关界面
 */
import { Levels, Chapters, loadProgress, getLevel } from './domino_levels.js'

export default class DominoLevelSelect {
    constructor(config) {
        this.canvas = config.canvas
        this.ctx = this.canvas.getContext('2d')
        this.onSelectLevel = config.onSelectLevel  // 选择关卡回调
        this.onBack = config.onBack                // 返回回调
        this.userInfo = config.userInfo            // 用户信息（用于积分）

        // 当前选中的章节
        this.currentChapter = 1

        // 滚动位置
        this.scrollY = 0
        this.maxScrollY = 0

        // 触摸状态
        this.touchStartY = 0
        this.isTouching = false

        // 预览弹窗状态
        this.previewModal = {
            visible: false,
            level: null,
            position: { x: 50, y: 100, width: 300, height: 400 },
            closeButton: { x: 320, y: 110, width: 30, height: 30 }
        }

        // 加载进度
        loadProgress()

        // 加载解锁配置
        this.unlockConfig = this.loadUnlockConfig()
    }

    // 加载解锁配置
    loadUnlockConfig() {
        try {
            const data = wx.getStorageSync('level_unlock_config')
            if (data) {
                return JSON.parse(data)
            }
        } catch (e) {
            console.error('加载解锁配置失败:', e)
        }
        return {
            unlockConfig: {
                default: {
                    scoreCost: 100,
                    videoReward: true,
                    previewEnabled: true
                }
            }
        }
    }

    // 获取关卡解锁配置
    getLevelUnlockConfig(levelId) {
        const config = this.unlockConfig.unlockConfig
        if (config.levels && config.levels[levelId]) {
            return config.levels[levelId]
        }
        const level = getLevel(levelId)
        if (level && config.chapters && config.chapters[level.chapter]) {
            return config.chapters[level.chapter]
        }
        return config.default
    }
    
    // 触摸事件
    onTouchStart(e) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY

        this.touchStartY = y
        this.isTouching = true

        // 检查预览弹窗关闭
        if (this.previewModal.visible) {
            if (this.checkPreviewCloseButton(x, y)) {
                this.previewModal.visible = false
                this.previewModal.level = null
                return
            }
            // 检查解锁按钮
            if (this.checkUnlockButtons(x, y)) {
                return
            }
            return
        }

        // 检查返回按钮
        if (this.checkBackButton(x, y)) {
            if (this.onBack) this.onBack()
            return
        }

        // 检查章节切换
        const chapterIndex = this.checkChapterTabs(x, y)
        if (chapterIndex !== -1) {
            const chapter = Chapters[chapterIndex]
            if (chapter.unlocked) {
                this.currentChapter = chapter.id
                this.scrollY = 0
            }
            return
        }

        // 检查关卡点击
        const levelId = this.checkLevelClick(x, y)
        if (levelId !== -1) {
            const level = getLevel(levelId)
            if (level) {
                if (level.unlocked) {
                    if (this.onSelectLevel) this.onSelectLevel(levelId)
                } else {
                    // 未解锁关卡显示预览
                    const unlockConfig = this.getLevelUnlockConfig(levelId)
                    if (unlockConfig.previewEnabled) {
                        this.previewModal.level = level
                        this.previewModal.visible = true
                    }
                }
            }
        }
    }
    
    onTouchMove(e) {
        if (!this.isTouching) return
        
        const y = e.touches[0].clientY
        const dy = y - this.touchStartY
        
        this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY - dy))
        this.touchStartY = y
    }
    
    onTouchEnd(e) {
        this.isTouching = false
    }
    
    // UI检测
    checkBackButton(x, y) {
        return x >= 20 && x <= 90 && y >= 20 && y <= 55
    }
    
    checkChapterTabs(x, y) {
        if (y < 70 || y > 130) return -1

        const tabWidth = (this.canvas.width - 20) / 5
        const tabHeight = 25
        const tabMargin = 5

        const cols = 5
        const row = Math.floor((y - 70) / (tabHeight + tabMargin))
        const col = Math.floor(x / (tabWidth + tabMargin))

        if (row < 0 || row >= 2) return -1
        if (col < 0 || col >= cols) return -1

        const index = row * cols + col
        return index >= 0 && index < Chapters.length ? index : -1
    }
    
    checkLevelClick(x, y) {
        const chapter = Chapters.find(c => c.id === this.currentChapter)
        if (!chapter) return -1

        const startY = 145 - this.scrollY
        const cardHeight = 100
        const cardMargin = 15
        const cardWidth = (this.canvas.width - 40 - cardMargin) / 2
        const cols = 2

        for (let i = 0; i < chapter.levels.length; i++) {
            const row = Math.floor(i / cols)
            const col = i % cols
            const cardX = 20 + col * (cardWidth + cardMargin)
            const cardY = startY + row * (cardHeight + cardMargin)

            if (x >= cardX && x <= cardX + cardWidth &&
                y >= cardY && y <= cardY + cardHeight) {
                return chapter.levels[i]
            }
        }
        return -1
    }

    checkPreviewCloseButton(x, y) {
        const btn = this.previewModal.closeButton
        return x >= btn.x && x <= btn.x + btn.width &&
               y >= btn.y && y <= btn.y + btn.height
    }

    checkUnlockButtons(x, y) {
        if (!this.previewModal.level) return false

        const modal = this.previewModal.position
        const unlockConfig = this.getLevelUnlockConfig(this.previewModal.level.id)

        // 检查视频解锁按钮
        if (unlockConfig.videoReward) {
            const videoBtn = { x: modal.x + 20, y: modal.y + 280, width: 260, height: 40 }
            if (x >= videoBtn.x && x <= videoBtn.x + videoBtn.width &&
                y >= videoBtn.y && y <= videoBtn.y + videoBtn.height) {
                this.unlockByVideo()
                return true
            }
        }

        // 检查积分解锁按钮
        if (unlockConfig.scoreCost > 0) {
            const scoreBtn = { x: modal.x + 20, y: modal.y + 330, width: 260, height: 40 }
            if (x >= scoreBtn.x && x <= scoreBtn.x + scoreBtn.width &&
                y >= scoreBtn.y && y <= scoreBtn.y + scoreBtn.height) {
                this.unlockByScore()
                return true
            }
        }

        return false
    }

    unlockByVideo() {
        // 调用广告管理器播放激励视频
        if (this.onWatchAd) {
            this.onWatchAd(() => {
                this.unlockLevel()
            })
        } else {
            console.warn('广告管理器未初始化')
        }
    }

    unlockByScore() {
        const unlockConfig = this.getLevelUnlockConfig(this.previewModal.level.id)
        const currentScore = this.userInfo?.score || 0

        if (currentScore >= unlockConfig.scoreCost) {
            // 扣除积分
            if (this.onDeductScore) {
                this.onDeductScore(unlockConfig.scoreCost, () => {
                    this.unlockLevel()
                })
            } else {
                console.warn('积分扣除功能未初始化')
            }
        } else {
            console.warn('积分不足')
        }
    }

    unlockLevel() {
        if (this.previewModal.level) {
            this.previewModal.level.unlocked = true
            this.previewModal.visible = false
            this.previewModal.level = null
            // 保存进度
            try {
                const progress = {
                    levels: Levels.map(l => ({ id: l.id, stars: l.stars, unlocked: l.unlocked })),
                    chapters: Chapters.map(c => ({ id: c.id, unlocked: c.unlocked }))
                }
                wx.setStorageSync('domino_progress', JSON.stringify(progress))
            } catch (e) {
                console.error('保存进度失败:', e)
            }
        }
    }
    
    // 渲染
    render() {
        const ctx = this.ctx
        const canvas = this.canvas

        // 背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#1a1a2e')
        gradient.addColorStop(1, '#16213e')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 标题
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('选择关卡', canvas.width / 2, 45)

        // 返回按钮
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fillRect(20, 20, 70, 35)
        ctx.fillStyle = '#fff'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('← 返回', 55, 43)

        // 章节标签
        this.drawChapterTabs()

        // 关卡列表
        this.drawLevelList()

        // 预览弹窗
        if (this.previewModal.visible) {
            this.drawPreviewModal()
        }
    }
    
    drawChapterTabs() {
        const ctx = this.ctx
        const canvas = this.canvas

        const tabWidth = (this.canvas.width - 20) / 5
        const tabHeight = 25
        const tabMargin = 5
        const cols = 5

        Chapters.forEach((chapter, index) => {
            const row = Math.floor(index / cols)
            const col = index % cols
            const x = 10 + col * (tabWidth + tabMargin)
            const y = 70 + row * (tabHeight + tabMargin)

            const isSelected = chapter.id === this.currentChapter
            const isLocked = !chapter.unlocked

            // 标签背景
            ctx.fillStyle = isSelected ? 'rgba(76, 175, 80, 0.8)' :
                           isLocked ? 'rgba(100, 100, 100, 0.5)' : 'rgba(255, 255, 255, 0.1)'
            ctx.fillRect(x, y, tabWidth, tabHeight)

            // 标签文字
            ctx.fillStyle = isLocked ? '#666' : '#fff'
            ctx.font = isSelected ? 'bold 12px Arial' : '11px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(isLocked ? '🔒' : chapter.name, x + tabWidth / 2, y + tabHeight / 2)
        })
    }
    
    drawLevelList() {
        const ctx = this.ctx
        const canvas = this.canvas

        const chapter = Chapters.find(c => c.id === this.currentChapter)
        if (!chapter) return

        const startY = 145
        const cardHeight = 100
        const cardMargin = 15
        const cardWidth = (canvas.width - 40 - cardMargin) / 2
        const cols = 2

        // 计算最大滚动
        const rows = Math.ceil(chapter.levels.length / cols)
        this.maxScrollY = Math.max(0, rows * (cardHeight + cardMargin) - (canvas.height - startY - 20))

        // 裁剪区域
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, startY - 10, canvas.width, canvas.height - startY + 10)
        ctx.clip()

        chapter.levels.forEach((levelId, index) => {
            const level = getLevel(levelId)
            if (!level) return

            const row = Math.floor(index / cols)
            const col = index % cols
            const cardX = 20 + col * (cardWidth + cardMargin)
            const cardY = startY + row * (cardHeight + cardMargin) - this.scrollY

            // 跳过不可见的卡片
            if (cardY + cardHeight < startY - 10 || cardY > canvas.height) return

            this.drawLevelCard(level, cardX, cardY, cardWidth, cardHeight)
        })

        ctx.restore()
    }
    
    drawLevelCard(level, x, y, width, height) {
        const ctx = this.ctx
        const isLocked = !level.unlocked
        const unlockConfig = this.getLevelUnlockConfig(level.id)

        // 卡片背景
        ctx.fillStyle = isLocked ? 'rgba(50, 50, 50, 0.8)' : 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(x, y, width, height)

        // 边框
        ctx.strokeStyle = isLocked ? 'rgba(100, 100, 100, 0.5)' :
                         level.stars > 0 ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = level.stars > 0 ? 2 : 1
        ctx.strokeRect(x, y, width, height)

        // 关卡编号
        ctx.fillStyle = isLocked ? '#666' : '#4ecdc4'
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(level.id, x + width / 2, y + 30)

        // 关卡名称
        ctx.fillStyle = isLocked ? '#666' : '#fff'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(isLocked ? '🔒 未解锁' : level.name, x + width / 2, y + 50)

        // 关卡描述
        ctx.fillStyle = isLocked ? '#555' : '#aaa'
        ctx.font = '12px Arial'
        ctx.fillText(isLocked ? '点击查看详情' : level.description, x + width / 2, y + 70)

        // 目标
        if (!isLocked) {
            ctx.fillStyle = '#888'
            ctx.font = '11px Arial'
            ctx.fillText(`目标: 连锁 ${level.target.value}+`, x + width / 2, y + 85)
        }

        // 星级显示
        if (!isLocked) {
            const starY = y + 95
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = i < level.stars ? '#FFD700' : '#444'
                ctx.font = '14px Arial'
                ctx.fillText('★', x + width / 2 - 15 + i * 15, starY)
            }
        }

        // 难度指示
        if (!isLocked) {
            const diffX = x + width / 2 - 25
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = i < level.difficulty ? '#ff6b6b' : '#333'
                ctx.fillRect(diffX + i * 10, y + 10, 8, 8)
            }
        }
    }

    drawPreviewModal() {
        const ctx = this.ctx
        const modal = this.previewModal.position
        const level = this.previewModal.level
        const unlockConfig = this.getLevelUnlockConfig(level.id)

        // 遮罩层
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        // 弹窗背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.fillRect(modal.x, modal.y, modal.width, modal.height)

        // 边框
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
        ctx.lineWidth = 3
        ctx.strokeRect(modal.x, modal.y, modal.width, modal.height)

        // 关闭按钮
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fillRect(this.previewModal.closeButton.x, this.previewModal.closeButton.y,
                    this.previewModal.closeButton.width, this.previewModal.closeButton.height)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('✕', this.previewModal.closeButton.x + this.previewModal.closeButton.width / 2,
                     this.previewModal.closeButton.y + this.previewModal.closeButton.height / 2)

        // 关卡标题
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`关卡 ${level.id}: ${level.name}`, modal.x + modal.width / 2, modal.y + 40)

        // 关卡描述
        ctx.fillStyle = '#fff'
        ctx.font = '14px Arial'
        ctx.fillText(level.description, modal.x + modal.width / 2, modal.y + 70)

        // 目标
        ctx.fillStyle = '#4ecdc4'
        ctx.font = '16px Arial'
        ctx.fillText(`目标: 连锁 ${level.target.value}+`, modal.x + modal.width / 2, modal.y + 100)

        // 难度
        ctx.fillStyle = '#888'
        ctx.font = '14px Arial'
        ctx.fillText('难度:', modal.x + modal.width / 2 - 30, modal.y + 130)
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i < level.difficulty ? '#ff6b6b' : '#333'
            ctx.fillRect(modal.x + modal.width / 2 + i * 12, modal.y + 120, 10, 10)
        }

        // 提示
        ctx.fillStyle = '#aaa'
        ctx.font = '12px Arial'
        ctx.textAlign = 'left'
        if (level.hints && level.hints.length > 0) {
            ctx.fillText('提示:', modal.x + 20, modal.y + 160)
            level.hints.forEach((hint, index) => {
                ctx.fillText(`• ${hint}`, modal.x + 20, modal.y + 180 + index * 20)
            })
        }

        // 障碍物信息
        if (level.obstacles && level.obstacles.length > 0) {
            ctx.fillStyle = '#ff6b6b'
            ctx.fillText('障碍物:', modal.x + 20, modal.y + 230)
            level.obstacles.forEach((obs, index) => {
                ctx.fillStyle = '#aaa'
                ctx.fillText(`• ${obs.type}`, modal.x + 20, modal.y + 250 + index * 20)
            })
        }

        // 解锁选项
        const currentScore = this.userInfo?.score || 0

        // 视频解锁按钮
        if (unlockConfig.videoReward) {
            ctx.fillStyle = '#FF5722'
            ctx.fillRect(modal.x + 20, modal.y + 280, 260, 40)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 16px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('📺 看广告解锁', modal.x + 150, modal.y + 300)
        }

        // 积分解锁按钮
        if (unlockConfig.scoreCost > 0) {
            const canAfford = currentScore >= unlockConfig.scoreCost
            ctx.fillStyle = canAfford ? '#4CAF50' : '#666'
            ctx.fillRect(modal.x + 20, modal.y + 330, 260, 40)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 16px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`💎 ${unlockConfig.scoreCost}积分解锁 (当前:${currentScore})`, modal.x + 150, modal.y + 350)
        }
    }
}
