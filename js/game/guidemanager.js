/**
 * 新手引导管理器
 * 管理游戏新手引导流程
 */

export default class GuideManager {
  constructor(databus, main) {
    this.databus = databus
    this.main = main

    // 引导状态
    this.isActive = false
    this.currentStep = 0
    this.completedSteps = []

    // 引导步骤配置
    this.guideSteps = [
      {
        id: 'welcome',
        title: '欢迎来到多米诺骨牌',
        content: '点击屏幕开始游戏，体验骨牌连锁反应的乐趣！',
        target: null,
        position: { x: 200, y: 400 },
        highlight: null
      },
      {
        id: 'start_game',
        title: '开始游戏',
        content: '点击"关卡模式"按钮开始第一关',
        target: 'startGameButton',
        position: { x: 120, y: 425 },
        highlight: 'startGameButton'
      },
      {
        id: 'select_ball',
        title: '选择小球',
        content: '点击选择你喜欢的滚珠',
        target: null,
        position: { x: 200, y: 300 },
        highlight: 'ballSelection'
      },
      {
        id: 'place_ball',
        title: '放置小球',
        content: '拖动小球到起点位置',
        target: null,
        position: { x: 200, y: 200 },
        highlight: 'startPosition'
      },
      {
        id: 'launch_ball',
        title: '发射小球',
        content: '点击发射按钮让小球开始滚动',
        target: 'launchButton',
        position: { x: 350, y: 700 },
        highlight: 'launchButton'
      },
      {
        id: 'watch_ball',
        title: '观察小球滚动',
        content: '观察小球推动骨牌的精彩瞬间',
        target: null,
        position: { x: 200, y: 400 },
        highlight: null
      },
      {
        id: 'collect_bones',
        title: '收集骨牌',
        content: '收集所有骨牌来完成关卡',
        target: null,
        position: { x: 200, y: 100 },
        highlight: 'bones'
      },
      {
        id: 'complete_level',
        title: '完成关卡',
        content: '恭喜你完成了第一关！',
        target: null,
        position: { x: 200, y: 400 },
        highlight: null
      }
    ]

    // 加载引导完成状态
    this.loadGuideStatus()

    // 检查是否需要显示引导
    this.checkNeedGuide()
  }

  /**
   * 加载引导完成状态
   */
  loadGuideStatus() {
    try {
      const data = wx.getStorageSync('guideCompleted')
      if (data) {
        this.completedSteps = data
      }
    } catch (e) {
      console.error('加载引导状态失败:', e)
    }
  }

  /**
   * 保存引导完成状态
   */
  saveGuideStatus() {
    try {
      wx.setStorageSync('guideCompleted', this.completedSteps)
    } catch (e) {
      console.error('保存引导状态失败:', e)
    }
  }

  /**
   * 检查是否需要显示引导
   */
  checkNeedGuide() {
    // 如果所有步骤都已完成，不需要显示引导
    if (this.completedSteps.length >= this.guideSteps.length) {
      return false
    }
    return true
  }

  /**
   * 开始引导
   */
  startGuide() {
    if (!this.checkNeedGuide()) {
      return false
    }

    this.isActive = true
    this.currentStep = this.completedSteps.length
    return true
  }

  /**
   * 结束引导
   */
  endGuide() {
    this.isActive = false
    this.currentStep = 0
  }

  /**
   * 完成当前步骤
   */
  completeStep(stepId) {
    if (!this.completedSteps.includes(stepId)) {
      this.completedSteps.push(stepId)
      this.saveGuideStatus()
    }

    this.currentStep++

    // 检查是否完成所有引导
    if (this.currentStep >= this.guideSteps.length) {
      this.endGuide()
      return { finished: true }
    }

    return { finished: false, nextStep: this.currentStep }
  }

  /**
   * 跳过引导
   */
  skipGuide() {
    // 标记所有步骤为已完成
    this.guideSteps.forEach(step => {
      if (!this.completedSteps.includes(step.id)) {
        this.completedSteps.push(step.id)
      }
    })
    this.saveGuideStatus()
    this.endGuide()
  }

