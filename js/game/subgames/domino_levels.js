/**
 * 多米诺骨牌关卡数据
 * 包含关卡配置、目标、障碍物、道具等
 */

// 障碍物类型
export const ObstacleTypes = {
    WALL: 'wall',           // 墙壁 - 阻挡骨牌
    PIT: 'pit',             // 坑洞 - 骨牌掉落消失
    RAMP: 'ramp',           // 斜坡 - 改变骨牌方向
    SPRING: 'spring',       // 弹簧 - 弹起骨牌
    PORTAL: 'portal'        // 传送门 - 传送骨牌
}

// 道具类型
export const PowerUpTypes = {
    BOMB: 'bomb',           // 炸弹骨牌 - 推倒范围更大
    GIANT: 'giant',         // 巨型骨牌 - 更高更重
    CHAIN: 'chain',         // 连锁骨牌 - 自动连接
    MAGNET: 'magnet'        // 磁力骨牌 - 吸引附近骨牌
}

// 关卡数据
export const Levels = [
    // ========== 第一章：入门 ==========
    {
        id: 1,
        chapter: 1,
        name: '初次尝试',
        description: '放置骨牌，推倒它们！',
        difficulty: 1,
        stars: 0,
        unlocked: true,
        // 目标
        target: {
            type: 'chain',      // 连锁数目标
            value: 5,           // 需要连锁5个
            bonus: [8, 10]      // 2星/3星目标
        },
        // 骨牌配置
        dominoes: {
            normal: 8,
            tall: 0,
            wide: 0,
            heavy: 0
        },
        // 预置骨牌（关卡开始时已有的骨牌）
        preset: [],
        // 障碍物
        obstacles: [],
        // 道具
        powerUps: [],
        // 提示
        hints: ['将骨牌放置在一条直线上', '骨牌间距不要太远']
    },
    {
        id: 2,
        chapter: 1,
        name: '间距控制',
        description: '学会控制骨牌间距',
        difficulty: 1,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 8,
            bonus: [10, 12]
        },
        dominoes: {
            normal: 15,
            tall: 0,
            wide: 0,
            heavy: 0
        },
        preset: [],
        obstacles: [],
        powerUps: [],
        hints: ['骨牌间距约30-40像素最佳']
    },
    {
        id: 3,
        chapter: 1,
        name: '高型骨牌',
        description: '使用高型骨牌跨越更远距离',
        difficulty: 2,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 10,
            bonus: [12, 15]
        },
        dominoes: {
            normal: 5,
            tall: 8,
            wide: 0,
            heavy: 0
        },
        preset: [],
        obstacles: [],
        powerUps: [],
        hints: ['高型骨牌可以推倒更远的骨牌']
    },
    
    // ========== 第二章：障碍挑战 ==========
    {
        id: 4,
        chapter: 2,
        name: '绕过障碍',
        description: '墙壁会阻挡骨牌',
        difficulty: 2,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 8,
            bonus: [10, 12]
        },
        dominoes: {
            normal: 10,
            tall: 5,
            wide: 0,
            heavy: 0
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 200, y: 0, width: 20, height: 100 }
        ],
        powerUps: [],
        hints: ['在墙壁两侧分别放置骨牌']
    },
    {
        id: 5,
        chapter: 2,
        name: '危险的坑',
        description: '骨牌掉入坑中会消失',
        difficulty: 2,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 10,
            bonus: [12, 15]
        },
        dominoes: {
            normal: 12,
            tall: 3,
            wide: 3,
            heavy: 0
        },
        preset: [],
        obstacles: [
            { type: 'pit', x: 180, width: 60 }
        ],
        powerUps: [],
        hints: ['用高型骨牌跨越坑洞']
    },
    {
        id: 6,
        chapter: 2,
        name: '弹簧助力',
        description: '弹簧可以弹起骨牌',
        difficulty: 3,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 12,
            bonus: [15, 18]
        },
        dominoes: {
            normal: 10,
            tall: 5,
            wide: 0,
            heavy: 3
        },
        preset: [],
        obstacles: [
            { type: 'spring', x: 250, power: 1.5 }
        ],
        powerUps: [],
        hints: ['重型骨牌在弹簧上效果更好']
    },
    
    // ========== 第三章：高级技巧 ==========
    {
        id: 7,
        chapter: 3,
        name: '分叉路径',
        description: '一个骨牌推倒两排',
        difficulty: 3,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 15,
            bonus: [18, 20]
        },
        dominoes: {
            normal: 15,
            tall: 5,
            wide: 5,
            heavy: 0
        },
        preset: [
            // 预置一个宽型骨牌作为分叉点
            { x: 100, type: 'wide' }
        ],
        obstacles: [],
        powerUps: [],
        hints: ['宽型骨牌可以同时推倒两侧的骨牌']
    },
    {
        id: 8,
        chapter: 3,
        name: '传送门',
        description: '骨牌可以穿越传送门',
        difficulty: 3,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 12,
            bonus: [15, 18]
        },
        dominoes: {
            normal: 10,
            tall: 5,
            wide: 0,
            heavy: 3
        },
        preset: [],
        obstacles: [
            { type: 'portal', x1: 150, x2: 350, color: '#9b59b6' }
        ],
        powerUps: [],
        hints: ['骨牌倒向传送门会从另一端出现']
    },
    {
        id: 9,
        chapter: 3,
        name: '炸弹骨牌',
        description: '炸弹骨牌推倒范围更大',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 18,
            bonus: [22, 25]
        },
        dominoes: {
            normal: 15,
            tall: 5,
            wide: 3,
            heavy: 2
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 200, y: 0, width: 20, height: 80 },
            { type: 'wall', x: 350, y: 0, width: 20, height: 80 }
        ],
        powerUps: [
            { type: 'bomb', count: 2 }
        ],
        hints: ['炸弹骨牌可以推倒墙后的骨牌']
    },
    
    // ========== 第四章：大师挑战 ==========
    {
        id: 10,
        chapter: 4,
        name: '终极挑战',
        description: '综合运用所有技巧',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 25,
            bonus: [30, 35]
        },
        dominoes: {
            normal: 20,
            tall: 10,
            wide: 5,
            heavy: 5
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 150, y: 0, width: 15, height: 70 },
            { type: 'pit', x: 280, width: 50 },
            { type: 'spring', x: 400, power: 1.8 },
            { type: 'portal', x1: 500, x2: 100, color: '#e74c3c' }
        ],
        powerUps: [
            { type: 'bomb', count: 1 },
            { type: 'giant', count: 1 }
        ],
        hints: ['合理规划路径', '善用道具和障碍物特性']
    }
]

