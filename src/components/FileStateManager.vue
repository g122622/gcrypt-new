<template>
    <div class="text-center">
        <ResponsiveMenu :close-on-content-click="false" location="end">
            <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" size="small" style="margin-top:10px" variant="flat">
                    <v-icon>
                        mdi-file
                    </v-icon>
                </v-btn>
            </template>

            <v-card min-width="400px">
                <!-- 主内容 -->
                <AdvancedList lines="two" subheader="打开的文件" :items="listItems" useBottomTip useSearch
                    v-slot="{ matchedItems }">
                    <v-list-item v-for="item in (matchedItems as typeof listItems)" :key="item.key" :title="item.key">
                        <template #append>
                            <IconBtn icon="mdi-information" :tooltip="getTooltip(item.value)" size="small" />
                            <IconBtn icon="mdi-close" tooltip="解除占用(inactivate)" size="small"
                                @click="item.value.file.dispose()" />
                        </template>
                    </v-list-item>
                </AdvancedList>
                <v-divider />
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="text" @click="mainStore.inactivateAllFiles()">
                        解除全部
                    </v-btn>
                </v-card-actions>
            </v-card>
        </ResponsiveMenu>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useMainStore } from "@/store/main"
import FileActiveState from "@/types/FileActiveState";
import ResponsiveMenu from "./ResponsiveLayout/ResponsiveMenu.vue";

const mainStore = useMainStore()
const listItems = computed(() => {
    let res: { key: string, value: FileActiveState }[] = []
    mainStore.activeFiles.forEach((value, key) => {
        res.push({ key, value })
    })
    return res
})
const getTooltip = (item: FileActiveState) => {
    return `
    isOpen: ${item.isOpen},
    isUsingTempFile: ${item.isUsingTempFile}
    `
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less"></style>
