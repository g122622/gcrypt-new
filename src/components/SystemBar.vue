<template>
    <v-system-bar window style="-webkit-app-region: drag;padding-right: 0px;overflow: hidden;" height="32">
        <img src="/favicon.png" style="width:18px;margin-bottom: 3px;">
        <single-width-point-switcher :breakpoint="400">
            <template #wide>
                <span class="ml-2">隐域-Gcrypt
                    <template v-if="mainStore.appVersion"> v{{ mainStore.appVersion }}</template>
                </span>
            </template>
        </single-width-point-switcher>

        <!-- <span v-if="pendingOrRunningTaskAmount" style="margin-left: 5px;"> · {{ pendingOrRunningTaskAmount }} 任务</span> -->
        <v-chip class="ma-2" color="red" size="x-small" v-if="sharedUtils.env === 'development'">
            dev
        </v-chip>
        <v-chip class="ma-2" color="green" size="x-small" v-if="sharedUtils.env === 'production'">
            prod
        </v-chip>
        <v-chip class="ma-2" color="blue" size="x-small" style="margin-left: -5px !important;">
            等待任务数：{{ pendingOrRunningTaskAmount }}
        </v-chip>
        <v-spacer />
        <div v-ripple class="system-bar-item" v-for="item in itemList.filter(i => !i.hide)" :key="item.name"
            @click="item.onClick" :class="item.class">
            <v-icon>
                {{ item.icon }}
            </v-icon>
            <v-tooltip activator="parent" location="bottom">
                {{ item.tooltip }}
            </v-tooltip>
        </div>

    </v-system-bar>
</template>

<script setup lang="ts">
import { computed } from "vue"
import electron from "@/platform/electron/electronAPI";
import { useMainStore } from "@/store/main"
import { useSettingsStore } from "@/store/settings"
import sharedUtils from "@/utils/sharedUtils";
import emitter from "@/eventBus";
import { useTaskStore } from "@/store/task";
import { isElectron } from "@/platform/platform";
import SingleWidthPointSwitcher from "./ResponsiveLayout/SingleWidthPointSwitcher.vue";
import { toggleVConsole } from "@/utils/dev/vconsole";
import GcryptApp from "@/main";

const mainStore = useMainStore()
const settingsStore = useSettingsStore()
const taskStore = useTaskStore()

const pendingOrRunningTaskAmount = computed<number>(() => taskStore.getPendingOrRunningTaskAmount())
const itemList = computed(() => {
    return [
        {
            name: 'test',
            tooltip: '运行测试函数',
            onClick: () => {
                // eslint-disable-next-line dot-notation
                window['runTest']()
            },
            icon: 'mdi-test-tube',
            class: 'system-bar-item-normal',
            hide: sharedUtils.env === 'production'
        },
        {
            name: 'devtools',
            tooltip: '切换开发者工具',
            onClick: () => {
                electron.ipcRenderer.send('mainService',
                    { code: "toggleDT" })
            },
            icon: 'mdi-code-tags',
            class: 'system-bar-item-normal',
            hide: !isElectron()
        },
        {
            name: 'vconsole',
            tooltip: '切换vconsole',
            onClick: () => {
                toggleVConsole()
            },
            icon: 'mdi-code-tags',
            class: 'system-bar-item-normal',
            hide: false
        },
        {
            name: 'reload',
            tooltip: '重载主渲染进程',
            onClick: async () => {
                await mainStore.inactivateAllFiles()
                if (isElectron()) {
                    electron.ipcRenderer.send('mainService',
                        { code: "reload" })
                } else {
                    window.location.reload()
                }
            },
            icon: 'mdi-reload',
            class: 'system-bar-item-normal',
            hide: false
        },
        {
            name: 'lock',
            tooltip: '锁定应用',
            onClick: () => {
                emitter.emit("Action::toggleAppLocker")
            },
            icon: 'mdi-lock-outline',
            class: 'system-bar-item-normal',
            hide: !settingsStore.getSetting("window_lock")
        },
        {
            name: 'minimize',
            tooltip: '最小化窗口',
            onClick: () => {
                electron.ipcRenderer.send('mainService',
                    { code: "minimize" })
            },
            icon: 'mdi-minus',
            class: 'system-bar-item-normal',
            hide: !isElectron()
        },
        {
            name: 'maximize',
            tooltip: '最大化窗口',
            onClick: () => {
                electron.ipcRenderer.send('mainService',
                    { code: "maximize" })
            },
            icon: 'mdi-window-maximize',
            class: 'system-bar-item-normal',
            hide: !isElectron()
        },
        {
            name: 'close',
            tooltip: '关闭应用',
            onClick: async () => {
                if (pendingOrRunningTaskAmount.value > 0) {
                    emitter.emit("showMsg", {
                        level: "warning",
                        msg: "目前仍有任务在等待或运行，确定要关闭应用吗",
                        actionButtons: [
                            {
                                title: '确定',
                                onClick: () => {
                                    electron.ipcRenderer.send('mainService',
                                        { code: "close" })
                                },
                            },
                            {
                                title: '取消'
                            },
                        ]
                    })
                    return
                }

                await GcryptApp.dispose()

                if (isElectron()) {
                    electron.ipcRenderer.send('mainService',
                        { code: "close" })
                }
            },
            icon: 'mdi-close',
            class: 'system-bar-item-danger',
            hide: !isElectron()
        }

    ]
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.system-bar-item {
    height: 32px;
    width: 45px;
    overflow: hidden;
    transition: all 0.3s;
    -webkit-app-region: no-drag;

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

}

.system-bar-item-normal:hover {
    background-color: rgba(128, 128, 128, 0.5);
    cursor: pointer;
}

.system-bar-item-danger:hover {
    background-color: rgba(255, 29, 29, 0.9);
    cursor: pointer;
}

.v-theme--LightTheme {
    .v-system-bar {
        background-color: #f7f7f7;
    }
}
</style>
