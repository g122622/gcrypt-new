<template>
    <div ref="container" class="advanced-grid" :style="containerStyle">
        <slot v-if="!needsPositioning" />
        <template v-else>
            <div v-for="(child, index) in positionedChildren" :key="child.key" class="grid-item" :style="child.style">
                <component :is="child.component" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useWindowSize, useDebounceFn } from '@vueuse/core'
import type { CSSProperties, VNode } from 'vue'

interface Props {
    breakpoints?: Record<string, number>
    columns?: string | number | Record<string, string | number>
    layoutMode?: 'grid' | 'flex' | 'masonry' | 'waterfall'
    debounceResize?: boolean
    gap?: number // in px
    minColumnWidth?: number // in px
}

const props = withDefaults(defineProps<Props>(), {
    breakpoints: () => ({ xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 }),
    columns: 'auto-fit',
    layoutMode: 'grid',
    debounceResize: true,
    gap: 10,
    minColumnWidth: 200
})

const { width: windowWidth } = useWindowSize()
const container = ref<HTMLElement>()
const positionedChildren = ref<Array<{ key: string, component: VNode, style: Record<string, string> }>>([])

// 断点处理
const sortedBreakpoints = computed(() =>
    Object.entries(props.breakpoints)
        .sort((a, b) => a[1] - b[1])
        .map(([name, value]) => ({ name, value }))
)

const currentBreakpoint = computed(() => {
    for (let i = sortedBreakpoints.value.length - 1; i >= 0; i--) {
        if (windowWidth.value >= sortedBreakpoints.value[i].value) {
            return sortedBreakpoints.value[i].name
        }
    }
    return 'xs'
})

// 列数计算
const currentColumns = computed(() => {
    if (typeof props.columns === 'object') {
        const sortedNames = sortedBreakpoints.value.map(bp => bp.name).reverse()
        for (const bp of sortedNames) {
            if (props.columns[bp]) return props.columns[bp]
        }
    }
    return <string | number>props.columns
})

// 容器样式
const containerStyle = computed<CSSProperties>(() => ({
    display: ['grid', 'flex'].includes(props.layoutMode) ? props.layoutMode : 'block',
    gridTemplateColumns: getGridTemplateColumns(),
    gap: `${props.gap}px`,
    position: needsPositioning.value ? 'relative' : 'static'
}))

function getGridTemplateColumns() {
    if (props.layoutMode !== 'grid') return undefined
    const cols = currentColumns.value
    if (typeof cols === 'number') return `repeat(${cols}, 1fr)`
    if (cols === 'auto-fit' || cols === 'auto-fill')
        return `repeat(${cols}, minmax(${props.minColumnWidth}px, 1fr))`
    return cols
}

// 布局模式处理
const needsPositioning = computed(() =>
    ['masonry', 'waterfall'].includes(props.layoutMode)
)

// 响应式处理
const handleResize = () => {
    if (needsPositioning.value) calculatePositionedLayout()
}

const debouncedResize = useDebounceFn(handleResize, 200)
const resizeHandler = computed(() =>
    props.debounceResize ? debouncedResize : handleResize
)

onMounted(() => {
    window.addEventListener('resize', resizeHandler.value)
    calculatePositionedLayout()
})

onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler.value)
})

// 复杂布局计算
async function calculatePositionedLayout() {
    if (!needsPositioning.value || !container.value) return

    await nextTick()
    const children = Array.from(container.value.children) as HTMLElement[]
    const containerWidth = container.value.offsetWidth
    const gapValue = parseFloat(getComputedStyle(container.value).gap) || 0

    if (props.layoutMode === 'waterfall') {
        const cols = parseColumns()
        const colWidth = (containerWidth - gapValue * (cols - 1)) / cols
        const columnHeights = new Array(cols).fill(0)

        children.forEach(child => {
            const minHeightCol = columnHeights.indexOf(Math.min(...columnHeights))
            const left = minHeightCol * (colWidth + gapValue)
            const top = columnHeights[minHeightCol]

            child.style.cssText = `
        position: absolute;
        left: ${left}px;
        top: ${top}px;
        width: ${colWidth}px;
      `

            columnHeights[minHeightCol] += child.offsetHeight + gapValue
        })

        container.value.style.height = `${Math.max(...columnHeights)}px`
    }
}

function parseColumns() {
    if (typeof currentColumns.value === 'number') return currentColumns.value
    return container.value ? Math.floor(container.value.offsetWidth / 300) : 2
}

watch(
    () => [props.layoutMode, currentBreakpoint.value],
    () => calculatePositionedLayout(),
    { immediate: true }
)
</script>

<style scoped lang="less">
.advanced-grid {
    width: 100%;
    height: auto;

    &.layout-flex {
        flex-wrap: wrap;
    }
}

.grid-item {
    transition: all 0.3s ease;
}
</style>