  /**
   * 获取当前引导步骤
   */
  getCurrentStep() {
    if (this.currentStep < this.guideSteps.length) {
      return this.guideSteps[this.currentStep]
    }
    return null
  }

  /**
   * 绘制引导遮罩和提示
   */
  drawGuide(ctx, canvasWidth, canvasHeight) {
    if (!this.isActive) {
      return
    }

    const step = this.getCurrentStep()
    if (!step) {
      return
    }

    // 半透明黑色遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 高亮目标区域（如果有）
    if (step.highlight && this.main) {
      this.drawHighlight(ctx, step.highlight)
    }

    // 引导提示框
    const boxWidth = 300
    const boxHeight = 150
    const boxX = (canvasWidth - boxWidth) / 2
    const boxY = canvasHeight / 2 - 50

    // 提示框背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 3
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

    // 标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(step.title, boxX + boxWidth / 2, boxY + 30)

    // 内容
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.fillText(step.content, boxX + boxWidth / 2, boxY + 70)

    // 步骤指示
    ctx.fillStyle = '#aaaaaa'
    ctx.font = '12px Arial'
    ctx.fillText(`步骤 ${this.currentStep + 1} / ${this.guideSteps.length}`, boxX + boxWidth / 2, boxY + 110)

    // 跳过按钮
    const skipButton = {
      x: boxX + boxWidth - 60,
      y: boxY + 10,
      width: 50,
      height: 25
    }
    ctx.fillStyle = 'rgba(255, 100, 100, 0.2)'
    ctx.fillRect(skipButton.x, skipButton.y, skipButton.width, skipButton.height)
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(skipButton.x, skipButton.y, skipButton.width, skipButton.height)
    ctx.fillStyle = '#ff6464'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('跳过', skipButton.x + skipButton.width / 2, skipButton.y + skipButton.height / 2)

    // 下一步按钮
    const nextButton = {
      x: boxX + boxWidth / 2 - 50,
      y: boxY + boxHeight - 40,
      width: 100,
      height: 30
    }
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'
    ctx.fillRect(nextButton.x, nextButton.y, nextButton.width, nextButton.height)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(nextButton.x, nextButton.y, nextButton.width, nextButton.height)
    ctx.fillStyle = '#00ff00'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('下一步', nextButton.x + nextButton.width / 2, nextButton.y + nextButton.height / 2)

    // 保存按钮位置供点击检测
    this.guideButtons = {
      skip: skipButton,
      next: nextButton
    }
  }

  /**
   * 绘制高亮区域
   */
  drawHighlight(ctx, target) {
    if (!this.main || !this.main.gameInfo) {
      return
    }

    const positions = this.main.gameInfo.uiPositions
    if (!positions) {
      return
    }

    let highlightArea = null

    switch (target) {
      case 'startGameButton':
        if (this.main.menu) {
          highlightArea = this.main.menu.uiPositions.startGameButton
        }
        break
      case 'launchButton':
        if (this.main.gameInfo.uiPositions.launchButton) {
          highlightArea = this.main.gameInfo.uiPositions.launchButton
        }
        break
      default:
        break
    }

    if (highlightArea) {
      // 创建遮罩，只显示高亮区域
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.rect(highlightArea.x, highlightArea.y, highlightArea.width, highlightArea.height)
      ctx.clip('evenodd')
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.restore()

      // 高亮边框
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 3
      ctx.strokeRect(highlightArea.x, highlightArea.y, highlightArea.width, highlightArea.height)
    }
  }

  /**
   * 处理引导点击
   */
  handleClick(x, y) {
    if (!this.isActive || !this.guideButtons) {
      return null
    }

    // 检查跳过按钮
    if (this.isPointInButton(x, y, this.guideButtons.skip)) {
      this.skipGuide()
      return 'guideSkip'
    }

    // 检查下一步按钮
    if (this.isPointInButton(x, y, this.guideButtons.next)) {
      const step = this.getCurrentStep()
      if (step) {
        const result = this.completeStep(step.id)
        if (result.finished) {
          return 'guideFinished'
        }
        return 'guideNext'
      }
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

  /**
   * 重置引导（用于测试）
   */
  resetGuide() {
    this.completedSteps = []
    this.currentStep = 0
    this.saveGuideStatus()
  }
}
