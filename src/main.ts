/**
 * File: \src\main.ts
 * Project: Gcrypt
 * Created Date: 2023-11-26 17:14:30
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-21 13:57:56
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

// 全局组件
import VueApp from "./App.vue";
import BottomTip from "./components/shared/BottomTip.vue";
import ActionToolBarBase from "./components/shared/ActionToolBarBase.vue";
import IconBtn from "./components/shared/IconBtn.vue";
import DialogGenerator from "./components/shared/DialogGenerator.vue";
import AdvancedList from "./components/shared/AdvancedList.vue";
import AdvancedTextField from "./components/shared/AdvancedTextField.vue";
import ToolBarBase from "./components/shared/ToolBarBase.vue";

/* eslint-disable dot-notation */
import { createApp } from "vue";
import router from "./router";
import { useMainStore } from "./store/main";
import { useSettingsStore } from "./store/settings";
import { createPinia } from "pinia";
import vuetify from "./plugins/vuetify";
import { loadFonts } from "./plugins/webfontloader";
import emitter from "./eventBus";
import utils from "./utils/utils";
import lodash, { debounce } from "lodash";
import nextTick from "@/utils/nextTick";
import notification from "./backend/notification";
import test from "./test/KVPEQiniuUnit";
import JsonViewer from "vue-json-viewer";
import JsonEditorVue from "json-editor-vue";
import touch from "vue3-hand-mobile";
import LocalFileAdapter from "./backend/core/adapters/localFiles/adapter";
import logger from "./utils/helpers/Logger";
import { loadCss, loadScript } from "./utils/DOM/loadResource";
import { error, success } from "./utils/gyConsole";
import electron from "./platform/electron/electronAPI";
import mock from "./platform/mock";
import setViewportScale from "./utils/DOM/setViewportScale";
import { Disposable, IDisposable } from "./utils/helpers/Disposable";
import { allowPageClose, preventPageClose } from "./utils/DOM/closePrevension";

let pinia;
/**
 * 因为 node.js V17版本中最近发布的OpenSSL3.0,
 * 而OpenSSL3.0对允许算法和密钥大小增加了严格的限制，
 * 可能会对生态系统造成一些影响。
 * 故此以前的项目在升级 nodejs 版本后会报错。
 * 因此gcrypt项目坚持使用nodejs v16，不再更新nodejs版本和electron版本。
 * 这样做同时还可以确保编译出来的v8字节码在electron上node版本一致。
 */

/**
 * 常见BUG合集
 * 1.读取和修改ref没有加.value
 * 2.函数返回值或参数有时需要深拷贝
 * 3.async函数调用时没有加await
 * 4.await后的括号
 */

/*
一.事件命名规范:
    1.UI事件 只传达某个UI状态改变的信息
        UI::contextMenu::clickOutside
    2.Action 强调动作
        Action::showMsg
    3.LifeCycle 生命周期事件
        LifeCycle::finishedLoadingApp
        LifeCycle::outOfMem
        LifeCycle::clearMem
*/

/** 异常处理规范
 * 404类型的错误一律返回空值，不要抛出异常
 * 其他类型的错误一律抛出异常
 */

/**
 * App的主类
 */
class ApplicationRenderer extends Disposable {
    private AppInstance: ReturnType<typeof createApp>;
    private MainStore: ReturnType<typeof useMainStore>;
    private SettingsStore: ReturnType<typeof useSettingsStore>;

    private initEvents() {
        globalThis.emitter = emitter;

        window.addEventListener("error", function (event) {
            // onerror_statements
            console.log(event);
            if (event.error.stack) {
                const str = `主窗口渲染进程发生代码执行错误，错误栈消息如下：${event.error.stack}`;
                logger.log(str, "error");
                emitter.emit("showMsg", { level: "error", msg: str });
            }
        });

        emitter.on("resetSettings", () => {
            nextTick(() => {
                // 通知store
                this.SettingsStore.resetSettings();
                // 应用设置
                this.applySettings();
                // 通知用户
                emitter.emit("showMsg", {
                    level: "success",
                    msg: "设置重置成功。<br>有些设置可能需要重启app才能应用!"
                });
            });
        });

        emitter.on("applySettings", () => {
            this.applySettings();
        });

        emitter.on("showShade", () => {
            electron.ipcRenderer.send("mainService", { code: "showShade" });
        });

        emitter.on("closeShade", () => {
            electron.ipcRenderer.send("mainService", { code: "closeShade" });
        });

        emitter.on("setOnTop", () => {
            electron.ipcRenderer.send("mainService", { code: "setOnTop" });
        });

        emitter.on("unsetOnTop", () => {
            electron.ipcRenderer.send("mainService", { code: "unsetOnTop" });
        });
    }

