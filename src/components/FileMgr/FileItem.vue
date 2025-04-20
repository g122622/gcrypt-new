<template>
    <div class="file-item" :class="fileItemClassList" v-ripple ref="fileItemElement" @click="handleClick($event)"
        @click.right="handleClick($event, true)" v-intersect="{
            handler: onIntersect,
            options: {
                threshold: 0
            }
        }" :style="{ opacity: isIntersecting ? 1 : 0 }">
        <!-- 若在视口范围内，则渲染以下组件 -->
        <template v-if="isIntersecting">
            <v-tooltip activator="parent" location="right" open-delay="500">
                {{ `[${index + 1}] ${singleFileItem.name}` }}
            </v-tooltip>
            <!-- 前置内容 -->
            <div style="display: flex;justify-content: flex-start;align-items: center; height:80%; width:100%"
                :style="{ flexDirection: (viewOptions.itemDisplayMode === 0 ? 'row' : 'column') }">
                <template v-if="singleFileItem.type === `folder`">
                    <img :src="`./assets/fileTypes/folder.png`" class="file-types-image" loading="lazy" />
                </template>
                <template v-if="singleFileItem.type === `file`">
                    <img v-if="currentThumbnail && viewOptions.showThumbnails" :src="toDataURL(currentThumbnail)"
                        class="file-thumbnail-img" loading="lazy" />
                    <img v-else :src="`./assets/fileTypes/${getFileType(singleFileItem.name)}.png`"
                        class="file-types-image" loading="lazy" />
                </template>
                <template v-if="singleFileItem.type === `file` && !!currentThumbnail && viewOptions.showThumbnails">
                    <img :src="`./assets/fileTypes/${getFileType(singleFileItem.name)}.png`"
                        class="file-types-image-corner" loading="lazy" />
                </template>
                <div class="file-name" :style="{ color: markerColor }">
                    {{ singleFileItem.name }}
                </div>
            </div>

            <!-- 自定义内容插槽 -->
            <slot></slot>

            <!-- 尾置内容 -->
            <!-- <IconBtn tooltip="更多" icon="mdi-dots-vertical" :onClick="handleClickMore" /> -->
            <div class="file-meta">
                <template v-if="viewOptions.itemDisplayMode === 0">
                    created: {{ new Date(singleFileItem.meta.createdTime).toLocaleString() }}
                    <br />
                    modified: {{ new Date(singleFileItem.meta.modifiedTime).toLocaleString() }}
                </template>
                <template v-else-if="viewOptions.itemDisplayMode === 1 && props.singleFileItem.type === 'file'">
                    {{ prettyBytes(props.singleFileItem.meta.size, 2) }}
                </template>
                <template v-else-if="viewOptions.itemDisplayMode === 1 && props.singleFileItem.type === 'folder'">
                    {{ new Date(singleFileItem.meta.modifiedTime).toLocaleDateString() }}
                </template>
                <template v-else-if="viewOptions.itemDisplayMode === 2 && props.singleFileItem.type === 'file'">
                    {{ prettyBytes(props.singleFileItem.meta.size, 2) }}
                </template>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import DirSingleItem from "@/api/core/types/DirSingleItem";
import getFileType from "@/utils/file/getFileType";
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useMainStore } from "@/store/main"
import prettyBytes from "@/utils/prettyBytes";
import IAdapter from "@/api/core/types/IAdapter";
import { ViewOptions } from "./types/ViewOptions";
import getThumbnailFromSystem from '@/utils/image/getThumbnailFromSystem'
import { warn } from "@/utils/gyConsole";
import sleep from "@/utils/sleep";
import { Buffer } from "buffer";
import { isElectron } from "@/platform/platform";
import generateThumbnailUsingCanvas from "@/utils/image/generateThumbnailUsingCanvas";

interface Props {
    viewOptions: ViewOptions,
    singleFileItem: DirSingleItem,
    index: number,
    adapter: IAdapter,
    isSelected: boolean
}
const props = defineProps<Props>()
const emit = defineEmits(['selected', 'unselected'])
const mainStore = useMainStore()
// 由于看图模式下排版存在不稳定性，故不启用虚拟列表
const isIntersecting = ref<boolean>(props.viewOptions.itemDisplayMode === 2)