// 章节信息
export const Chapters = [
    { id: 1, name: '入门教程', levels: [1, 2, 3], unlocked: true },
    { id: 2, name: '障碍挑战', levels: [4, 5, 6], unlocked: false },
    { id: 3, name: '高级技巧', levels: [7, 8, 9], unlocked: false },
    { id: 4, name: '大师挑战', levels: [10], unlocked: false }
]

// 获取关卡数据
export function getLevel(id) {
    return Levels.find(l => l.id === id)
}

// 获取章节数据
export function getChapter(id) {
    return Chapters.find(c => c.id === id)
}

// 计算星级
export function calculateStars(chainCount, target) {
    if (chainCount >= target.bonus[1]) return 3
    if (chainCount >= target.bonus[0]) return 2
    if (chainCount >= target.value) return 1
    return 0
}

// 解锁下一关
export function unlockNextLevel(currentId) {
    const nextLevel = Levels.find(l => l.id === currentId + 1)
    if (nextLevel) {
        nextLevel.unlocked = true
        // 检查是否解锁新章节
        const chapter = Chapters.find(c => c.levels.includes(nextLevel.id))
        if (chapter && !chapter.unlocked) {
            chapter.unlocked = true
        }
    }
}

// 保存进度到本地存储
export function saveProgress() {
    const progress = {
        levels: Levels.map(l => ({ id: l.id, stars: l.stars, unlocked: l.unlocked })),
        chapters: Chapters.map(c => ({ id: c.id, unlocked: c.unlocked }))
    }
    try {
        wx.setStorageSync('domino_progress', JSON.stringify(progress))
    } catch (e) {
        console.error('保存进度失败:', e)
    }
}

// 加载进度
export function loadProgress() {
    try {
        const data = wx.getStorageSync('domino_progress')
        if (data) {
            const progress = JSON.parse(data)
            progress.levels.forEach(saved => {
                const level = Levels.find(l => l.id === saved.id)
                if (level) {
                    level.stars = saved.stars
                    level.unlocked = saved.unlocked
                }
            })
            progress.chapters.forEach(saved => {
                const chapter = Chapters.find(c => c.id === saved.id)
                if (chapter) {
                    chapter.unlocked = saved.unlocked
                }
            })
        }
    } catch (e) {
        console.error('加载进度失败:', e)
    }
}
