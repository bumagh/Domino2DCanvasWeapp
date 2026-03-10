# 技术设计文档：游戏结束分享功能

**版本：** v1.0  
**日期：** 2026-03-10  
**状态：** 待评审

---

## 1. 系统流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        分享功能流程                              │
└─────────────────────────────────────────────────────────────────┘

游戏结束
    │
    ▼
┌─────────────┐
│ 显示结果弹窗 │
│ (resultModal)│
└─────────────┘
    │
    ▼
┌─────────────┐     点击"再玩一次"     ┌─────────────┐
│ 用户点击    │ ──────────────────────▶ │ 重新开始游戏 │
│ 分享按钮    │                         └─────────────┘
└─────────────┘
    │
    ▼
┌─────────────┐
│ 防抖检查    │ ── 300ms内重复点击 ──▶ 忽略
└─────────────┘
    │ 通过
    ▼
┌─────────────┐     失败      ┌─────────────┐
│ Canvas截图  │ ────────────▶ │ 使用预设图片 │
└─────────────┘               └─────────────┘
    │ 成功                          │
    ▼                               │
┌─────────────┐                     │
│ 叠加分数文字 │                     │
└─────────────┘                     │
    │                               │
    ▼                               │
┌─────────────┐ ◀───────────────────┘
│ 调用微信    │
│ shareAppMessage │
└─────────────┘
    │
    ├── 分享成功 ──▶ 弹窗保持显示
    │
    └── 用户取消 ──▶ 弹窗保持显示
```

---

## 2. 模块设计

### 2.1 新增文件

```
js/game/share.js    # 分享功能模块
images/share-default.jpg  # 预设分享图片（需准备）
```

### 2.2 模块职责

| 模块 | 职责 |
|------|------|
| `share.js` | 封装分享逻辑、截图、API调用 |
| `gameinfo.js` | UI绘制、点击事件处理 |

---

## 3. 接口设计

### 3.1 share.js 模块接口

```javascript
/**
 * 分享模块
 */
export default class ShareManager {
  constructor() {
    this.lastShareTime = 0
    this.debounceDelay = 300  // 防抖延迟(ms)
    this.defaultShareImage = 'images/share-default.jpg'
  }

  /**
   * 执行分享
   * @param {Object} options
   * @param {number} options.score - 本局分数
   * @param {HTMLCanvasElement} options.canvas - 游戏Canvas
   * @param {number} options.canvasWidth - Canvas宽度
   * @param {number} options.canvasHeight - Canvas高度
   * @returns {Promise<boolean>} 分享是否成功
   */
  async share(options) { ... }

  /**
   * 生成分享截图
   * @param {HTMLCanvasElement} canvas
   * @param {number} score
   * @returns {Promise<string>} 临时文件路径
   */
  async generateShareImage(canvas, score) { ... }

  /**
   * 调用微信分享API
   * @param {string} title - 分享标题
   * @param {string} imageUrl - 分享图片路径
   */
  callWxShare(title, imageUrl) { ... }

  /**
   * 防抖检查
   * @returns {boolean} 是否可以分享
   */
  canShare() { ... }
}
```

### 3.2 gameinfo.js 修改

```javascript
// 新增导入
import ShareManager from './share'

// 构造函数中初始化
this.shareManager = new ShareManager()

