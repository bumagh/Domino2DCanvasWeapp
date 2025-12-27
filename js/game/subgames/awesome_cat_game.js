import SubGameBase from './subgame_base.js'

/**
 * 示例子游戏：AwesomeCat
 * 先做成可运行的占位模块：展示一块面板 + 点击退出
 */
export default class AwesomeCatGame extends SubGameBase {
  get id() {
    return 'awesomeCat'
  }

  get name() {
    return 'Awesome Cat'
  }

  init() {
    super.init()
    this.startTime = Date.now()
  }

  update(dt) {
    // 预留：更新逻辑
  }

  render() {
    const { main, canvas } = this.ctx
    const ctx2d = main.ctx

    // 半透明遮罩
    ctx2d.save()
    ctx2d.fillStyle = 'rgba(0,0,0,0.75)'
    ctx2d.fillRect(0, 0, canvas.width, canvas.height)

    // 面板
    const w = 360
    const h = 260
    const x = (canvas.width - w) / 2
    const y = (canvas.height - h) / 2

    ctx2d.fillStyle = 'rgba(255,255,255,0.08)'
    ctx2d.fillRect(x, y, w, h)
    ctx2d.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx2d.strokeRect(x, y, w, h)

    ctx2d.fillStyle = '#fff'
    ctx2d.font = '20px Arial'
    ctx2d.textAlign = 'center'
    ctx2d.fillText('Awesome Cat 子游戏（示例）', canvas.width / 2, y + 60)

    ctx2d.font = '14px Arial'
    ctx2d.fillText('点击下方按钮返回主游戏', canvas.width / 2, y + 110)

    // 退出按钮
    this.exitBtn = {
      x: canvas.width / 2 - 80,
      y: y + h - 80,
      width: 160,
      height: 44
    }

    ctx2d.fillStyle = '#ffcc00'
    ctx2d.fillRect(this.exitBtn.x, this.exitBtn.y, this.exitBtn.width, this.exitBtn.height)
    ctx2d.fillStyle = '#000'
    ctx2d.font = 'bold 16px Arial'
    ctx2d.fillText('返回', canvas.width / 2, this.exitBtn.y + 28)

    ctx2d.restore()
  }

  onTouchStart(e) {
    const touch = e.touches?.[0]
    if (!touch) return

    const x = touch.clientX
    const y = touch.clientY

    if (this.exitBtn && x >= this.exitBtn.x && x <= this.exitBtn.x + this.exitBtn.width && y >= this.exitBtn.y && y <= this.exitBtn.y + this.exitBtn.height) {
      this.ctx.main.exitSubGame()
    }
  }
}
