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
        // this.handleTouchStart = this.handleTouchStart.bind(this);
        // ... 原有代码 ...
        this.videoAd = null // 激励视频广告实例
        this.interstitialAd = null
        this.touchStartHandler = this.handleTouchStart.bind(this) // 绑定this
        // 定义插屏广告
        // 创建 Banner 广告实例，提前初始化
        this.bannerAd = null



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
        // 初始化激励视频广告
        this.initRewardedVideoAd()
        this.initInterstitialAd()
        this.initBannerAd()
        if (this.subGame != null) {

        }
    }
    initBannerAd() {
        this.bannerAd = wx.createBannerAd({
            adUnitId: 'adunit-680ebf307f326a0f',
            style: {
                left: this.canvas.width / 2 - 175,
                top: this.canvas.height - 150,
                width: 350
            }
        })
        // 监听 banner 广告加载事件
        this.bannerAd.onLoad(() => {
            console.log('banner 广告加载成功')
        })
        // 监听 banner 广告错误事件
        this.bannerAd.onError(err => {
            console.error(err.errMsg)
        })
    }
    initInterstitialAd() {
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


    initRewardedVideoAd() {
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

    handleAdButtonClick() {
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
    handleAdReward() {
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
    checkAdButtonClick(x, y) {
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

        // 检查是否点击了广告按钮
        if (this.checkAdButtonClick(x, y)) {
            // this.handleAdButtonClick()
            return
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
        if (this.gameInfo.handleAwesomeCatGameButtonClick(x, y) && (this.databus.gameState === 'idle')) {
            // this.main.startAwesomeCatGame();
            // this.main.startSpinDominoGame();
            this.main.startLuckyDominoGame();

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
                this.bannerAd.hide();

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
     * 引导期间的开始按钮点击
     */
    handleGuideStartClick(x, y) {
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
     * 处理按钮动作
     */
    handleButtonAction(action) {
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
    handleBetAction(betAction) {
        if (betAction.type === 'bet') {
            this.main.confirmBet(betAction.amount);
        } else if (betAction.type === 'cancel') {
            this.main.cancelBet();
        }
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

            case 'quickChallenge':
                // 快速挑战 -
                this.showDevNotice('快速挑战');

                break;

            case 'collection':
                // 我的图鉴 - 开发中
                this.showDevNotice('图鉴系统');
                break;

            case 'creativeWorkshop':
                // 创意工坊 - 开发中
                this.showDevNotice('创意工坊');
                break;

            case 'myStudio':
                // 我的工作室 - 开发中
                this.showDevNotice('工作室');
                break;

            case 'task':
                // 任务系统 - 开发中
                this.showDevNotice('任务系统');
                break;

            case 'shop':
                // 商店系统 - 开发中
                this.showDevNotice('商店系统');
                break;

            case 'friends':
                // 好友系统 - 开发中
                this.showDevNotice('好友系统');
                break;

            case 'ranking':
                // 排行榜 - 开发中
                this.showDevNotice('排行榜');
                break;

            case 'settings':
                // 设置 - 开发中
                this.showDevNotice('设置');
                break;

            case 'mail':
                // 邮件 - 开发中
                this.showDevNotice('邮件系统');
                break;

            case 'dailySignInSuccess':
                // 每日签到成功
                wx.showToast({
                    title: '签到成功！',
                    icon: 'success',
                    duration: 2000
                });
                break;

            case 'dailySignInAlready':
                // 今日已签到
                wx.showToast({
                    title: '今日已签到',
                    icon: 'none',
                    duration: 1500
                });
                break;

            default:
                console.log('未知菜单动作:', action);
        }
    }

    /**
     * 切换菜单弹窗显示/隐藏
     */
    toggleMenuModal() {
        this.gameInfo.uiPositions.menuModal.visible = !this.gameInfo.uiPositions.menuModal.visible;
        if (this.gameInfo.uiPositions.menuModal.visible) {
            this.bannerAd.show().then(() => {
                console.log('banner 广告显示成功')
            });
        } else {
            this.bannerAd.hide();
        }
        // 关闭其他弹窗
        this.gameInfo.uiPositions.betModal.visible = false;
        this.gameInfo.uiPositions.helpModal.visible = false;
    }

    /**
     * 关闭所有弹窗
     */
    closeAllModals() {
        this.gameInfo.uiPositions.menuModal.visible = false;
        this.gameInfo.uiPositions.betModal.visible = false;
        this.gameInfo.uiPositions.helpModal.visible = false;
        this.gameInfo.selectedMenuItem = null;
    }

    /**
     * 显示开发中提示
     */
    showDevNotice(feature) {
        wx.showModal({
            title: '开发中',
            content: `${feature}功能正在开发中，敬请期待！`,
            showCancel: false,
            confirmText: '我知道了'
        });
    }

    /**
     * 判断是否点击帮助弹窗关闭按钮
     */
    isPointInHelpModalClose(x, y) {
        if (!this.main.gameInfo.uiPositions.helpModal.visible) return false

        const closeButton = this.main.gameInfo.uiPositions.helpModal.closeButton
        return x >= closeButton.x && x <= closeButton.x + closeButton.width &&
            y >= closeButton.y && y <= closeButton.y + closeButton.height
    }
}