const toDataURL = (str: string) => {
    const prefix = 'data:image/jpg;base64,'
    return prefix + str
}

const isHidden = computed(() => {
    return props.singleFileItem.name[0] === "."
})

const fileItemClassList = computed(() => {
    return {
        'file-item-list': props.viewOptions.itemDisplayMode === 0,
        'file-item-item': props.viewOptions.itemDisplayMode === 1,
        'file-item-photo': props.viewOptions.itemDisplayMode === 2,
        'file-item-hidden': isHidden.value,
        'file-item-selected': props.isSelected,
    }
})

const markerColor = computed(() => {
    const fileActiveState = mainStore.activeFiles.get(props.singleFileItem.key)
    if (fileActiveState) {
        if (fileActiveState.isUsingTempFile) {
            return '#FFC300'
        }
        if (fileActiveState.isOpen) {
            return '#23B6FC'
        }
    }
    return 'none'
})

const handleClick = (event: MouseEvent, isRightClick = false) => {
    if (!event.isTrusted) {
        // 非用户触发的事件，不处理
        // （怀疑是vue-hand-mobile的bug，会在用户鼠标左键点击元素后，一段时间后自动再触发一次事件，导致item选择被取消掉）
        return
    }
    if (props.isSelected) {
        if (!isRightClick) {
            emit("unselected")
        }
    } else {
        emit("selected")
    }
}

const onIntersect = (isIntersectingArg /* , entries, observer */) => {
    if (props.viewOptions.itemDisplayMode === 2) {
        isIntersecting.value = true
        return
    }
    // 降低并发
    requestIdleCallback(() => {
        isIntersecting.value = isIntersectingArg
    })
}

// #region 缩略图
const currentThumbnail = ref<string>('')
let idleCallbackId = null
const registerCallbackOfGetThumbnailFromSystem = () => {
    // 尝试从系统获取缩略图，并保存
    idleCallbackId = requestIdleCallback(async () => {
        if (!(await props.adapter.hasExtraMeta(props.singleFileItem.key, 'fileOriginalPath'))) {
            return
        }
        let fileOriginalPath = null
        // 3次尝试从系统获取缩略图，并保存
        for (let i = 0; i < 3; i++) {
            try {
                fileOriginalPath = (await props.adapter.getExtraMeta(props.singleFileItem.key, 'fileOriginalPath')).toString()
                currentThumbnail.value = await getThumbnailFromSystem(fileOriginalPath, { height: 256, width: 256, quality: 90 })
                await props.adapter.setExtraMeta(props.singleFileItem.key, 'thumbnail', Buffer.from(currentThumbnail.value))
                break
            } catch (e) {
                warn(`第${i + 1}次从系统获取缩略图失败，错误原因：${e.toString()}，文件在本地系统的路径：${fileOriginalPath}`)
            }
            if (i === 2) {
                await props.adapter.setExtraMeta(props.singleFileItem.key, 'thumbnail', Buffer.from('n/a'))
                warn(`3次从系统获取缩略图全部失败，文件在本地系统的路径：${fileOriginalPath}`)
            } else {
                // 休眠一段时间之后再试
                await sleep(500)
            }
        }
        // 收尾工作，清理掉fileOriginalPath
        await props.adapter.deleteExtraMeta(props.singleFileItem.key, 'fileOriginalPath')
    })
}
// 尝试从canvas生成缩略图，并保存
const registerCallbackOfGenerateThumbnail = () => {
    if (getFileType(props.singleFileItem.name) !== 'img') {
        return; // 非图片文件不生成缩略图
    }
    idleCallbackId = requestIdleCallback(async () => {
        const base64Str = (await props.adapter.readFile(props.singleFileItem.name)).toString('base64')
        const dataUrl = `data:image/jpg;base64,${base64Str}`
        const res = await generateThumbnailUsingCanvas(
            dataUrl,
            { height: 256, width: 256, quality: 90, outputType: 'base64' }
        ) as string;
        currentThumbnail.value = res
        await props.adapter.setExtraMeta(props.singleFileItem.key, 'thumbnail', Buffer.from(currentThumbnail.value))
    })
}

