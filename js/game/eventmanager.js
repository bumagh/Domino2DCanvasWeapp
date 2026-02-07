// game/eventmanager.js
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

/**
 * 游戏事件管理器
 * 负责处理所有UI交互和游戏事件
 */
export default class EventManager {
    constructor(mainInstance) {
        this.main = mainInstance.main; // 主游戏实例引用
        this.canvas = mainInstance.canvas; // canvas元素
        this.databus = mainInstance.databus; // 数据总线
        this.gameInfo = mainInstance.gameInfo; // 游戏UI实例
        this.camera = mainInstance.camera; // 相机实例
        this.guide = mainInstance.guide; // 新手引导实例
        this.menu = mainInstance.menu; // 菜单实例

        // 子游戏（可选）
        this.subGame = null

        // 绑定方法的this上下文
        this.touchStartHandler = this.handleTouchStart.bind(this)
    }

    setSubGame(subGameInstance) {
        this.subGame = subGameInstance
    }

    /**
     * 初始化事件监听
     */
    init() {
        // 移除旧的事件监听器（如果有）
        wx.offTouchStart();

        // 只注册一次，并确保回调 this 已绑定
        wx.onTouchStart(this.touchStartHandler)

        console.log('事件管理器初始化完成');
    }

    /**
     * 处理触摸开始事件
     */
    handleTouchStart(e) {
        // 子游戏优先处理触摸
        if (this.subGame && typeof this.subGame.onTouchStart === 'function') {
            this.subGame.onTouchStart(e)
            return
        }

        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;

        // 如果引导正在显示，优先处理引导点击
        if (this.guide && this.guide.isActive) {
            this.handleGuideClick(x, y);
            return;
        }

        // 处理菜单触摸事件（优先级最高）
        if (this.menu && this.databus.gameState === 'menu') {
            const menuAction = this.menu.handleClick(x, y);
            if (menuAction) {
                this.handleMenuAction(menuAction);
                return;
            }

            // 更新菜单悬停状态
            this.menu.handleMouseMove(x, y);
            return;
        }

        // 处理UI按钮点击
        if (this.gameInfo.handleMenuButtonClick(x, y)) {
            // this.toggleMenuModal();
            return;
        }
        
        if (this.gameInfo.handleStartGameButtonClick(x, y) && (this.databus.gameState === 'idle' || this.guide.getCurrentStep().id === 3)) {
            this.main.startBetting();
            return;
        }
        
        if (this.gameInfo.handleDominoChainGameButtonClick(x, y) && (this.databus.gameState === 'idle')) {
            // 启动多米诺连锁游戏
            this.main.startDominoChainGame();
            return;
        }

        // 处理菜单弹窗点击
        if (this.gameInfo.uiPositions.menuModal.visible) {
            const menuAction = this.gameInfo.handleMenuModalClick(x, y);
            if (menuAction) {
                this.handleButtonAction(menuAction);
                return;
            }
        }

        // 处理助力弹窗点击
        if (this.gameInfo.uiPositions.betModal.visible) {
            const betAction = this.gameInfo.handleBetModalClick(x, y, SCREEN_WIDTH, SCREEN_HEIGHT);
            if (betAction) {
                this.handleBetAction(betAction);
                return;
            }
        }

        // 处理帮助弹窗点击
        if (this.gameInfo.uiPositions.helpModal.visible) {
            if (this.isPointInHelpModalClose(x, y)) {
                this.gameInfo.uiPositions.helpModal.visible = false;
            }
            return;
        }

        // 处理结果弹窗点击
        if (this.gameInfo.uiPositions.resultModal.visible) {
            if (this.isPointInResultModalButton(x, y)) {
                this.main.restartGame();
            }
            return;
        }

        // 处理滚珠选择
        if (this.databus.gameState === 'idle' || this.databus.gameState === 'betting') {
            this.handleBallSelection(x, y);
        }
    }

    /**
     * 处理引导期间的点击
     */
    handleGuideClick(x, y) {
        // 检查是否点击了引导的下一步按钮
        if (this.guide.isPointInGuideButton(x, y)) {
            const step = this.guide.getCurrentStep();

            // 特殊处理最后一步
            if (step.id === 5) {
                this.guide.complete();
                return;
            }

            this.guide.next();
            return;
        }

        // 根据当前引导步骤处理其他点击
        const step = this.guide.getCurrentStep();

        switch (step.id) {
            case 1: // 欢迎界面，点击任意位置继续
                this.guide.next();
                return;

            case 2: // 选择滚珠
                this.handleGuideBallSelection(x, y);
                return;

            case 3: // 点击菜单按钮
                this.handleGuideStartGameClick(x, y);
                return;

            case 4: // 点击开始按钮
                // this.handleGuideStartGameClick(x, y);
                return;

            case 5: // 助力选择弹窗
                // 这里不处理点击，等弹窗自动显示后引导下一步
                return;
        }

        // 引导期间阻止其他操作
        return;
    }

