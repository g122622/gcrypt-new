<template>
    <SingleWidthPointSwitcher :breakpoint="700">
        <template #wide>
            <!-- wide!!! -->
            <v-menu :close-on-content-click="props.closeOnContentClick" :location="props.location">
                <template v-slot:activator="{ props }">
                    <slot name="activator" :props="props"></slot>
                </template>
                <slot name="default"></slot>
            </v-menu>
        </template>
        <template #narrow>
            <!-- narrow!!! -->
            <v-bottom-sheet>
                <template v-slot:activator="{ props }">
                    <slot name="activator" :props="props"></slot>
                </template>
                <slot name="default"></slot>
            </v-bottom-sheet>
        </template>
    </SingleWidthPointSwitcher>
</template>

<script setup lang="ts">
import SingleWidthPointSwitcher from './SingleWidthPointSwitcher.vue';

interface Props {
    closeOnContentClick?: boolean;
    location?: "end" | "start" | "top" | "bottom";
}

const props = withDefaults(defineProps<Props>(), {
    closeOnContentClick: false,
    location: undefined
});

</script>

<style scoped lang="less"></style>
