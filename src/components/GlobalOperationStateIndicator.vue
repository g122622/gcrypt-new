<template>
    <transition-group name="msg-transition">
        <div id="global-operation-state-indicator-container" v-if="shouldDisplay">
            <transition-group name="msg-transition">
                <v-alert v-if="globalOperationState == '就绪'" density="compact" color="success" icon="$success"
                    :text="globalOperationState"></v-alert>
                <v-alert v-else density="compact" type="warning" :text="globalOperationState"></v-alert>
            </transition-group>
        </div>
    </transition-group>
</template>

<script setup lang="ts">
import { watch, onMounted, ref } from "vue"
import emitter from "@/eventBus";

const globalOperationState = ref("就绪");
const shouldDisplay = ref(false); // 如果3秒内状态保持为“就绪”，则不显示。使用setTimeout来实现。
let timeoutId = null;
watch(globalOperationState, (newValue) => {
    if (newValue === "就绪") {
        timeoutId = setTimeout(() => {
            shouldDisplay.value = false;
        }, 3000);
    } else {
        clearTimeout(timeoutId);
        timeoutId = null;
        shouldDisplay.value = true;
    }
})

onMounted(() => {
    emitter.on("globalOperationStateChanged", (state: string) => {
        globalOperationState.value = state;
    })
})

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
#global-operation-state-indicator-container {
    position: fixed;
    bottom: 10px;
    // 居中
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    transition: all 0.3s ease-in-out;

    // 圆角
    .v-alert {
        border-radius: 15px;
    }
}

.msg-transition-enter-active {
    transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.msg-transition-leave-active {
    transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.msg-transition-enter-from,
.msg-transition-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}
</style>