    /**
     * 引导期间的滚珠选择
     */
    handleGuideBallSelection(x, y) {
        const worldY = this.camera ? y + this.camera.offsetY : y;
        let ballClicked = false;

        this.databus.balls.forEach(ball => {
            if (ball.isPointInside(x, worldY)) {
                this.databus.selectedBall = ball;
                ball.selected = true;
                ballClicked = true;

                // 滚珠选择完成，进入下一步
                setTimeout(() => {
                    this.guide.next();
                }, 300);
            } else {
                ball.selected = false;
            }
        });

        if (ballClicked) return;
    }

    /**
     * 引导期间的菜单点击
     */
    handleGuideMenuClick(x, y) {
        if (this.gameInfo.handleMenuButtonClick(x, y)) {
            this.toggleMenuModal();

            // 菜单打开后，进入下一步
            setTimeout(() => {
                this.guide.next();
            }, 300);
            return;
        }
    }

    /**
     * 引导期间的快速开始游戏按钮点击
     */
    handleGuideStartGameClick(x, y) {
        if (this.gameInfo.handleStartGameButtonClick(x, y) && this.databus.gameState === 'idle') {
            this.main.startBetting();

            // 菜单打开后，进入下一步
            setTimeout(() => {
                this.guide.next();
            }, 300);
            return;
        }
    }

    /**
     * 处理滚珠选择
     */
    handleBallSelection(x, y) {
        const worldY = y + (this.camera ? this.camera.offsetY : 0);

        // 检查是否点击了滚珠
        let clickedBall = null;
        this.databus.balls.forEach(ball => {
            if (ball.isPointInside(x, worldY)) {
                clickedBall = ball;
            }
        });

        // 如果点击了滚珠
        if (clickedBall) {
            // 如果点击的是已经选中的滚珠，不执行任何操作（保持选中）
            if (this.databus.selectedBall && this.databus.selectedBall.id === clickedBall.id) {
                console.log('重复点击已选中的滚珠:', clickedBall.id);
                return;
            }

            // 取消之前选中的滚珠
            this.databus.balls.forEach(ball => {
                ball.selected = false;
            });

            // 设置新选中的滚珠
            this.databus.selectedBall = clickedBall;
            clickedBall.selected = true;
        }
    }

    /**
     * 判断点是否在帮助弹窗关闭按钮内
     */
    isPointInHelpModalClose(x, y) {
        const modalWidth = 400
        const modalHeight = 320
        const modalX = (this.canvas.width - modalWidth) / 2
        const modalY = (this.canvas.height - modalHeight) / 2

        return x >= modalX + 100 && x <= modalX + 300 &&
            y >= modalY + 240 && y <= modalY + 280
    }

    /**
     * 判断点是否在结果弹窗按钮内
     */
    isPointInResultModalButton(x, y) {
        const modalWidth = 400
        const modalHeight = 400
        const modalX = (this.canvas.width - modalWidth) / 2
        const modalY = (this.canvas.height - modalHeight) / 2

        return x >= modalX + 100 && x <= modalX + 300 &&
            y >= modalY + 320 && y <= modalY + 370
    }

    /**
     * 处理菜单动作
     */
    handleMenuAction(action) {
        console.log('处理菜单动作:', action);

        switch (action) {
            case 'startGame':
                // 启动多米诺连锁游戏
                this.main.startDominoChainGame();
                break;
            case 'restart':
                this.main.restartGame();
                break;
            case 'closeMenu':
                this.toggleMenuModal();
                break;
            case 'pause':
                this.main.togglePause();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'claim':
                this.claimPoints();
                break;
        }
    }

    /**
     * 处理助力动作
     */
    handleBetAction(action) {
        console.log('处理助力动作:', action);

        switch (action.type) {
            case 'bet':
                this.databus.betAmount = action.amount;
                this.gameInfo.betAmount = action.amount;
                this.databus.gameState = 'betting';
                this.databus.selectedBall.hasBet = true;
                this.databus.selectedBall.betAmount = action.amount;
                break;
            case 'cancel':
                this.databus.gameState = 'idle';
                break;
        }
    }

    /**
     * 切换菜单弹窗
     */
    toggleMenuModal() {
        this.gameInfo.uiPositions.menuModal.visible = !this.gameInfo.uiPositions.menuModal.visible;
    }

    /**
     * 显示帮助
     */
    showHelp() {
        this.gameInfo.uiPositions.helpModal.visible = true;
    }

    /**
     * 领取积分
     */
    claimPoints() {
        const points = this.gameInfo.claimablePoints;
        if (points > 0) {
            this.databus.score += points;
            this.gameInfo.score = this.databus.score;
            this.gameInfo.totalClaimedPoints += points;
            this.gameInfo.claimablePoints = 0;

            wx.showToast({
                title: `成功领取${points}积分`,
                icon: 'success',
                duration: 2000
            });
        }
    }
}
