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
        
        // 当前选中的章节
        this.currentChapter = 1
        
        // 滚动位置
        this.scrollY = 0
        this.maxScrollY = 0
        
        // 触摸状态
        this.touchStartY = 0
        this.isTouching = false
        
        // 加载进度
        loadProgress()
    }
    
    // 触摸事件
    onTouchStart(e) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        
        this.touchStartY = y
        this.isTouching = true
        
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
            if (level && level.unlocked) {
                if (this.onSelectLevel) this.onSelectLevel(levelId)
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
        if (y < 70 || y > 110) return -1
        
        const tabWidth = this.canvas.width / Chapters.length
        const index = Math.floor(x / tabWidth)
        return index >= 0 && index < Chapters.length ? index : -1
    }
    
    checkLevelClick(x, y) {
        const chapter = Chapters.find(c => c.id === this.currentChapter)
        if (!chapter) return -1
        
        const startY = 130 - this.scrollY
        const cardHeight = 100
        const cardMargin = 15
        const cardWidth = this.canvas.width - 40
        
        for (let i = 0; i < chapter.levels.length; i++) {
            const cardY = startY + i * (cardHeight + cardMargin)
            if (x >= 20 && x <= 20 + cardWidth &&
                y >= cardY && y <= cardY + cardHeight) {
                return chapter.levels[i]
            }
        }
        return -1
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
    }
    
    drawChapterTabs() {
        const ctx = this.ctx
        const canvas = this.canvas
        const tabWidth = canvas.width / Chapters.length
        
        Chapters.forEach((chapter, index) => {
            const x = index * tabWidth
            const isSelected = chapter.id === this.currentChapter
            const isLocked = !chapter.unlocked
            
            // 标签背景
            ctx.fillStyle = isSelected ? 'rgba(76, 175, 80, 0.8)' : 
                           isLocked ? 'rgba(100, 100, 100, 0.5)' : 'rgba(255, 255, 255, 0.1)'
            ctx.fillRect(x + 2, 70, tabWidth - 4, 40)
            
            // 标签文字
            ctx.fillStyle = isLocked ? '#666' : '#fff'
            ctx.font = isSelected ? 'bold 14px Arial' : '12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(isLocked ? '🔒' : chapter.name, x + tabWidth / 2, 95)
        })
    }
    
    drawLevelList() {
        const ctx = this.ctx
        const canvas = this.canvas
        
        const chapter = Chapters.find(c => c.id === this.currentChapter)
        if (!chapter) return
        
        const startY = 130
        const cardHeight = 100
        const cardMargin = 15
        const cardWidth = canvas.width - 40
        
        // 计算最大滚动
        this.maxScrollY = Math.max(0, chapter.levels.length * (cardHeight + cardMargin) - (canvas.height - startY - 20))
        
        // 裁剪区域
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, startY - 10, canvas.width, canvas.height - startY + 10)
        ctx.clip()
        
        chapter.levels.forEach((levelId, index) => {
            const level = getLevel(levelId)
            if (!level) return
            
            const cardY = startY + index * (cardHeight + cardMargin) - this.scrollY
            
            // 跳过不可见的卡片
            if (cardY + cardHeight < startY - 10 || cardY > canvas.height) return
            
            this.drawLevelCard(level, 20, cardY, cardWidth, cardHeight)
        })
        
        ctx.restore()
    }
    
    drawLevelCard(level, x, y, width, height) {
        const ctx = this.ctx
        const isLocked = !level.unlocked
        
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
        ctx.font = 'bold 36px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(level.id, x + 45, y + 60)
        
        // 关卡名称
        ctx.fillStyle = isLocked ? '#666' : '#fff'
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(isLocked ? '🔒 未解锁' : level.name, x + 90, y + 35)
        
        // 关卡描述
        ctx.fillStyle = isLocked ? '#555' : '#aaa'
        ctx.font = '14px Arial'
        ctx.fillText(isLocked ? '完成前一关解锁' : level.description, x + 90, y + 55)
        
        // 目标
        if (!isLocked) {
            ctx.fillStyle = '#888'
            ctx.font = '12px Arial'
            ctx.fillText(`目标: 连锁 ${level.target.value}+`, x + 90, y + 75)
        }
        
        // 星级显示
        if (!isLocked) {
            const starY = y + 85
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = i < level.stars ? '#FFD700' : '#444'
                ctx.font = '18px Arial'
                ctx.fillText('★', x + 90 + i * 25, starY)
            }
        }
        
        // 难度指示
        if (!isLocked) {
            const diffX = x + width - 80
            ctx.fillStyle = '#888'
            ctx.font = '12px Arial'
            ctx.textAlign = 'right'
            ctx.fillText('难度:', diffX, y + 30)
            
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = i < level.difficulty ? '#ff6b6b' : '#333'
                ctx.fillRect(diffX + 5 + i * 12, y + 20, 10, 10)
            }
        }
    }
}
