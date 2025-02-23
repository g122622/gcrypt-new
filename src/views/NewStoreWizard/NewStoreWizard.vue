<template>
    <v-app>
        <v-main>
            <Transition></Transition>
            <v-container v-if="currentStage === 1">
                <v-row align="start" no-gutters style="height: 150px;">
                    <v-col v-for="item in storeTypes" :key="item.type">
                        <div class="store-type-container" @click="currentStoreType = item.type; currentStage = 2">
                            <v-icon>{{ item.img }}</v-icon>
                            {{ item.name }}
                        </div>
                    </v-col>
                </v-row>
            </v-container>
            <v-container v-if="currentStage === 2 && currentStoreType === 'local'">
                <v-col cols="12">
                    <small>加密库配置</small>
                    <v-autocomplete :items="['KVPEngineJson', 'KVPEngineFolder', 'KVPEngineHybrid']" label="存储引擎"
                        density="compact" v-model="currentKVPEngine"></v-autocomplete>
                    <v-autocomplete :items="['gcryptV1']" label="adapter" density="compact"
                        v-model="currentAdapter"></v-autocomplete>
                    <v-autocomplete :items="['encryptionEngineAES192', 'EncryptionEngineNoop']" label="加密引擎"
                        density="compact" v-model="currentEncryptionEngine"></v-autocomplete>
                </v-col>
                <v-btn variant="tonal" @click="isEngineConfirmed = true" prepend-icon="mdi-check">
                    确定
                </v-btn>
            </v-container>
            <v-container v-if="currentStage === 2 && currentStoreType === 'remote'">
                <v-col cols="12">
                    <small>加密库配置</small>
                    <v-autocomplete :items="['KVPEngineHybrid']" label="存储引擎" density="compact"
                        v-model="currentKVPEngine"></v-autocomplete>
                    <v-autocomplete :items="['gcryptV1']" label="adapter" density="compact"
                        v-model="currentAdapter"></v-autocomplete>
                    <v-autocomplete :items="['encryptionEngineAES192', 'EncryptionEngineNoop']" label="加密引擎"
                        density="compact" v-model="currentEncryptionEngine"></v-autocomplete>
                </v-col>
                <v-btn variant="tonal" @click="isEngineConfirmed = true" prepend-icon="mdi-check">
                    确定
                </v-btn>
            </v-container>
            <v-container v-if="currentStage === 3">
                <v-col cols="12">
                    <small>入口点entry.js位置</small>
                    <v-text-field label="目录" required density="compact" v-model="storeFolderSrc"></v-text-field>
                    <IconBtn icon="mdi-folder-open"
                        @click="pickFile('', true, false, true).then(files => storeFolderSrc = files[0])" tooltip="选择目录"
                        size="small"></IconBtn>
                </v-col>
                <v-col cols="12">
                    <small>加密库名</small>
                    <v-text-field label="加密库名" required density="compact" v-model="storeName"></v-text-field>
                </v-col>
                <v-col cols="12">
                    <small>加密库密码</small>
                    <v-text-field label="加密库密码" required density="compact" v-model="password"></v-text-field>
                </v-col>
                <template v-if="currentStoreType === 'remote'">
                    <v-col cols="12">
                        <v-switch v-model="remoteConfig.isHttps" color="primary" density="compact" label="是否启用https" />
                    </v-col>
                    <v-col cols="12">
                        <small>远程存储库域名</small>
                        <v-text-field label="域名" required density="compact"
                            v-model="remoteConfig.domain"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <small>远程存储库桶名</small>
                        <v-text-field label="桶名" required density="compact"
                            v-model="remoteConfig.bucketName"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <small>ACCESS_KEY</small>
                        <v-text-field label="ACCESS_KEY" required density="compact"
                            v-model="remoteConfig.ACCESS_KEY"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <small>SECRET_KEY</small>
                        <v-text-field label="SECRET_KEY" required density="compact"
                            v-model="remoteConfig.SECRET_KEY"></v-text-field>
                    </v-col>
                </template>
                <v-btn variant="tonal" @click="isInfoConfirmed = true" prepend-icon="mdi-check">
                    确定
                </v-btn>
            </v-container>
        </v-main>
        <v-footer>
            <!-- 进度指示器 -->
            <v-timeline side="end" direction="horizontal">
                <v-timeline-item v-for="(item, index) in progressLineItems " :key="item.stage"
                    :dot-color="index + 1 === currentStage ? 'error' : 'info'" size="small">
                    <v-alert :value="true" color="info">
                        {{ item.title }}
                    </v-alert>
                </v-timeline-item>
            </v-timeline>
        </v-footer>
    </v-app>