// 新增分享按钮位置
this.uiPositions.resultModal.shareButton = {
  x: 0,  // 动态计算
  y: 0,  // 动态计算
  width: 200,
  height: 50
}
```

---

## 4. 代码实现细节

### 4.1 Canvas截图方案

```javascript
async generateShareImage(canvas, score) {
  return new Promise((resolve, reject) => {
    try {
      // 微信小游戏Canvas截图
      canvas.toTempFilePath({
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
        destWidth: 500,   // 分享图片宽度
        destHeight: 400,  // 分享图片高度 (5:4比例)
        fileType: 'jpg',
        quality: 0.8,
        success: (res) => {
          // 在截图上叠加分数
          this.overlayScoreOnImage(res.tempFilePath, score)
            .then(resolve)
            .catch(() => resolve(res.tempFilePath)) // 叠加失败也返回原图
        },
        fail: (err) => {
          console.warn('Canvas截图失败，使用预设图片', err)
          resolve(this.defaultShareImage)
        }
      })
    } catch (err) {
      console.warn('截图异常，使用预设图片', err)
      resolve(this.defaultShareImage)
    }
  })
}
```

### 4.2 分数叠加方案

由于微信小游戏的Canvas截图后无法直接编辑，采用以下方案：

**方案A（推荐）：截图前绘制**
- 在调用 `toTempFilePath` 前，先在Canvas上绘制分数文字
- 截图完成后恢复Canvas原状态

```javascript
async generateShareImage(canvas, score, ctx) {
  // 1. 保存当前Canvas状态
  ctx.save()
  
  // 2. 绘制分数叠加层
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height - 30)
  
  // 3. 截图
  const tempFilePath = await this.captureCanvas(canvas)
  
  // 4. 恢复Canvas状态（下一帧会重绘，无需手动恢复）
  ctx.restore()
  
  return tempFilePath
}
```

### 4.3 微信分享API调用

```javascript
callWxShare(title, imageUrl) {
  wx.shareAppMessage({
    title: title,
    imageUrl: imageUrl,
    query: ''  // 可传递参数
  })
}
```

**注意：** 微信小游戏中 `wx.shareAppMessage` 必须在用户点击事件的回调中同步调用，不能在异步回调中调用。

### 4.4 防抖处理

```javascript
canShare() {
  const now = Date.now()
  if (now - this.lastShareTime < this.debounceDelay) {
    return false
  }
  this.lastShareTime = now
  return true
}
```

---

## 5. UI修改详情

### 5.1 drawResultModal() 修改

**位置：** `js/game/gameinfo.js` 第 644-708 行

**修改内容：**

```javascript
drawResultModal(ctx, canvasWidth, canvasHeight) {
  const modalWidth = 400
  const modalHeight = 450  // 增加高度以容纳分享按钮
  const x = (canvasWidth - modalWidth) / 2
  const y = (canvasHeight - modalHeight) / 2

  // ... 现有代码 ...

  // ===== 新增：分享按钮 =====
  const shareButtonY = y + 280  // 在排名列表下方
  this.uiPositions.resultModal.shareButton = {
    x: x + 100,
    y: shareButtonY,
    width: modalWidth - 200,
    height: 50
  }

  // 分享按钮背景（绿色调）
  ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'
  ctx.fillRect(x + 100, shareButtonY, modalWidth - 200, 50)
  ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)'
  ctx.strokeRect(x + 100, shareButtonY, modalWidth - 200, 50)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('📤 分享成绩', canvasWidth / 2, shareButtonY + 30)

  // ===== 调整：再玩一次按钮位置下移 =====
  const retryButtonY = y + 350  // 原来是 y + 320
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(x + 100, retryButtonY, modalWidth - 200, 50)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.strokeRect(x + 100, retryButtonY, modalWidth - 200, 50)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('再玩一次', canvasWidth / 2, retryButtonY + 30)

  // 更新再玩一次按钮位置（用于点击检测）
  this.uiPositions.resultModal.retryButton = {
    x: x + 100,
    y: retryButtonY,
    width: modalWidth - 200,
    height: 50
  }
}
```

### 5.2 handleResultModalClick() 修改

**位置：** `js/game/gameinfo.js` 第 819-830 行

**修改内容：**

```javascript
handleResultModalClick(x, y, canvasWidth, canvasHeight) {
  if (!this.uiPositions.resultModal.visible) return null

  // 检查分享按钮点击
  const shareButton = this.uiPositions.resultModal.shareButton
  if (shareButton && this.isPointInButton(x, y, shareButton)) {
    return 'share'  // 返回分享标识
  }

  // 检查再玩一次按钮点击
  const retryButton = this.uiPositions.resultModal.retryButton
  if (retryButton && this.isPointInButton(x, y, retryButton)) {
    return 'retry'
  }

  return null
}
```

---

## 6. 事件处理集成

### 6.1 在 main.js 或 eventmanager.js 中处理分享事件

```javascript
// 处理结果弹窗点击
const result = this.gameInfo.handleResultModalClick(touchX, touchY, canvasWidth, canvasHeight)

