import util from "../../../utils/util"
import { prizeApi } from '../../../utils/api/prizeApi.js';
import { userApi } from '../../../utils/api/userApi.js';
var app = getApp();//获取应用实例
Page({
    /**
     * 页面的初始数据
     */
    data: {
        // 登录弾层（默认隐藏）
        loginShow: false,
        userId: '',
        //个人信息余额
        // useramount: '',
        //余额不足10元：弹窗：1，消失弹窗0
        amountmoneyup: 0,
        // 限时答题的详情信息
        // prizetimelast: [],
        //限时答题的id
        qid: '',
        //自由答题的详情信息
        // prizerealllast: [],
        //自由答题的id
        rid: '',
        //限时答题状态：未开始:Istimestatus=1,10s倒计时:Istimestatus=2,进行中:Istimestatus=3,结束:Istimestatus=-1,
        Istimestatus: 0,
        //闯关答题状态：未开始:IsPasstatus=1,3s倒计时:Istimestatus=2,无答题机会可分享:IsPasstatus=3,分到钱:IsPasstatus=4,没分到钱:IsPasstatus=-1,
        IsPasstatus: 1,
        timer: {
            num: 3,
            obj: ''
        },
        argsdata: '',
        openid: ''
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let that = this;
        that.userApi = new userApi(that);
        that.prizeApi = new prizeApi(that);

    },
    /**
   * 生命周期函数--监听页面显示
   */
    onShow: function () {
        let that = this;
        // 清除相关定时任务
        clearInterval(that.data.prizeInterval);
        clearInterval(that.data.timer.obj);
        // 放置tabbar跳转出现showLoading
        wx.hideLoading();
        // 判断是否登录
        that.userApi.wxlogin('cb_login');
        // console.log(that.data.Istimestatus)
    },
    cb_login: function (res, opt) {
        let that = this;
        // console.log(res);
        that.data.userId = res.id;
        if (typeof (res.id) != 'undefined' && res.id == 0) {
            that.loginTips(1);
        } else {
            that.setData({
                userInfo: that.userApi.getAccredit()
            })
            that.data.openid = that.userApi.getAccredit().openid;
            that.userApi.personal(that.data.userId, 'cb_personal');
            // 最新一条限时有奖问答信息
            // that.prizeApi.lastOne('cb_lastOne');
            // 最新一条自由有奖问答信息
            // that.prizeApi.reallast('cb_reallast');
            //最新限时、自由的合并详情
            that.prizeApi.list('cb_list')
        }
    },
    _onSubmit: function () {
        let that = this;
        that.onShow();
        // 最新一条限时有奖问答信息
        // that.prizeApi.lastOne('cb_lastOne');
        // 最新一条自由有奖问答信息
        // that.prizeApi.reallast('cb_reallast');
    },
    // 显示登录弾层
    loginTips: function (isshow) {
        let that = this;
        that.data.loginShow = isshow;
        that.setData({ loginShow: that.data.loginShow });
    },
    cb_list: function (res, opt) {
        let that = this;
        if (res.code == 0) {
            for (let i of res.data) {
                if (i.type == 0) {
                    let parizetimelist = new Array;
                    parizetimelist.push(i);
                    //限时答题的详情
                    that.data.prizetimelast = parizetimelist[0];
                    that.setData({
                        prizetimelast: that.data.prizetimelast,
                    })
                } else if (i.type == 1) {
                    let prizerealllist = new Array;
                    prizerealllist.push(i);
                    //自由答题的详情
                    that.data.prizerealllast = prizerealllist[0];
                    that.setData({
                        prizerealllast: that.data.prizerealllast,
                    })
                }
            }

            if (that.data.prizetimelast) {
                /*** 限时答题答题start ***/
                that.cb_lastOne()
            }
            if (that.data.prizerealllast) {
                /*** 自由答题答题start ***/
                that.cb_reallast()
            }


        }
    },
    /**
     * 获取限时答题最新一条有奖问答
     */
    cb_lastOne: function () {
        let that = this;
        that.data.qid = that.data.prizetimelast.qid;
        // var now_time = Date.parse(new Date()) / 1000
        let now_time = app.time();
        let timestamp = that.data.prizetimelast.start_time
        let end_time = that.data.prizetimelast.end_time
        // 测试
        // timestamp = now_time + 13;
        // end_time = timestamp + 10000;
        // console.log(now_time + "+" + timestamp + "+" + end_time)
        if (now_time > end_time && end_time > 0) {
            //活动已结束
            that.setData({
                Istimestatus: -1
            })
        } else {
            //活动未结束
            let downTime = util.downTimer(timestamp, app.time());
            // console.log("倒计时", util.downTimer(timestamp, app.time()))
            that.setData({
                Istimestatus: 1,
                downTime: downTime,
            });
            clearInterval(that.data.prizeInterval)
            if (downTime.ntime >= 0) {
                //活动即将进行
                that.data.prizeInterval = setInterval(function () {
                    // 计算时间差
                    let downTime = util.downTimer(timestamp, app.time());
                    // 过期定时任务结束
                    if (downTime.ntime < 0) {
                        clearInterval(that.data.prizeInterval);
                        // 活动进行中
                        return false;
                    }
                    //限时答题状态变更：未开始:Istimestatus=1,10s倒计时:Istimestatus=2,进行中:Istimestatus=3,结束:Istimestatus=-1,
                    let Istimestatus = 1;
                    that.setData({
                        downTime: downTime,
                    });
                    if (downTime.ntime > 0 && downTime.ntime < 11) {
                        // 清除时间同步
                        if (app.timerAsync) {
                            clearInterval(app.timerAsync);
                        }
                        /*** 10秒倒计时 ***/
                        Istimestatus = 2;
                    } else if (downTime.ntime < 1) {
                        /*** 开始跳转答题 ***/
                        Istimestatus = 3;
                        // 计时结束,清除限时由定时任务
                        clearInterval(that.data.prizeInterval);
                        // 计时结束,清除自由定时任务
                        clearInterval(that.data.timer.obj);
                        wx.redirectTo({
                            url: '/pages/prize/detail/intimelist/intimelist?qid=' + that.data.qid
                        })
                    }
                    that.setData({
                        downTime: downTime,
                        Istimestatus: Istimestatus
                    });
                }, 1000)
            } else {
                //活动正在进行
                that.setData({
                    Istimestatus: 3
                })
            }
        }
    },
    /**
     * 获取自由答题最新一条有奖问答
     */
    cb_reallast: function (res, opt) {
        // 最新一条有奖问答信息详情展示
        let that = this;
        that.data.rid = that.data.prizerealllast.qid;
        let now_time = app.time();
        // let timestamp = that.data.prizerealllast.start_time;
        let end_time = that.data.prizerealllast.end_time;
        let access_num = that.data.prizerealllast.access_num;
        let limit_join_num = that.data.prizerealllast.limit_join_num;
        // console.log(now_time+"+"+end_time)
        // console.log(that.data.prizerealllast.user_stat)
        let IsPasstatus = 1
        if (that.data.prizerealllast.user.obtain_money != '0.00') {
            //已经分到钱了
            IsPasstatus = 4
        } else if (access_num >= limit_join_num) {
            //活动人数满足了
            IsPasstatus = -1
        } else if (now_time > end_time && end_time > 0) {
            //活动时间到了
            IsPasstatus = -1
        } else if (that.data.prizerealllast.user_stat.remain_user_count <= 0) {
            //没有默认答题机会了，需要分享
            IsPasstatus = 3
        } else {
            //正常答题
            IsPasstatus = 1
        }
        that.setData({
            IsPasstatus: IsPasstatus
        })
    },
    reallanswer: function () {
        let that = this;
        let IsPasstatus = 2
        that.setData({
            IsPasstatus: IsPasstatus,
        })
        // 定时任务倒计时
        that._timer();
    },
    // 自由答题计时down_time
    _timer: function () {
        var that = this;
        // 清除上一个定时任务
        clearInterval(that.data.timer.obj);
        if (that.data.timer.num < 0) {
            return false;
        }
        // 答题倒计时
        that.data.timer.obj = setInterval(function () {
            that.data.timer.num--;
            // that.data.timer.num > 0 && that.data.timer.num < 1
            if (that.data.timer.num < 1) {
                // 计时结束,清除自由定时任务
                clearInterval(that.data.timer.obj);
                // 计时结束,清除限时答题的定时任务
                clearInterval(that.data.prizeInterval);
                //跳转自由答题列表
                wx.redirectTo({
                    url: '/pages/prize/detail/topiclist/topiclist?rid=' + that.data.rid
                })
            } else {
                // 倒计时
                that.setData({
                    timer: that.data.timer
                });
            }

        }, 1000);
    },
    onPullDownRefresh: function () {
        var that = this;
        wx.stopPullDownRefresh();
        that.onShow()
    },
    cb_personal: function (res, opt) {
        let that = this;
        that.data.useramount = res.data;
        that.setData({
            useramount: that.data.useramount
        })
    },
    amountmoneyto: function () {
        let that = this;
        wx.showModal({
            content: '确认提现？',
            success: function (res) {
                if (res.confirm) {
                    // console.log('用户点击确定')
                    // //跳转到提现
                    that.data.argsdata = {
                        uid: that.data.userId,
                        amount: that.data.useramount.amount,
                        // wechat_num: that.data.KeyInput,
                        openid: that.data.openid
                    }
                    // console.log(that.data.argsdata)
                    that.userApi.userapply(that.data.argsdata, 'cb_userapply');
                } else if (res.cancel) {
                    // console.log('用户点击取消')
                }
            }
        })
    },
    cb_userapply: function (res, opt) {
        let that = this;
        if (res.code == 0) {
            wx.navigateTo({
                url: '/pages/prize/amount/amount?amount=' + that.data.useramount.amount + '&&authorid=' + that.data.userId
            })
            // that.setData({
            //     setmoney: false,
            // });
        }
    },
    amountmoneyup: function () {
        let that = this;
        //不足10元弹窗
        that.data.amountmoneyup = 1
        that.setData({
            amountmoneyup: that.data.amountmoneyup
        })
    },
    amountmoneyclose: function () {
        let that = this;
        //关闭不足10元弹窗
        that.data.amountmoneyup = 0
        that.setData({
            amountmoneyup: that.data.amountmoneyup
        })
    },
    onRule: function () {
        let that = this;
        //规则跳转
        wx.navigateTo({
            url: '/pages/prize/rules/rules'
        })
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (res) {
        let that = this;
        if (res.from === 'button') {
            // 来自页面内转发按钮
            console.log(res.target)
        }
        return {
            title: '电动邦发钱啦！快来拿奖金！',
            path: '/pages/prize/index/index',
            imageUrl: 'http://i1.dd-img.com/assets/image/1524553758-0ee55d43e3e69554-600w-480h.jpg',
            success: function (res) {
                // 转发成功
            },
            fail: function (res) {
                // 转发失败
            },
            complete: function (res) {
                //转发成功失败的回调函数
                if (res.errMsg == 'shareAppMessage:ok') {
                    that.prizeApi.isshare(that.data.rid, res.errMsg, 'cb_isshare');
                    that.onShow()
                }
            }
        }
    },
    cb_isshare: function (res, opt) {
        let that = this;
        console.log(res)
    }
})