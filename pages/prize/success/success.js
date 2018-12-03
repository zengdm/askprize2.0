// pages/prize/success/success.js
import util from "../../../utils/util"
import { prizeApi } from '../../../utils/api/prizeApi.js';
import { userApi } from '../../../utils/api/userApi.js';
var app = getApp();//获取应用实例
/**
 * 有奖问答成功页面
 */
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //答案信息
    prizemoney: '',
    userInfo: '',
    pid: '',
    moneytimebox: false,
    moneytime: 10,
    //答题类型
    oType:0,

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    // console.log('成功参数', options);
    that.data.pid = options.pid;
    that.prizeApi = new prizeApi(that);
    that.userApi = new userApi(that);
    //非实时问答 type为1，不显示倒计时moneytimebox
    if (options.type == '1') {
      that.data.moneytimebox = false;
      that.prizeApi.money(options.pid, options.answerid, 'cb_money');
    } else {
      //实时问答 type为0 显示倒计时moneytimebox
      that.data.moneytimebox = true;
      var intervalId = setInterval(function () {
        that.data.moneytime--;
        that.setData({
          moneytime: that.data.moneytime,
        });
        if (that.data.moneytime == 0) {
          // 获取通关金额
          that.prizeApi.money(options.pid, options.answerid, 'cb_money');
          // 清除定时任务
          clearInterval(intervalId);
          //倒计时结束 moneytimebox隐藏
          that.data.moneytimebox = false;
          that.setData({
            moneytimebox: that.data.moneytimebox,
          })
        }
      }, 1000)
    }
    // console.log('type是啥--', options.type)
    that.setData({
      moneytimebox: that.data.moneytimebox,
      userInfo: that.userApi.getAccredit(),
      oType: options.type
    })
  },
  cb_money: function (res, opt) {
    var that = this;
    console.log(res)
    var that = this;
    if (res.code == 0) {
      that.data.prize = res.data.prize;
      that.setData({
        prize: res.data.prize,
        apply: res.data.apply
      })
    }


  },

  //回到首页
  goIndex: function () {
    wx.redirectTo({
      url: '/pages/prize/index/index'
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */


  onShareAppMessage: function (res) {
    var that = this;
    return {
      title: '电动邦发钱啦！快来拿奖金！',
      path: 'pages/prize/index/index',
      imageUrl: 'http://i1.dd-img.com/assets/image/1524553758-0ee55d43e3e69554-600w-480h.jpg',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  }


})