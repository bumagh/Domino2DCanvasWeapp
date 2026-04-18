/**
 * 游戏教程管理器
 * 管理游戏玩法教程系统
 */

export default class TutorialManager {
  constructor(databus) {
    this.databus = databus

    // 教程状态
    this.currentTutorial = null
    this.completedTutorials = []

    // 教程配置
    this.tutorials = [
      {
        id: 'basics',
        title: '基础教程',
        description: '学习游戏基本操作',
        chapters: [
          {
            id: 'ball_selection',
            title: '选择滚珠',
            content: '点击选择你喜欢的滚珠，不同的滚珠有不同的属性。',
            image: null,
            action: null
          },
          {
            id: 'ball_placement',
            title: '放置滚珠',
            content: '拖动滚珠到起点位置，准备发射。',
            image: null,
            action: null
          },
          {
            id: 'launch',
            title: '发射滚珠',
            content: '点击发射按钮让滚珠开始滚动。',
            image: null,
            action: null
          },
          {
            id: 'domino_chain',
            title: '骨牌连锁',
            content: '观察滚珠推动骨牌产生连锁反应。',
            image: null,
            action: null
          }
        ]
      },
      {
        id: 'advanced',
        title: '进阶教程',
        description: '学习高级技巧',
        chapters: [
          {
            id: 'betting',
            title: '助力系统',
            content: '选择助力倍数，高风险高回报。',
            image: null,
            action: null
          },
          {
            id: 'items',
            title: '道具使用',
            content: '合理使用道具可以帮助你获得更高分数。',
            image: null,
            action: null
          },
          {
            id: 'combos',
            title: '连击技巧',
            content: '连续推动更多骨牌可以获得连击加成。',
            image: null,
            action: null
          }
        ]
      },
      {
        id: 'strategies',
        title: '策略教程',
        description: '学习获胜策略',
        chapters: [
          {
            id: 'route_planning',
            title: '路线规划',
            content: '观察骨牌布局，规划最佳滚动路线。',
            image: null,
            action: null
          },
          {
            id: 'timing',
            title: '时机把握',
            content: '掌握发射时机，避开障碍物。',
            image: null,
            action: null
          },
          {
            id: 'score_maximization',
            title: '分数最大化',
            content: '收集更多骨牌，完成挑战获得高分。',
            image: null,
            action: null
          }
        ]
      }
    ]

    // 加载教程完成状态
    this.loadTutorialStatus()
  }

  /**
   * 加载教程完成状态
   */
  loadTutorialStatus() {
    try {
      const data = wx.getStorageSync('tutorialCompleted')
      if (data) {
        this.completedTutorials = data
      }
    } catch (e) {
      console.error('加载教程状态失败:', e)
    }
  }

  /**
   * 保存教程完成状态
   */
  saveTutorialStatus() {
    try {
      wx.setStorageSync('tutorialCompleted', this.completedTutorials)
    } catch (e) {
      console.error('保存教程状态失败:', e)
    }
  }

  /**
   * 获取所有教程
   */
  getAllTutorials() {
    return this.tutorials.map(tutorial => ({
      ...tutorial,
      completed: this.completedTutorials.includes(tutorial.id)
    }))
  }

  /**
   * 获取教程详情
   */
  getTutorial(tutorialId) {
    return this.tutorials.find(t => t.id === tutorialId)
  }

  /**
   * 开始教程
   */
  startTutorial(tutorialId) {
    const tutorial = this.getTutorial(tutorialId)
    if (tutorial) {
      this.currentTutorial = {
        ...tutorial,
        currentChapterIndex: 0
      }
      return true
    }
    return false
  }

  /**
   * 结束教程
   */
  endTutorial() {
    this.currentTutorial = null
  }

  /**
   * 下一章
   */
  nextChapter() {
    if (this.currentTutorial) {
      this.currentTutorial.currentChapterIndex++
      // 检查是否完成所有章节
      if (this.currentTutorial.currentChapterIndex >= this.currentTutorial.chapters.length) {
        this.completeTutorial(this.currentTutorial.id)
        return { finished: true }
      }
      return { finished: false }
    }
    return { finished: true }
  }

  /**
   * 上一章
   */
  prevChapter() {
    if (this.currentTutorial) {
      if (this.currentTutorial.currentChapterIndex > 0) {
        this.currentTutorial.currentChapterIndex--
      }
    }
  }

  /**
   * 获取当前章节
   */
  getCurrentChapter() {
    if (this.currentTutorial) {
      return this.currentTutorial.chapters[this.currentTutorial.currentChapterIndex]
    }
    return null
  }