    private applySettings() {
        setTimeout(() => {
            // 黑色遮罩
            if (this.SettingsStore.getSetting("use_shade")) {
                console.log("shader on!");
                emitter.emit("showShade");
            } else {
                emitter.emit("closeShade");
            }
            // 窗口置顶
            if (this.SettingsStore.getSetting("on_top")) {
                emitter.emit("setOnTop");
            } else {
                emitter.emit("unsetOnTop");
            }
            // 夜间模式
            if (this.SettingsStore.getSetting("is_dark")) {
                vuetify.theme.global.name.value = "DarkTheme";
                document.querySelector("#app").setAttribute("data-theme-type", "dark");
            } else {
                vuetify.theme.global.name.value = "LightTheme";
                document.querySelector("#app").setAttribute("data-theme-type", "light");
            }
            // 内容保护
            electron.ipcRenderer.send("mainService", {
                code: "setContentProtectionState",
                data: this.SettingsStore.getSetting("content_protection")
            });
            // 内容缩放
            // document.body.style.zoom = `${this.SettingsStore.getSetting("ui_scale")}%`;
            setViewportScale(this.SettingsStore.getSetting("ui_scale"));
            // 阻止标签页关闭
            if (this.SettingsStore.getSetting("prevent_tab_close")) {
                preventPageClose();
            } else {
                allowPageClose();
            }
        }, 100);
    }

    private async initGlobalAdapters() {
        window["LocalFileAdapter"] = new LocalFileAdapter();
        await window["LocalFileAdapter"].initAdapter("/");

        router.addRoute({
            path: "/side_column_local_file",
            name: "side_column_local_file",
            // route level code-splitting
            // this generates a separate chunk (about.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import(/* webpackChunkName: "files" */ "./components/FileMgr/FileMgr.vue"),
            props: { adapter: window["LocalFileAdapter"] }
        });
    }

    private initPinia() {
        pinia = createPinia();
        window["pinia"] = pinia;
    }

    private initVue() {
        // 创建Vue实例
        this.AppInstance = createApp(VueApp);
        // 注入全局变量和全局组件
        this.AppInstance.config.globalProperties.$utils = utils;
        this.AppInstance.config.globalProperties.$emitter = emitter;
        this.AppInstance.config.globalProperties.$lodash = lodash;
        this.AppInstance.component("BottomTip", BottomTip)
            .component("ActionToolBarBase", ActionToolBarBase)
            .component("IconBtn", IconBtn)
            .component("DialogGenerator", DialogGenerator)
            .component("AdvancedList", AdvancedList)
            .component("ToolBarBase", ToolBarBase)
            .component("AdvancedTextField", AdvancedTextField);

        // 使用插件
        this.AppInstance.use(router);
        this.AppInstance.use(vuetify);
        this.AppInstance.use(pinia);
        this.AppInstance.use(JsonViewer);
        this.AppInstance.use(JsonEditorVue);
        this.AppInstance.use(touch);
        this.MainStore = useMainStore();
        this.SettingsStore = useSettingsStore();
        // 根节点挂载
        this.AppInstance.mount("#app");
    }

    private showNotesInConsole() {
        console.log(
            "%cNOTE | Early development",
            `
      background-color: #3f51b5;
      color: #eee;
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
    `,
            [
                "The app is in early development (prototyping) stage. ",
                "I will gradually refactor and optimize the codebase in future updates."
            ].join("")
        );
        console.log(
            "%cNOTE | Performance",
            `
      background-color: #3f51b5;
      color: #eee;
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
    `,
            [
                "Keep in mind: DevTools window uses a lot of resources (RAM, CPU, GPU); ",
                "Dev build is slower and uses more resources than production build."
            ].join("")
        );
    }

    private toggleDevTools() {
        electron.ipcRenderer.send("mainService", { code: "toggleDT" });
    }

    private showFinishInitMsg(e, s) {
        notification.info(`App启动成功<br>启动耗时${e - s}ms`);
    }

    private initSettingsObserver() {
        this.SettingsStore.$subscribe(
            debounce(() => {
                this.applySettings();
                this.SettingsStore.saveSettings();
            }, 500)
        );
    }

    private initFroalaEditor() {
        loadCss("./libs/FroalaEditor/css/froala_editor.pkgd.min.css");
        loadCss("./libs/FroalaEditor/css/themes/dark.min.css");

        // 加载JavaScript文件，这里我们假设不需要立即执行任何回调函数
        loadScript("./libs/FroalaEditor/js/froala_editor.pkgd.min.js", function (err) {
            if (err !== null) {
                error(err.message);
            } else {
                success("Froala Editor has been loaded successfully.");
            }
        });
    }

    private registerDisposables() {
        this._register({
            dispose: async () => {
                await this.MainStore.inactivateAllFiles();
            }
        });
    }

    public async initAll() {
        const startTime = Date.now();
        console.log(mock());
        loadFonts();
        this.initEvents();
        await this.initGlobalAdapters();
        this.initPinia();
        this.initVue();
        if (this.MainStore.appVersion !== this.MainStore.appVersionOld) {
            this.SettingsStore.updateSettings();
        }
        this.initSettingsObserver();
        this.applySettings();
        this.showNotesInConsole();
        this.initFroalaEditor();
        this.registerDisposables();
        if (utils.env === "development") {
            // this.toggleDevTools()
        }
        // this.toggleDevTools()
        emitter.on("LifeCycle::finishedLoadingApp", () => {
            const endTime = Date.now();
            this.showFinishInitMsg(endTime, startTime);
        });
    }

    constructor() {
        super();
        this.initAll();
    }

    /**
     * 注册全局可销毁对象
     * @param disposable 实现了IDisposable接口的对象，需要被统一管理的资源
     */
    public registerGlobalDisposable(disposable: IDisposable) {
        this._register(disposable);
    }
}

// (function () {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const GcryptApp = new ApplicationRenderer();
//     // window["runTest"] = test;
// })();

const GcryptApp = new ApplicationRenderer();
window["runTest"] = test;
export default GcryptApp;
