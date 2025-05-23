<template>
    <div id="right-click-area" @click.right="handleRightClick($event)" v-touch:press="handleRightClick" />
    <Teleport :to="renderTarget">
        <Transition name="ctxmenu-transition">
            <div class='context_menu_container' ref="container"
                :style="{ top: coordY + 'px', left: coordX + 'px', width: props.width + 'px', opacity: isTransparent ? '0' : '1' }"
                v-if="isInDOM" v-click-outside="() => { isInDOM = false }">
                <template v-for="(list, indexi) in computedMenuLists" :key="indexi">
                    <v-list density="compact">
                        <v-list-item v-for="(item, indexj) in list" :key="item.text" :value="indexj"
                            @click="item.actions.onClick($event); isInDOM = false;">
                            <template v-slot:prepend>
                                <v-icon :icon="item.icon" size="20px"></v-icon>
                            </template>
                            <v-list-item-title style="font-size: 15px;">{{ item.text }}</v-list-item-title>
                            <v-tooltip activator="parent" location="right">{{ item.text }}</v-tooltip>
                        </v-list-item>
                    </v-list>
                    <!-- 只有子list数大于等于1时才显示分割线 -->
                    <v-divider v-if="computedMenuLists.length >= 1 && indexi !== computedMenuLists.length - 1"
                        class="border-opacity-100" color="rgb(100,100,100)" />
                </template>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue"
import contextMenuItem from "@/types/contextMenuItem"
import { useMouse } from "@vueuse/core"

const container = ref<HTMLElement>()
const coordX = ref<number>(0)
const coordY = ref<number>(0)
const isInDOM = ref<boolean>(false)
const isTransparent = ref(false)
const renderTarget = document.querySelector('html')
// const offsetX = 0
// const offsetY = 0
interface Props {
    menuList: Array<contextMenuItem>,
    width: number,
}
const props = defineProps<Props>()
const { x, y } = useMouse()

// 为了顺利展示分割线
const computedMenuLists = computed(() => {
    let res = [[]]
    props.menuList.forEach((item) => {
        if (item.type === "divider") {
            // 新起一个数组
            res.push([])
        } else {
            res[res.length - 1].push(item)
        }
    })
    return res
})

const handleRightClick = async (event) => {
    // console.log(event)
    // mock event object for touch devices using vue-hand-mobile
    if (!('preventDefault' in event)) {
        event = {
            preventDefault: () => { },
            pageX: event.X,
            pageY: event.Y
        }
    }
    if (event.pageX === 0 && event.pageY === 0) {
        // 使用当前鼠标位置作为fallback方案
        event.pageX = x.value
        event.pageY = y.value
    }
    // console.log(event.pageX, event.pageY)
    event.preventDefault()
    // pre-render to get menu's size
    isTransparent.value = true
    isInDOM.value = true
    await nextTick()
    const height = container.value.offsetHeight
    isTransparent.value = false
    isInDOM.value = false
    await nextTick()
    coordX.value = event.pageX + props.width > document.body.offsetWidth ? document.body.offsetWidth - props.width : event.pageX
    coordY.value = event.pageY + height > document.body.offsetHeight ? document.body.offsetHeight - height : event.pageY
    isInDOM.value = true
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less">
#right-click-area {
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
}

.context_menu_container {
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 9999999;
    position: absolute;
}

.ctxmenu-transition-enter-active {
    transition: all 0.1s ease-out;
}

.ctxmenu-transition-leave-active {
    transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1);
}

.ctxmenu-transition-enter-from,
.ctxmenu-transition-leave-to {
    transform: translate(-5px, -5px);
}
</style>

<style lang="less" scoped>
.v-list-item--density-compact.v-list-item--one-line {
    min-height: 33px;
}
</style>
