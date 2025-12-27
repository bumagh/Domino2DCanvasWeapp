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

        // 子游戏（可选）
        this.subGame = null

        // 绑定方法的this上下文
        // this.handleTouchStart = this.handleTouchStart.bind(this);
        // ... 原有代码 ...
        this.videoAd = null // 激励视频广告实例
        this.interstitialAd = null
        this.touchStartHandler = this.handleTouchStart.bind(this) // 绑定this
        // 定义插屏广告


    }

    /**
     * 初始化事件监听
     */
    init () {
        // 移除旧的事件监听器（如果有）
        wx.offTouchStart();

        // 只注册一次，并确保回调 this 已绑定
        wx.onTouchStart(this.touchStartHandler)

        console.log('事件管理器初始化完成');
        // 初始化激励视频广告
        this.initRewardedVideoAd()
        this.initInterstitialAd()
    }
    initInterstitialAd () {
        // 创建插屏广告实例，提前初始化
        if (wx.createInterstitialAd) {
            this.interstitialAd = wx.createInterstitialAd({
                adUnitId: 'adunit-fcad3142b45b5aa6'
            })
            this.interstitialAd.onLoad(() => {
                console.log('插屏 广告加载成功')
            })
            this.interstitialAd.onError(() => {
                console.log('插屏 广告加载失败')
            })
        }
    }


    initRewardedVideoAd () {
        // 创建激励视频广告实例
        if (wx.createRewardedVideoAd) {
            this.videoAd = wx.createRewardedVideoAd({
                adUnitId: 'adunit-6ff1555f4a0af86e'
            })

            // 监听广告加载
            this.videoAd.onLoad(() => {
                console.log('激励视频广告加载成功')
                this.gameInfo.isAdLoading = false
                this.gameInfo.uiPositions.adButton.visible = true
            })

            // 监听广告错误
            this.videoAd.onError((err) => {
                console.error('激励视频广告加载失败', err)
                this.gameInfo.isAdLoading = false
                wx.showToast({
                    title: '广告加载失败，请稍后重试',
                    icon: 'none'
                })
                this.gameInfo.uiPositions.adButton.visible = true

            })

            // 监听广告关闭
            this.videoAd.onClose((res) => {
                if (res && res.isEnded) {
                    // 正常播放结束，发放奖励
                    this.handleAdReward()
                } else {
                    // 用户中途关闭
                    wx.showToast({
                        title: '未完整观看，无法获得奖励',
                        icon: 'none'
                    })
                }
            })
        }
    }

    handleAdButtonClick () {
        if (!this.gameInfo.canWatchAd()) {
            if (this.gameInfo.isAdCoolingDown()) {
                const remainingTime = Math.ceil((this.gameInfo.adCooldown - (Date.now() - this.gameInfo.lastAdTime)) / 1000)
                wx.showToast({
                    title: `请等待${remainingTime}秒后再观看广告`,
                    icon: 'none'
                })
            }
            return
        }

        if (!this.videoAd) {
            wx.showToast({
                title: '广告功能暂不可用',
                icon: 'none'
            })
            return
        }

        // 标记广告加载中
        this.gameInfo.isAdLoading = true

        // 显示广告
        this.videoAd.show().catch(() => {
            // 失败重试，先加载广告
            this.videoAd.load()
                .then(() => {
                    this.videoAd.show()
                })
                .catch(err => {
                    console.error('激励视频广告显示失败', err)
                    this.gameInfo.isAdLoading = false
                    wx.showToast({
                        title: '广告加载失败，请稍后重试',
                        icon: 'none'
                    })
                })
        })
    }
    handleAdReward () {
        const rewardAmount = this.gameInfo.adRewardAmount
        this.databus.score += rewardAmount
        this.gameInfo.score = this.databus.score

        // 启动冷却
        this.gameInfo.startAdCooldown()

        wx.showToast({
            title: `观看广告成功，获得${rewardAmount}积分`,
            icon: 'success',
            duration: 2000
        })

        // 可以添加额外的动画效果
        // this.showRewardAnimation(rewardAmount)
    }
    checkAdButtonClick (x, y) {
        const adButton = this.gameInfo.uiPositions.adButton
        if (!adButton || !adButton.visible) return false

        return x >= adButton.x &&
            x <= adButton.x + adButton.width &&
            y >= adButton.y &&
            y <= adButton.y + adButton.height
    }
    /**
     * 处理触摸开始事件
     */
    handleTouchStart (e) {
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
        // 检查是否点击了广告按钮
        if (this.checkAdButtonClick(x, y)) {
            this.handleAdButtonClick()
            return
        }
        // 处理UI按钮点击
        if (this.gameInfo.handleMenuButtonClick(x, y)) {
            this.toggleMenuModal();
            return;
        }
        if (this.gameInfo.handleStartGameButtonClick(x, y) && (this.databus.gameState === 'idle' || this.guide.getCurrentStep().id === 3)) {
            this.main.startBetting();
            return;
        }
        if (this.gameInfo.handleAwesomeCatGameButtonClick(x, y) && (this.databus.gameState === 'idle')) {
            this.main.startAwesomeCatGame();
            return;
        }
        // 处理菜单弹窗点击
        if (this.gameInfo.uiPositions.menuModal.visible && this.gameInfo.uiPositions.helpModal.visible == false) {
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
                // 在适合的场景显示插屏广告
                if (this.interstitialAd) {
                    this.interstitialAd.show().catch((err) => {
                        console.error('插屏广告显示失败', err)
                        this.main.restartGame();

                    })
                    this.interstitialAd.onClose(res => {
                        this.main.restartGame();
                        console.log('插屏 广告关闭')
                    })
                } else {
                    this.main.restartGame();

                }
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
    handleGuideClick (x, y) {
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
    handleGuideBallSelection (x, y) {
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
    handleGuideMenuClick (x, y) {
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
    handleGuideStartGameClick (x, y) {
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
     * 引导期间的开始按钮点击
     */
    handleGuideStartClick (x, y) {
        if (this.gameInfo.uiPositions.menuModal.visible) {
            const menuAction = this.gameInfo.handleMenuModalClick(x, y);
            if (menuAction === 'start') {
                this.handleMenuAction(menuAction);

                // 开始游戏后，进入下一步
                setTimeout(() => {
                    this.guide.next();
                }, 500);
                return;
            }
        }
    }

    /**
     * 处理滚珠选择
     */
    handleBallSelection (x, y) {
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
     * 处理按钮动作
     */
    handleButtonAction (action) {
        switch (action) {
            case 'claim':
                this.main.claimPoints();
                break;
            case 'help':
                this.gameInfo.uiPositions.helpModal.visible = true;
                break;
            case 'start':
                this.main.startBetting();
                this.gameInfo.uiPositions.menuModal.visible = false;
                break;
            case 'pause':
                this.main.togglePause();
                break;
            case 'restart':
                this.main.restartGame();
                break;
            case 'closeMenu':
                this.toggleMenuModal();
                break;
        }
    }

    /**
     * 处理助力动作
     */
    handleBetAction (betAction) {
        if (betAction.type === 'bet') {
            this.main.confirmBet(betAction.amount);
        } else if (betAction.type === 'cancel') {
            this.main.cancelBet();
        }
    }

    /**
     * 处理菜单动作
     */
    handleMenuAction (action) {
        this.closeAllModals();

        switch (action) {
            case 'claim':
                this.main.claimPoints();
                break;
            case 'start':
                this.main.startBetting();
                break;
            case 'pause':
                this.main.togglePause();
                break;
            case 'restart':
                this.main.restartGame();
                break;
            case 'help':
                this.gameInfo.uiPositions.helpModal.visible = true;
                break;
        }
    }

    /**
     * 切换菜单弹窗显示/隐藏
     */
    toggleMenuModal () {
        this.gameInfo.uiPositions.menuModal.visible = !this.gameInfo.uiPositions.menuModal.visible;

        // 关闭其他弹窗
        this.gameInfo.uiPositions.betModal.visible = false;
        this.gameInfo.uiPositions.helpModal.visible = false;
    }

    /**
     * 关闭所有弹窗
     */
    closeAllModals () {
        this.gameInfo.uiPositions.menuModal.visible = false;
        this.gameInfo.uiPositions.betModal.visible = false;
        this.gameInfo.uiPositions.helpModal.visible = false;
        this.gameInfo.selectedMenuItem = null;
    }

    /**
     * 判断是否点击帮助弹窗关闭按钮
     */
    isPointInHelpModalClose (x, y) {
        if (!this.main.gameInfo.uiPositions.helpModal.visible) return false

        const closeButton = this.main.gameInfo.uiPositions.helpModal.closeButton
        return this.main.gameInfo.isPointInButton(x, y, closeButton)
    }
    /**
     * 判断是否点击结果弹窗按钮
     */
    isPointInResultModalButton (x, y) {
        const modalWidth = 400;
        const modalHeight = 400;
        const modalX = (SCREEN_WIDTH - modalWidth) / 2;
        const modalY = (SCREEN_HEIGHT - modalHeight) / 2;

        return x >= modalX + 100 && x <= modalX + 300 &&
            y >= modalY + 320 && y <= modalY + 370;
    }
}