  /**
   * 完成教程
   */
  completeTutorial(tutorialId) {
    if (!this.completedTutorials.includes(tutorialId)) {
      this.completedTutorials.push(tutorialId)
      this.saveTutorialStatus()
    }
    this.endTutorial()
  }

  /**
   * 重置教程（用于测试）
   */
  resetTutorials() {
    this.completedTutorials = []
    this.saveTutorialStatus()
  }

  /**
   * 绘制教程弹窗
   */
  drawTutorialModal(ctx, canvasWidth, canvasHeight) {
    if (!this.currentTutorial) {
      return
    }

    const chapter = this.getCurrentChapter()
    if (!chapter) {
      return
    }

    // 全屏遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 教程弹窗
    const modalWidth = 350
    const modalHeight = 450
    const modalX = (canvasWidth - modalWidth) / 2
    const modalY = (canvasHeight - modalHeight) / 2

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight)
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 3
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight)

    // 教程标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.currentTutorial.title, modalX + modalWidth / 2, modalY + 30)

    // 章节标题
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.fillText(chapter.title, modalX + modalWidth / 2, modalY + 70)

    // 章节内容
    ctx.fillStyle = '#cccccc'
    ctx.font = '14px Arial'
    const maxWidth = modalWidth - 40
    this.wrapText(ctx, chapter.content, modalX + 20, modalY + 120, maxWidth, 20)

    // 章节进度
    ctx.fillStyle = '#aaaaaa'
    ctx.font = '12px Arial'
    ctx.fillText(`章节 ${this.currentTutorial.currentChapterIndex + 1} / ${this.currentTutorial.chapters.length}`,
                 modalX + modalWidth / 2, modalY + modalHeight - 100)

    // 关闭按钮
    const closeButton = {
      x: modalX + modalWidth - 40,
      y: modalY + 10,
      width: 30,
      height: 30
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✕', closeButton.x + closeButton.width / 2, closeButton.y + closeButton.height / 2)

    // 上一章按钮
    const prevButton = {
      x: modalX + 20,
      y: modalY + modalHeight - 50,
      width: 100,
      height: 35
    }
    ctx.fillStyle = this.currentTutorial.currentChapterIndex > 0 ? 'rgba(0, 100, 255, 0.2)' : 'rgba(100, 100, 100, 0.2)'
    ctx.fillRect(prevButton.x, prevButton.y, prevButton.width, prevButton.height)
    ctx.strokeStyle = this.currentTutorial.currentChapterIndex > 0 ? 'rgba(0, 100, 255, 0.4)' : 'rgba(100, 100, 100, 0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(prevButton.x, prevButton.y, prevButton.width, prevButton.height)
    ctx.fillStyle = this.currentTutorial.currentChapterIndex > 0 ? '#0064ff' : '#646464'
    ctx.font = 'bold 14px Arial'
    ctx.fillText('上一章', prevButton.x + prevButton.width / 2, prevButton.y + prevButton.height / 2)

    // 下一章按钮
    const nextButton = {
      x: modalX + modalWidth - 120,
      y: modalY + modalHeight - 50,
      width: 100,
      height: 35
    }
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'
    ctx.fillRect(nextButton.x, nextButton.y, nextButton.width, nextButton.height)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)'
    ctx.strokeRect(nextButton.x, nextButton.y, nextButton.width, nextButton.height)
    ctx.fillStyle = '#00ff00'
    ctx.fillText('下一章', nextButton.x + nextButton.width / 2, nextButton.y + nextButton.height / 2)

    // 保存按钮位置
    this.tutorialButtons = {
      close: closeButton,
      prev: prevButton,
      next: nextButton
    }
  }

  /**
   * 文字换行
   */
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('')
    let line = ''
    let currentY = y

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i]
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY)
        line = words[i]
        currentY += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, currentY)
  }

  /**
   * 处理教程点击
   */
  handleClick(x, y) {
    if (!this.currentTutorial || !this.tutorialButtons) {
      return null
    }

    // 关闭按钮
    if (this.isPointInButton(x, y, this.tutorialButtons.close)) {
      this.endTutorial()
      return 'tutorialClose'
    }

    // 上一章按钮
    if (this.isPointInButton(x, y, this.tutorialButtons.prev)) {
      if (this.currentTutorial.currentChapterIndex > 0) {
        this.prevChapter()
        return 'tutorialPrev'
      }
    }

    // 下一章按钮
    if (this.isPointInButton(x, y, this.tutorialButtons.next)) {
      const result = this.nextChapter()
      if (result.finished) {
        return 'tutorialFinished'
      }
      return 'tutorialNext'
    }

    return null
  }

  /**
   * 检查点是否在按钮内
   */
  isPointInButton(x, y, button) {
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height
  }
}