onMounted(async () => {
    // 自动创建和加载缩略图相关逻辑
    if (props.viewOptions.showThumbnails && props.adapter.getExtraMeta && props.singleFileItem.type === 'file') {
        try {
            const thumbnailBuf = await props.adapter.getExtraMeta(props.singleFileItem.key, 'thumbnail')
            if (thumbnailBuf) {
                const thumbnailStr = thumbnailBuf.toString()
                if (thumbnailStr !== 'n/a') {
                    currentThumbnail.value = thumbnailStr
                }
            } else { // 无法从adapter获取到缩略图，则尝试从系统获取或者生成
                // 当thumbnailBuf为null
                if (isElectron()) {
                    registerCallbackOfGetThumbnailFromSystem()
                } else {
                    registerCallbackOfGenerateThumbnail()
                }

            }
        } catch (e) {
            warn('缩略图加载失败:' + e.message)
        }
    }
})

onUnmounted(() => {
    if (idleCallbackId !== null) {
        cancelIdleCallback(idleCallbackId)
    }
})
// #endregion

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
@item-background-alpha: 0.3;

@container (width < 400px) {
    .file-meta {
        display: none;
    }
}

.file-item {
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    transition: 0.25s;
    cursor: pointer;
    z-index: 1; // 为了全局contextmenu的右键点击激发区域在file-item之下
    position: relative !important; // 为了contextmenu的右键点击激发区域能够顺利溢出隐藏
}

.v-theme--LightTheme {
    .file-item {
        color: black;
        background-color: rgba(255, 255, 255, @item-background-alpha);
        box-shadow: 0 0 7px 3px rgba(0, 0, 0, 0.15);
    }

    .file-item:hover {
        background-color: rgba(230, 230, 230, 0.5);
    }
}

.v-theme--DarkTheme {
    .file-item {
        color: white;
        background-color: rgba(131, 131, 131, @item-background-alpha);
    }

    .file-item:hover {
        background-color: rgba(131, 131, 131, 0.5);
    }
}

.file-item-list {
    height: 60px;
    padding-left: 20px;
    justify-content: space-between;
    padding: 15px;
    margin: 10px;

    .file-types-image {
        width: 30px;
    }

    .file-thumbnail-img {
        max-height: 30px;
    }

    .file-name {
        margin-left: 5px;
        margin-right: 5px;
    }

    .file-types-image-corner {
        display: none;
    }
}

.file-item-item {
    // float: left;
    flex-direction: column;
    justify-content: space-evenly;
    padding: 10px;
    aspect-ratio: 1.05; // 缩放后仍然保持长宽比的关键

    .file-types-image {
        // width: 60px;
        height: calc(100% - 20px);
    }

    .file-types-image-corner {
        height: 25px;
        position: absolute;
        bottom: 45px;
        right: 7px;
    }

    .file-thumbnail-img {
        // height: 60px;
        height: calc(100% - 20px);
    }

    .file-name {
        max-width: calc(100% - 5px);
    }
}

.file-item-photo {
    float: left;
    height: 214px;
    // width: 200px;
    flex-direction: column;
    padding: 5px;
    margin-left: 5px;
    margin-top: 5px;
    border-radius: 5px;

    .file-types-image {
        height: 100px;
    }

    .file-types-image-corner {
        height: 30px;
        position: absolute;
        bottom: 25px;
        right: 10px;
    }

    .file-thumbnail-img {
        height: 190px;
    }

    .file-name {
        display: none;
    }
}

.file-item-hidden {
    opacity: 0.35;
}

.file-meta {
    font-size: 13px;
    color: rgb(145, 145, 145);
}

.file-name {
    // display: list-item; // 为了能够展示marker
    // list-style-position: inside; // 为了能够展示marker

    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    font-size: 16px;
    margin-left: 10px;
    margin-right: 10px;
}

// .file-name::marker {
//     content: v-bind("markerColor === 'none' ? `''` : `'• '`");
//     font-weight: 900;
//     color: v-bind('markerColor');
// }

.file-item-selected {
    background-color: rgba(var(--v-theme-primary), @item-background-alpha) !important;
}
</style>
