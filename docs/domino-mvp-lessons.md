# 多米诺骨牌游戏 MVP 开发经验总结

> 日期：2026-03-10  
> 版本：MVP v1.0

---

## 1. 微信小游戏触摸事件

### 1.1 必须注册三个事件

```javascript
// ❌ 错误：只注册 touchStart，拖拽无法工作
wx.onTouchStart(callback)

// ✅ 正确：完整的拖拽需要三个事件
wx.onTouchStart(this.handleTouchStart.bind(this))
wx.onTouchMove(this.handleTouchMove.bind(this))
wx.onTouchEnd(this.handleTouchEnd.bind(this))
```

### 1.2 touchEnd 使用 changedTouches

```javascript
// ❌ 错误：touchEnd 时 touches 数组为空
onTouchEnd(e) {
    const x = e.touches[0].clientX  // undefined!
}

// ✅ 正确：使用 changedTouches
onTouchEnd(e) {
    const x = e.changedTouches[0].clientX
    const y = e.changedTouches[0].clientY
}
```

### 1.3 Touch 对象属性

| 属性 | 说明 |
|------|------|
| `clientX/clientY` | 相对于可见区域的坐标（逻辑像素） |
| `pageX/pageY` | 相对于文档的坐标 |
| `identifier` | 触摸点唯一标识 |

---

## 2. 按钮点击检测

### 2.1 绘制与检测坐标必须一致

```javascript
// 绘制按钮
drawUI() {
    const btnX = canvas.width - 90
    const btnY = 105
    ctx.fillRect(btnX, btnY, 70, 35)
}

// 检测点击 - 坐标必须与绘制完全一致
checkButton(x, y) {
    const btnX = canvas.width - 90
    const btnY = 105
    return x >= btnX && x <= btnX + 70 && 
           y >= btnY && y <= btnY + 35
}
```

### 2.2 按钮优先级处理

```javascript
onTouchStart(e) {
    // 1. 弹窗优先（阻止穿透）
    if (this.showingResult) {
        this.handleResultClick(x, y)
        return
    }
    
    // 2. 重要按钮（如重置）应在状态检查之前
    if (this.checkResetButton(x, y)) {
        this.reset()
        return
    }
    
    // 3. 状态检查
    if (this.isSimulating) return
    
    // 4. 其他按钮
    if (this.checkStartButton(x, y)) { ... }
}
```

---

## 3. 游戏状态超时检测

### 3.1 问题场景

多米诺骨牌间距过大时，第一个倒下后无法触发第二个，导致游戏卡在模拟状态。

### 3.2 解决方案：静止检测 + 超时兜底

```javascript
// 配置
this.IDLE_TIMEOUT = 3000        // 静止超时(3秒)
this.MAX_SIMULATION_TIME = 15000 // 最大模拟时间(15秒)

// 开始模拟时初始化
startSimulation() {
    const now = Date.now()
    this.simulationStartTime = now
    this.lastActivityTime = now
    // ...
}

// 每帧检测
update(deltaTime) {
    const now = Date.now()
    let hasActivity = false
    
    // 检测是否有骨牌在倒下
    this.dominoes.forEach(domino => {
        if (domino.falling) {
            hasActivity = true
            // 更新动画...
        }
    })
    
    // 更新活动时间
    if (hasActivity) {
        this.lastActivityTime = now
    }
    
    // 检查结束条件
    if (allFallen) {
        this.endGame()  // 正常结束
    } else if (now - this.lastActivityTime > this.IDLE_TIMEOUT) {
        this.endGame()  // 静止超时
    } else if (now - this.simulationStartTime > this.MAX_SIMULATION_TIME) {
        this.endGame()  // 总超时兜底
    }
}
```

### 3.3 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 纯超时 | 简单 | 不够智能 | 简单游戏 |
| 纯静止检测 | 精确 | 可能遗漏边缘情况 | 物理模拟 |
| **组合方案** | 可靠 | 代码稍多 | **推荐** |

---

## 4. 事件管理器设计

### 4.1 子游戏事件转发

```javascript
class EventManager {
    init() {
        wx.onTouchStart(this.handleTouchStart.bind(this))
        wx.onTouchMove(this.handleTouchMove.bind(this))
        wx.onTouchEnd(this.handleTouchEnd.bind(this))
    }
    
    handleTouchStart(e) {
        // 子游戏优先处理
        if (this.subGame?.onTouchStart) {
            this.subGame.onTouchStart(e)
            return
        }
        // 主游戏逻辑...
    }
    
    handleTouchMove(e) {
        if (this.subGame?.onTouchMove) {
            this.subGame.onTouchMove(e)
        }
    }
    
    handleTouchEnd(e) {
        if (this.subGame?.onTouchEnd) {
            this.subGame.onTouchEnd(e)
        }
    }
}
```

---

## 5. MVP 简化原则

### 5.1 删除的复杂功能

- ❌ 相机缩放/平移
- ❌ 多种骨牌类型
- ❌ 复杂物理模拟
- ❌ 障碍物/关卡系统
- ❌ 道具系统

### 5.2 保留的核心功能

- ✅ 拖拽放置骨牌
- ✅ 简单倒下动画
- ✅ 开始/重置按钮
- ✅ 结果弹窗 + 分享

### 5.3 代码量对比

| 版本 | 代码行数 | 复杂度 |
|------|----------|--------|
| 原版 | ~1900行 | 高 |
| MVP | ~500行 | 低 |
| **减少** | **74%** | - |

---

## 6. 调试技巧

### 6.1 添加日志

```javascript
// 关键状态变化时输出日志
console.log('静止超时，结束游戏')
console.log('模拟超时，强制结束')
```

### 6.2 真机调试

1. 微信开发者工具 → 预览
2. 手机扫码进入
3. 右上角 → 打开调试 → vConsole
4. 查看 console 输出

---

## 7. 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 拖拽不工作 | 缺少 touchMove/touchEnd | 注册完整事件 |
| 按钮点不到 | 坐标不一致或被状态阻止 | 检查绘制/检测坐标，调整优先级 |
| 游戏卡住 | 无超时检测 | 添加静止+超时检测 |
| touchEnd 坐标错误 | 使用 touches 而非 changedTouches | 改用 changedTouches |

---

## 8. 后续优化方向

1. **视觉反馈**：按钮按下效果、骨牌放置动画
2. **音效**：骨牌倒下声音
3. **关卡系统**：预设骨牌布局
4. **成就系统**：连锁数记录
5. **社交功能**：排行榜、挑战好友
