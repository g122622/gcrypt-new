import { defineStore } from "pinia";
import defaultSettings from "@/assets/json/defaultSettings";
import settingItem from "@/types/settingItem";
import { log } from "@/utils/gyConsole";
import { cloneDeep } from "lodash";
import SettingTypes from "@/types/settingTypes";
import KVStore from "@/utils/KVStore";

// 初始化electron-store
const settingStore = new KVStore({
    name: "settings",
    fileExtension: "json",
    clearInvalidConfig: true
});

/* 注意：还有一部分关于设置的逻辑位于main.ts中，以后可以集中在这里。 TODO */
export const useSettingsStore = defineStore("settings", {
    state: () => {
        if (!settingStore.has("timestamp")) {
            // 初始化设置
            settingStore.clear();
            settingStore.set("settings", defaultSettings);
            settingStore.set("timestamp", Date.now());
            // settingStore.store = { settings: defaultSettings, timestamp: Date.now() };
        }
        return {
            settings: <Array<settingItem>>settingStore.get("settings")
        };
    },
    actions: {
        /**
         * 保存设置到本地磁盘
         */
        saveSettings() {
            settingStore.set("settings", this.settings);
            settingStore.set("timestamp", Date.now());
            log("设置保存成功");
        },
        resetSettings() {
            this.settings = defaultSettings;
        },
        setSetting(name: string, value) {
            this.settings.find(item => item.name === name).value = value;
        },
        getSetting(name: string) {
            try {
                return this.settings.find(item => item.name === name).value;
            } catch (e) {
                this.updateSettings();
                // 再试一次
                return this.settings.find(item => item.name === name).value;
            }
        },
        hasSetting(name: string) {
            return !!this.settings.find(item => item.name === name);
        },
        updateSettings() {
            let temp: settingItem[] = [];
            defaultSettings.forEach(item => {
                temp.push(cloneDeep(item));
                // 不是新的设置项
                if (this.hasSetting(item.name)) {
                    // 特殊地，按钮的value不需要维持原来的值，因为按钮的value是执行函数而不是用户输入的配置
                    if (item.type !== SettingTypes.button) {
                        temp[temp.length - 1].value = this.getSetting(item.name);
                    }
                }
            });
            this.settings = temp;
        }
    }
});