if (result === 'share') {
  // 调用分享
  this.shareManager.share({
    score: this.gameInfo.roundWinPoints,
    canvas: this.canvas,
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    ctx: this.ctx
  })
} else if (result === 'retry') {
  // 重新开始游戏
  this.restartGame()
}
```

---

## 7. 降级方案

### 7.1 截图失败降级

```javascript
// 如果 canvas.toTempFilePath 失败
// 使用预设的静态分享图片
const fallbackImage = 'images/share-default.jpg'
```

### 7.2 预设图片规格

| 属性 | 值 |
|------|-----|
| 尺寸 | 500 x 400 px |
| 格式 | JPG |
| 内容 | 游戏Logo + "来挑战我吧！" |

---

## 8. 测试要点

| 测试项 | 验证方法 |
|--------|---------|
| 分享按钮显示 | 游戏结束后检查弹窗 |
| 点击响应 | 点击分享按钮，观察微信分享面板 |
| 截图功能 | 检查分享卡片图片是否为游戏截图 |
| 降级方案 | 模拟截图失败，检查是否使用预设图片 |
| 防抖处理 | 快速连续点击，检查是否只触发一次 |
| 取消分享 | 取消分享后弹窗是否保持 |

---

## 9. 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `js/game/share.js` | 新增 | 分享功能模块 |
| `js/game/gameinfo.js` | 修改 | UI绘制、点击处理 |
| `js/main.js` 或 `js/game/eventmanager.js` | 修改 | 事件处理集成 |
| `images/share-default.jpg` | 新增 | 预设分享图片 |

---

## 10. 伪代码汇总

### share.js 完整伪代码

```javascript
export default class ShareManager {
  constructor() {
    this.lastShareTime = 0
    this.debounceDelay = 300
    this.defaultShareImage = 'images/share-default.jpg'
  }

  canShare() {
    const now = Date.now()
    if (now - this.lastShareTime < this.debounceDelay) {
      return false
    }
    this.lastShareTime = now
    return true
  }

  async share({ score, canvas, ctx, canvasWidth, canvasHeight }) {
    // 1. 防抖检查
    if (!this.canShare()) {
      console.log('分享冷却中')
      return false
    }

    // 2. 生成分享图片
    let imageUrl
    try {
      imageUrl = await this.generateShareImage(canvas, score, ctx)
    } catch (err) {
      console.warn('生成分享图片失败', err)
      imageUrl = this.defaultShareImage
    }

    // 3. 构造分享标题
    const title = `我在多米诺骨牌中获得了 ${score} 分！来挑战我吧！`

    // 4. 调用微信分享
    this.callWxShare(title, imageUrl)

    return true
  }

  async generateShareImage(canvas, score, ctx) {
    return new Promise((resolve, reject) => {
      try {
        // 在Canvas上临时绘制分数
        ctx.save()
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80)
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 36px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`🏆 ${score} 分`, canvas.width / 2, canvas.height - 40)

        // 截图
        canvas.toTempFilePath({
          destWidth: 500,
          destHeight: 400,
          fileType: 'jpg',
          quality: 0.8,
          success: (res) => {
            ctx.restore()
            resolve(res.tempFilePath)
          },
          fail: (err) => {
            ctx.restore()
            reject(err)
          }
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  callWxShare(title, imageUrl) {
    wx.shareAppMessage({
      title: title,
      imageUrl: imageUrl,
      query: ''
    })
  }
}
```

---

## 11. 风险与缓解

| 风险 | 可能性 | 缓解措施 |
|------|--------|---------|
| `toTempFilePath` 在部分机型失败 | 中 | 使用 try-catch + 预设图片降级 |
| 分享API需同步调用 | 低 | 确保在点击事件回调中直接调用 |
| Canvas状态被污染 | 低 | 使用 ctx.save()/restore() |

---

## 12. 评审检查项

- [ ] 流程图是否完整覆盖所有分支
- [ ] 接口设计是否清晰
- [ ] 代码接入点是否准确
- [ ] 降级方案是否可行
- [ ] 测试要点是否全面

---

*文档由 AI 架构设计员生成*
