<template>
    <ResponsiveDialog v-model="isDialogOpen" :persistent="props.isPersistent || false" :width="props.width || 600"
        :height="props.height">
        <v-card density="compact">
            <v-card-title v-if="props.title" style="display: flex; align-items: center;">
                <v-icon v-if="props.titleIcon" style="margin-right: 10px;">{{ props.titleIcon }}</v-icon>
                <span class="text-h6">{{ props.title }}</span>
                <slot name="title"></slot>
            </v-card-title>
            <v-card-text :style="{ padding: props.useCompactContentOuterMargin ? '0px' : 'inherit' }">
                <v-container>
                    <v-row>
                        <slot name="mainContent" />
                        <span v-if="!!props.HTMLContent" v-html="props.HTMLContent"></span>
                    </v-row>
                </v-container>
                <small v-if="props.footer">*{{ props.footer }}</small>
            </v-card-text>
            <v-card-actions v-if="props.bottomActions">
                <slot name="footer" />
                <v-spacer></v-spacer>
                <v-btn v-for="(item, index) in props.bottomActions" color="blue-darken-1" variant="tonal"
                    @click="item.onClick" :key="index">
                    {{ item.text }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </ResponsiveDialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import dialogBottomAction from "@/types/dialogBottomAction"
import { useDialogStore } from "@/store/dialog";
import ResponsiveDialog from "../ResponsiveLayout/ResponsiveDialog.vue";

interface Props {
    isDialogOpen: boolean,
    footer?: string,
    title?: string, // 如果不设置，则不显示标题栏
    titleIcon?: string,
    bottomActions?: Array<dialogBottomAction>,
    isPersistent?: boolean,
    width?: string,
    height?: string,
    guid?: string,
    destroyAfterClose?: boolean,
    HTMLContent?: string,
    useCompactContentOuterMargin?: boolean
}
const props = defineProps<Props>()
const emit = defineEmits(['update:isDialogOpen'])
const dialogStore = useDialogStore()
const isDialogOpen = computed({
    get() {
        return props.isDialogOpen
    },
    set(value) {
        // 检测到对话框关闭
        if (!value && props.destroyAfterClose) {
            dialogStore.remove(props.guid)
        }
        emit('update:isDialogOpen', value)
    }
})

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.v-card {
    padding: 15px;
}
</style>