</template>

<script setup lang="ts">
import { reactive, ref, watchEffect } from "vue"
import { useEncryptionStore } from "@/store/encryption";
import VFS from "@/utils/file/virtualFS";
import EntryJson from "@/api/core/types/EntryJson";
import IconBtn from "@/components/shared/IconBtn.vue";
import pickFile from "@/utils/shell/pickFile";
const encryptionStore = useEncryptionStore()

const progressLineItems = [
    { stage: 1, title: "选择存储库类型" },
    { stage: 2, title: "选择engine" },
    { stage: 3, title: "输入密码和其他信息" },
    { stage: 4, title: "完成" },
]
const currentStage = ref(1)

// { stage: 1, title: "选择存储库类型" },
const currentStoreType = ref<"local" | "remote">("local");

const storeTypes = [
    { type: 'local', name: '本地存储库', img: 'mdi-harddisk' },
    { type: 'remote', name: '远程存储库', img: 'mdi-earth' }
]

// { stage: 2, title: "选择engine" },
const currentKVPEngine = ref("")
const currentAdapter = ref("")
const currentEncryptionEngine = ref("")
const isEngineConfirmed = ref(false)

watchEffect(() => {
    if (currentKVPEngine.value && currentAdapter.value && isEngineConfirmed.value) {
        currentStage.value = 3
    } else {
        isEngineConfirmed.value = false
    }
})

// { stage: 3, title: "输入密码和其他信息" },
const storeFolderSrc = ref("")
const storeName = ref("")
const password = ref("")
const isInfoConfirmed = ref(false)
const remoteConfig = reactive({
    isHttps: false,
    domain: "",
    bucketName: "",
    ACCESS_KEY: "",
    SECRET_KEY: ""
})

watchEffect(() => {
    if (storeName.value && storeFolderSrc.value && password.value && isInfoConfirmed.value
        && (currentStoreType.value === 'local'
            || (currentStoreType.value === 'remote' && remoteConfig.domain && remoteConfig.bucketName && remoteConfig.ACCESS_KEY && remoteConfig.SECRET_KEY))
    ) {
        currentStage.value = 4
    } else {
        isInfoConfirmed.value = false
    }
})

// { stage: 4, title: "完成" },
const getInitedAdapterForNewStore = async () => {
    // 生成不同adapter统一的entry.json
    let time = Date.now()
    const entryJSON: EntryJson = {
        modifiedTime: time,
        createdTime: time,
        accessedTime: time,
        storageName: storeName.value,
        comment: '',
        storeType: currentStoreType.value,
        config: {
            KVPEngine: currentKVPEngine.value,
            adapter: currentAdapter.value,
            encryptionEngine: currentEncryptionEngine.value,
            ...(currentStoreType.value === 'remote' ? { remote: remoteConfig } : {}),
        }
    }

    if (!(storeFolderSrc.value.endsWith("/") || storeFolderSrc.value.endsWith("\\"))) {
        storeFolderSrc.value += "/"
    }
    const entryFileSrc = storeFolderSrc.value + "entry.json"
    await VFS.writeFile(entryFileSrc, JSON.stringify(entryJSON))
    encryptionStore.storeList.push({ ...entryJSON, storeEntryJsonSrc: entryFileSrc })
    encryptionStore.save()

    return await encryptionStore.getInitedAdapter(entryFileSrc, password.value, entryJSON)
}

const handleAddStore = async () => {
    // 格式化文件路径
    let formattedEntryPath = storeFolderSrc.value.replaceAll("\\", '/')
    if (formattedEntryPath[formattedEntryPath.length - 1] === "/") {
        formattedEntryPath = formattedEntryPath.slice(0, formattedEntryPath.length - 1)
    }
    // 用filemgr打开
    await encryptionStore.openStore(formattedEntryPath, await getInitedAdapterForNewStore())
}

watchEffect(() => {
    if (currentStage.value === 4) {
        handleAddStore()
    }
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.store-type-container {
    border-radius: 10px;
    background-color: rgba(131, 131, 131, 0.3);
    color: white;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: space-evenly;
    transition: 0.25s;
    cursor: pointer;
    height: 150px;
    width: 90%;
    padding: 10px;
    margin: 10px;

    .file-types-image {
        height: 60px;
    }

    .file-thumbnail-img {
        height: 60px;
    }
}

.store-type-container:hover {
    background-color: rgba(131, 131, 131, 0.5);
}
</style>
