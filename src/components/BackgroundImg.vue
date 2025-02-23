<template>
    <div style="position: fixed;" :style="{ filter: `blur(${imgBlur}px)` }">
        <v-img :aspect-ratio="windowSize.width.value / windowSize.height.value"
            :width="windowSize.width.value / settingsStore.getSetting('ui_scale') * 100" :src="imgSrc" cover
            v-if="props.finishLoading"></v-img>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useWindowSize } from '@vueuse/core';
// import { debounce } from "lodash"
import { useSettingsStore } from "@/store/settings"
const settingsStore = useSettingsStore()

const imgSrc = computed(() => {
    return settingsStore.getSetting('background_img')
})
const props = defineProps(["finishLoading"])

const imgBlur = computed(() => {
    return Number(settingsStore.settings.find((item) => item.name === "background_img_blur").value) / 10
})

const windowSize = useWindowSize()
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less"></style>
