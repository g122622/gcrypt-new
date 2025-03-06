import FileActiveState from "@/types/FileActiveState";
import { defineStore } from "pinia";
import KVStore from "@/utils/KVStore";

// 初始化electron-store
const mainStore = new KVStore({
    name: "main",
    fileExtension: "json",
    clearInvalidConfig: true
});

export const useMainStore = defineStore("main", {
    state() {
        return {
            compileInfo: {
                compileDate: COMPILE_DATE,
                compileNumber: COMPILE_NUMBER,
                compilePlatform: COMPILE_PLATFORM,
                compileEnv: COMPILE_ENV,
                compileCPU: COMPILE_CPU,
                compileMem: COMPILE_MEM
            },
            notifications: [],
            mainContentScrollable: true,
            activeFiles: new Map() as Map<string, FileActiveState>,
            appVersion: mainStore.get("appVersion") as string,
            appVersionOld: mainStore.get("appVersionOld") as string
        };
    },
    actions: {
        setFileActiveState(fileguid, statusName, statusValue) {
            if (!this.activeFiles.has(fileguid)) {
                this.activeFiles.set(fileguid, <FileActiveState>{ file: null, isOpen: false, isUsingTempFile: false });
            }
            this.activeFiles.get(fileguid)[statusName] = statusValue;
        },

        async inactivateAllFiles() {
            const promises = [];
            this.activeFiles.forEach((value, key) => {
                promises.push(value.file.dispose());
            });
            await Promise.all(promises);
            this.activeFiles.clear();
        }
    }
});
