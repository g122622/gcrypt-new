<template>
    <div>
        <slot v-if="isWideScreen" name="wide"></slot>
        <slot v-else name="narrow"></slot>
    </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { computed } from 'vue';

// 获取窗口宽度
const { width: screenWidth } = useWindowSize();

// 定义props
interface Props {
    breakpoint?: number;
}

const props = withDefaults(defineProps<Props>(), {
    breakpoint: 1024 // 默认断点值
});

// 计算属性判断是否为宽屏
const isWideScreen = computed(() => screenWidth.value > (props.breakpoint ?? 1024));
</script>
