/**
 * File: \src\assets\json\defaultSettings.ts
 * Project: Gcrypt
 * Created Date: 2023-11-26 17:14:30
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-20 17:09:41
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

import settingItem from "@/types/settingItem";
import SettingTypes from "@/types/settingTypes";

const text =
    "孩提时，我有许多美丽的憧憬，天真的梦。那时，我最喜欢看天上的星河。夏夜仰望那缀满星星的夜空，我会几个小时地坐着发痴，小脑瓜里整个儿盘旋着关于星星月亮的种种神话传说。于是，我总相信月宫里有嫦娥，早晚有一天会从那影影绰绰的桂花树下飘飘走出，而那璀璨的星星呢，一定是那些调皮的小仙女随意抛洒的宝石珠贝。我很想什么时候飞上天去，抓住天幕的一角轻轻一抖，让这些明亮得耀眼的珠宝纷纷飞落下来，穿过云端，落到人间。";

const defaultSettings = Object.freeze(<Array<settingItem>>[
    {
        name: "is_dark",
        type: SettingTypes.switcher,
        value: true,
        title: "夜间模式",
        des: "使用黑色元素配色",
        category: "外观"
    },
    {
        name: "theme_color",
        type: SettingTypes.color,
        value: "#3949AB",
        title: "主题色",
        des: "选择的颜色将作为界面主色展示",
        category: "外观"
    },
    {
        name: "background_img",
        type: SettingTypes.img,
        value: "",
        title: "背景图片",
        des: "从指定本地路径选择背景图片",
        category: "外观"
    },
    {
        name: "background_img_blur",
        type: SettingTypes.slider,
        value: "0",
        title: "背景图片模糊度",
        des: "给背景图加上模糊filter，不会修改原文件",
        category: "外观",
        extra: {
            maxLimitation: 100,
            minLimitation: 0
        }
    },
    {
        name: "background_img_transp",
        type: SettingTypes.slider,
        value: "85",
        title: "背景图片透明度",
        des: "调低调高都不好",
        category: "外观",
        extra: {
            maxLimitation: 100,
            minLimitation: 30
        }
    },
    {
        name: "ui_scale",
        type: SettingTypes.slider,
        value: "100",
        title: "界面缩放级别",
        des: "调整应用缩放级别",
        category: "外观",
        extra: {
            maxLimitation: 200,
            minLimitation: 30
        }
    },
    {
        name: "use_bottom_tip",
        type: SettingTypes.switcher,
        value: true,
        title: "显示底部句子",
        des: "是否从网络获取并显示列表底部的装饰性句子",
        category: "外观"
    },
    {
        name: "side_column_open_by_default",
        type: SettingTypes.switcher,
        value: true,
        title: "侧栏默认展开",
        des: "设置启动应用的时候，侧边栏的默认展开状态",
        category: "外观"
    },
    {
        name: "use_single_instance_lock",
        type: SettingTypes.switcher,
        value: true,
        title: "开启单例锁",
        des: "阻止用户开启多个相同的Gcrypt窗口，避免冲突",
        category: "杂项"
    },
    {
        name: "use_shade",
        type: SettingTypes.switcher,
        value: false,
        title: "背景黑色遮罩",
        des: "绘制一个纯黑色窗口，覆盖屏幕工作区域",
        category: "杂项"
    },
    {
        name: "on_top",
        type: SettingTypes.switcher,
        value: false,
        title: "窗口悬浮顶层",
        des: "没什么好说的",
        category: "杂项"
    },
    {
        name: "content_protection",
        type: SettingTypes.switcher,
        value: true,
        title: "窗口捕获保护",
        des: "阻止外部应用截获窗口",
        category: "安全"
    },
    {
        name: "window_lock",
        type: SettingTypes.switcher,
        value: true,
        title: "窗口锁定",
        des: "开启后可通过定时、按钮等锁定窗口，需要密码解锁",
        category: "安全"
    },
    {
        name: "set_window_lock_password",
        type: SettingTypes.button,
        value: 'window.emitter.emit("Action::toggleAppLocker", true)',
        title: "窗口锁定密码设置/重设",
        des: "设置/重设窗口锁定时需要输入的解锁密码",
        category: "安全"
    },
    {
        name: "window_lock_scheduled",
        type: SettingTypes.switcher,
        value: true,
        title: "定时窗口锁定",
        des: "每隔一段时间后执行窗口锁定",
        category: "安全"
    },
    {
        name: "window_lock_interval",
        type: SettingTypes.slider,
        value: 15,
        title: "定时窗口锁定间隔",
        des: "窗口定时锁定的间隔，以分钟为单位",
        category: "安全",
        extra: {
            maxLimitation: 200,
            minLimitation: 5,
            step: 5
        }
    },
    {
        name: "appointed_file_open_methods",
        type: SettingTypes.text,
        value: "{}",
        title: "已指定的文件打开方式",
        des: "这是一段存储了文件打开方式的JSON字符串",
        category: "文件"
    },
    {
        name: "tmp_file_sync_interval",
        type: SettingTypes.slider,
        value: "30000",
        title: "临时文件同步间隔(ms)",
        des: "外部打开的临时文件与加密库之间的最小同步间隔",
        category: "文件",
        extra: {
            maxLimitation: 60000,
            minLimitation: 1000
        }
    },
    {
        name: "filemgr_dafault_display_mode",
        type: SettingTypes.slider,
        value: "1",
        title: "默认布局模式",
        des: "0 list, 1 item, 2 看图模式",
        category: "文件管理器",
        extra: {
            maxLimitation: 2,
            minLimitation: 0,
            step: 1
        }
    },
    {
        name: "filemgr_delete_after_import",
        type: SettingTypes.switcher,
        value: false,
        title: "引入文件后删除源文件",
        des: "文件管理器引入文件后删除源文件",
        category: "文件管理器"
    },
    {
        name: "dev1",
        type: SettingTypes.button,
        value: "require('electron').ipcRenderer.send('mainService',{ code: 'toggleDT'})",
        title: "切换开发者工具",
        des: "打开或关闭开发者工具窗口，用于开发和调试",
        category: "开发者"
    },
    {
        name: "dev2",
        type: SettingTypes.button,
        value: "require('electron').ipcRenderer.send('mainService',{ code: 'reload'})",
        title: "强制重启渲染进程",
        des: "在主进程中重载browser window",
        category: "开发者"
    },
    {
        name: "dev3",
        type: SettingTypes.button,
        value: "require('electron').ipcRenderer.send('mainService',{ code: 'relaunch'})",
        title: "强制重载app主进程",
        des: "直接重启整个electron app，开发环境下使用会导致退出cli",
        category: "开发者"
    },
    {
        name: "test1",
        type: SettingTypes.button,
        value: `parent.emitter.emit('showMsg', { level: 'error', msg: '${text}' })`,
        title: "显示error通知",
        des: "nothing",
        category: "测试"
    },
    {
        name: "test2",
        type: SettingTypes.button,
        value: `parent.emitter.emit('showMsg', { level: 'warning', msg: '${text}' })`,
        title: "显示warning通知",
        des: "nothing",
        category: "测试"
    },
    {
        name: "test3",
        type: SettingTypes.button,
        value: `parent.emitter.emit('showMsg', { level: 'info', msg: '${text}' })`,
        title: "显示info通知",
        des: "nothing",
        category: "测试"
    },
    {
        name: "test4",
        type: SettingTypes.button,
        value: `parent.emitter.emit('showMsg', { level: 'success', msg: '${text}' })`,
        title: "显示success通知",
        des: "nothing",
        category: "测试"
    },
    {
        name: "always_display_update_info",
        type: SettingTypes.switcher,
        value: false,
        title: "总是显示版本更新信息",
        des: "每次更新后都会跳出来的版本更新详情",
        category: "杂项"
    },
    {
        name: "prevent_tab_close",
        type: SettingTypes.switcher,
        value: true,
        title: "阻止标签页关闭",
        des: "当用户重载、关闭主标签页时，阻止关闭",
        category: "杂项"
    }
]);

export default defaultSettings;
