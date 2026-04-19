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
    PORTAL: 'portal',       // 传送门 - 传送骨牌
    TRIANGLE: 'triangle',   // 三角形障碍 - 反弹骨牌
    CIRCLE: 'circle',       // 圆形障碍 - 绕行
    MOVING: 'moving',       // 移动障碍 - 动态阻挡
    FAN: 'fan',             // 风扇 - 吹动骨牌
    ICE: 'ice',             // 冰面 - 加速骨牌
    SLOW: 'slow'            // 泥沼 - 减速骨牌
}

// 道具类型
export const PowerUpTypes = {
    BOMB: 'bomb',           // 炸弹骨牌 - 推倒范围更大
    GIANT: 'giant',         // 巨型骨牌 - 更高更重
    CHAIN: 'chain',         // 连锁骨牌 - 自动连接
    MAGNET: 'magnet',       // 磁力骨牌 - 吸引附近骨牌
    FREEZE: 'freeze',       // 冰冻骨牌 - 冻结时间
    FIRE: 'fire',           // 火焰骨牌 - 燃烧效果
    TIME: 'time',           // 时间骨牌 - 延长倒计时
    SHIELD: 'shield'        // 护盾骨牌 - 保护骨牌
}

// 玩法类型
export const GameModeTypes = {
    NORMAL: 'normal',       // 普通模式 - 无限制
    TIME_LIMIT: 'time',     // 限时模式 - 时间限制
    DOMINO_LIMIT: 'limit',  // 限量模式 - 骨牌数量限制
    TARGET: 'target',       // 目标模式 - 击中特定目标
    SURVIVAL: 'survival'    // 生存模式 - 连续挑战
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
    },

    // ========== 第五章：新障碍物 ==========
    {
        id: 11,
        chapter: 5,
        name: '三角反弹',
        description: '三角形障碍会让骨牌反弹',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 15,
            bonus: [18, 22]
        },
        dominoes: {
            normal: 15,
            tall: 5,
            wide: 5,
            heavy: 3
        },
        preset: [],
        obstacles: [
            { type: 'triangle', x: 200, size: 40, angle: 45 }
        ],
        powerUps: [],
        hints: ['三角形会改变骨牌的倒向']
    },
    {
        id: 12,
        chapter: 5,
        name: '圆形迷宫',
        description: '绕过圆形障碍物',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 18,
            bonus: [22, 25]
        },
        dominoes: {
            normal: 18,
            tall: 8,
            wide: 4,
            heavy: 2
        },
        preset: [],
        obstacles: [
            { type: 'circle', x: 250, radius: 30 }
        ],
        powerUps: [],
        hints: ['圆形障碍需要绕行']
    },
    {
        id: 13,
        chapter: 5,
        name: '移动墙壁',
        description: '墙壁会移动，把握时机',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 20,
            bonus: [25, 28]
        },
        dominoes: {
            normal: 20,
            tall: 8,
            wide: 4,
            heavy: 4
        },
        preset: [],
        obstacles: [
            { type: 'moving', x: 200, width: 30, speed: 2, range: 100 }
        ],
        powerUps: [
            { type: 'time', count: 1 }
        ],
        hints: ['观察移动规律，选择合适时机']
    },
    {
        id: 14,
        chapter: 5,
        name: '风扇助力',
        description: '风扇可以吹动骨牌',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 16,
            bonus: [20, 24]
        },
        dominoes: {
            normal: 16,
            tall: 6,
            wide: 4,
            heavy: 2
        },
        preset: [],
        obstacles: [
            { type: 'fan', x: 200, direction: 'right', power: 1.5 }
        ],
        powerUps: [],
        hints: ['风扇可以跨越更远的距离']
    },
    {
        id: 15,
        chapter: 5,
        name: '冰面加速',
        description: '冰面会让骨牌加速',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        target: {
            type: 'chain',
            value: 22,
            bonus: [26, 30]
        },
        dominoes: {
            normal: 22,
            tall: 8,
            wide: 4,
            heavy: 2
        },
        preset: [],
        obstacles: [
            { type: 'ice', x: 150, width: 100 }
        ],
        powerUps: [
            { type: 'chain', count: 1 }
        ],
        hints: ['冰面上骨牌倒得更快']
    },

    // ========== 第六章：限时挑战 ==========
    {
        id: 16,
        chapter: 6,
        name: '30秒挑战',
        description: '在30秒内完成关卡',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        mode: 'time',
        timeLimit: 30,
        target: {
            type: 'chain',
            value: 15,
            bonus: [18, 20]
        },
        dominoes: {
            normal: 15,
            tall: 5,
            wide: 3,
            heavy: 2
        },
        preset: [],
        obstacles: [],
        powerUps: [
            { type: 'time', count: 1 }
        ],
        hints: ['快速放置骨牌', '优先完成基本目标']
    },
    {
        id: 17,
        chapter: 6,
        name: '60秒挑战',
        description: '在60秒内完成更复杂关卡',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'time',
        timeLimit: 60,
        target: {
            type: 'chain',
            value: 20,
            bonus: [25, 28]
        },
        dominoes: {
            normal: 20,
            tall: 8,
            wide: 5,
            heavy: 3
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 200, y: 0, width: 15, height: 60 }
        ],
        powerUps: [
            { type: 'bomb', count: 1 },
            { type: 'time', count: 1 }
        ],
        hints: ['合理利用道具节省时间']
    },
    {
        id: 18,
        chapter: 6,
        name: '极限速度',
        description: '90秒完成复杂关卡',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'time',
        timeLimit: 90,
        target: {
            type: 'chain',
            value: 25,
            bonus: [30, 35]
        },
        dominoes: {
            normal: 25,
            tall: 10,
            wide: 6,
            heavy: 4
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 150, y: 0, width: 15, height: 50 },
            { type: 'pit', x: 300, width: 40 },
            { type: 'portal', x1: 400, x2: 100, color: '#3498db' }
        ],
        powerUps: [
            { type: 'chain', count: 1 },
            { type: 'time', count: 1 }
        ],
        hints: ['熟悉障碍物特性可节省时间']
    },

    // ========== 第七章：限量挑战 ==========
    {
        id: 19,
        chapter: 7,
        name: '限量10',
        description: '只能使用10个骨牌',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        mode: 'limit',
        dominoLimit: 10,
        target: {
            type: 'chain',
            value: 10,
            bonus: [10, 10]
        },
        dominoes: {
            normal: 10,
            tall: 0,
            wide: 0,
            heavy: 0
        },
        preset: [],
        obstacles: [],
        powerUps: [],
        hints: ['每个骨牌都很重要']
    },
    {
        id: 20,
        chapter: 7,
        name: '限量15',
        description: '只能使用15个骨牌完成目标',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        mode: 'limit',
        dominoLimit: 15,
        target: {
            type: 'chain',
            value: 15,
            bonus: [15, 15]
        },
        dominoes: {
            normal: 12,
            tall: 3,
            wide: 0,
            heavy: 0
        },
        preset: [],
        obstacles: [
            { type: 'pit', x: 200, width: 40 }
        ],
        powerUps: [
            { type: 'giant', count: 1 }
        ],
        hints: ['使用高型骨牌跨越障碍']
    },
    {
        id: 21,
        chapter: 7,
        name: '限量20',
        description: '20个骨牌的极限挑战',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'limit',
        dominoLimit: 20,
        target: {
            type: 'chain',
            value: 20,
            bonus: [20, 20]
        },
        dominoes: {
            normal: 15,
            tall: 3,
            wide: 2,
            heavy: 0
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 180, y: 0, width: 15, height: 60 },
            { type: 'pit', x: 300, width: 50 }
        ],
        powerUps: [
            { type: 'chain', count: 1 }
        ],
        hints: ['合理规划骨牌位置']
    },

    // ========== 第八章：目标模式 ==========
    {
        id: 22,
        chapter: 8,
        name: '击中目标',
        description: '让骨牌击中目标区域',
        difficulty: 4,
        stars: 0,
        unlocked: false,
        mode: 'target',
        target: {
            type: 'target',
            value: 3,
            bonus: [4, 5]
        },
        targets: [
            { x: 350, y: 300, radius: 30 }
        ],
        dominoes: {
            normal: 15,
            tall: 5,
            wide: 3,
            heavy: 2
        },
        preset: [],
        obstacles: [],
        powerUps: [
            { type: 'bomb', count: 1 }
        ],
        hints: ['目标区域需要骨牌倒下击中']
    },
    {
        id: 23,
        chapter: 8,
        name: '多目标',
        description: '击中多个目标区域',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'target',
        target: {
            type: 'target',
            value: 5,
            bonus: [6, 7]
        },
        targets: [
            { x: 200, y: 250, radius: 25 },
            { x: 350, y: 350, radius: 25 },
            { x: 100, y: 400, radius: 25 }
        ],
        dominoes: {
            normal: 20,
            tall: 8,
            wide: 4,
            heavy: 3
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 250, y: 0, width: 15, height: 70 }
        ],
        powerUps: [
            { type: 'bomb', count: 1 },
            { type: 'giant', count: 1 }
        ],
        hints: ['规划路径击中所有目标']
    },
    {
        id: 24,
        chapter: 8,
        name: '精确打击',
        description: '精确击中目标',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'target',
        target: {
            type: 'target',
            value: 4,
            bonus: [5, 6]
        },
        targets: [
            { x: 300, y: 320, radius: 20 }
        ],
        dominoes: {
            normal: 12,
            tall: 4,
            wide: 2,
            heavy: 2
        },
        preset: [],
        obstacles: [
            { type: 'pit', x: 220, width: 40 },
            { type: 'pit', x: 340, width: 40 }
        ],
        powerUps: [
            { type: 'chain', count: 1 }
        ],
        hints: ['精确计算骨牌倒下角度']
    },

    // ========== 第九章：组合挑战 ==========
    {
        id: 25,
        chapter: 9,
        name: '限时限量',
        description: '限时且限量的组合挑战',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'time_limit',
        timeLimit: 60,
        dominoLimit: 15,
        target: {
            type: 'chain',
            value: 15,
            bonus: [15, 15]
        },
        dominoes: {
            normal: 15,
            tall: 0,
            wide: 0,
            heavy: 0
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 200, y: 0, width: 15, height: 50 }
        ],
        powerUps: [
            { type: 'time', count: 1 }
        ],
        hints: ['快速且高效地完成']
    },
    {
        id: 26,
        chapter: 9,
        name: '障碍+限时',
        description: '复杂障碍下的限时挑战',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'time',
        timeLimit: 90,
        target: {
            type: 'chain',
            value: 20,
            bonus: [25, 28]
        },
        dominoes: {
            normal: 20,
            tall: 6,
            wide: 4,
            heavy: 3
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 150, y: 0, width: 15, height: 60 },
            { type: 'pit', x: 280, width: 40 },
            { type: 'triangle', x: 350, size: 35, angle: 60 }
        ],
        powerUps: [
            { type: 'bomb', count: 1 },
            { type: 'time', count: 1 }
        ],
        hints: ['利用三角形反弹绕过障碍']
    },
    {
        id: 27,
        chapter: 9,
        name: '目标+限量',
        description: '限量骨牌击中目标',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'limit_target',
        dominoLimit: 18,
        target: {
            type: 'target',
            value: 3,
            bonus: [4, 5]
        },
        targets: [
            { x: 320, y: 300, radius: 25 }
        ],
        dominoes: {
            normal: 18,
            tall: 5,
            wide: 3,
            heavy: 2
        },
        preset: [],
        obstacles: [
            { type: 'circle', x: 200, radius: 30 }
        ],
        powerUps: [
            { type: 'chain', count: 1 }
        ],
        hints: ['用最少的骨牌击中目标']
    },

    // ========== 第十章：终极挑战 ==========
    {
        id: 28,
        chapter: 10,
        name: '全能挑战',
        description: '综合运用所有机制',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'normal',
        target: {
            type: 'chain',
            value: 30,
            bonus: [35, 40]
        },
        dominoes: {
            normal: 25,
            tall: 12,
            wide: 8,
            heavy: 6
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 120, y: 0, width: 15, height: 60 },
            { type: 'pit', x: 220, width: 40 },
            { type: 'spring', x: 320, power: 1.5 },
            { type: 'portal', x1: 420, x2: 80, color: '#9b59b6' },
            { type: 'triangle', x: 500, size: 40, angle: 45 }
        ],
        powerUps: [
            { type: 'bomb', count: 2 },
            { type: 'giant', count: 1 },
            { type: 'chain', count: 1 }
        ],
        hints: ['综合运用所有技巧', '合理规划路径']
    },
    {
        id: 29,
        chapter: 10,
        name: '限时全能',
        description: '120秒完成全能挑战',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'time',
        timeLimit: 120,
        target: {
            type: 'chain',
            value: 28,
            bonus: [32, 36]
        },
        dominoes: {
            normal: 22,
            tall: 10,
            wide: 6,
            heavy: 5
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 140, y: 0, width: 15, height: 55 },
            { type: 'pit', x: 240, width: 35 },
            { type: 'fan', x: 350, direction: 'right', power: 1.3 },
            { type: 'portal', x1: 400, x2: 100, color: '#e67e22' }
        ],
        powerUps: [
            { type: 'bomb', count: 1 },
            { type: 'time', count: 1 },
            { type: 'chain', count: 1 }
        ],
        hints: ['时间紧张，快速决策']
    },
    {
        id: 30,
        chapter: 10,
        name: '终极考验',
        description: '游戏的终极挑战',
        difficulty: 5,
        stars: 0,
        unlocked: false,
        mode: 'normal',
        target: {
            type: 'chain',
            value: 40,
            bonus: [45, 50]
        },
        dominoes: {
            normal: 30,
            tall: 15,
            wide: 10,
            heavy: 8
        },
        preset: [],
        obstacles: [
            { type: 'wall', x: 100, y: 0, width: 15, height: 65 },
            { type: 'wall', x: 300, y: 0, width: 15, height: 65 },
            { type: 'pit', x: 200, width: 50 },
            { type: 'spring', x: 280, power: 1.8 },
            { type: 'portal', x1: 380, x2: 50, color: '#e74c3c' },
            { type: 'triangle', x: 450, size: 45, angle: 30 },
            { type: 'circle', x: 150, radius: 35 }
        ],
        powerUps: [
            { type: 'bomb', count: 2 },
            { type: 'giant', count: 2 },
            { type: 'chain', count: 1 },
            { type: 'magnet', count: 1 }
        ],
        hints: ['这是终极考验，全力以赴']
    }
]

// 章节信息
export const Chapters = [
    { id: 1, name: '入门教程', levels: [1, 2, 3], unlocked: true },
    { id: 2, name: '障碍挑战', levels: [4, 5, 6], unlocked: false },
    { id: 3, name: '高级技巧', levels: [7, 8, 9], unlocked: false },
    { id: 4, name: '大师挑战', levels: [10], unlocked: false },
    { id: 5, name: '新障碍物', levels: [11, 12, 13, 14, 15], unlocked: false },
    { id: 6, name: '限时挑战', levels: [16, 17, 18], unlocked: false },
    { id: 7, name: '限量挑战', levels: [19, 20, 21], unlocked: false },
    { id: 8, name: '目标模式', levels: [22, 23, 24], unlocked: false },
    { id: 9, name: '组合挑战', levels: [25, 26, 27], unlocked: false },
    { id: 10, name: '终极挑战', levels: [28, 29, 30], unlocked: false }
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
