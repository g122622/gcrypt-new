<template>
    <SingleWidthPointSwitcher :breakpoint="700">
        <template #wide>
            <!-- wide!!! -->
            <v-dialog v-bind="$attrs">
                <slot></slot>
            </v-dialog>
        </template>
        <template #narrow>
            <!-- narrow!!! -->
            <v-bottom-sheet style="margin: 10px" v-bind="$attrs">
                <slot></slot>
            </v-bottom-sheet>
        </template>
    </SingleWidthPointSwitcher>
</template>

<script setup lang="ts">
import SingleWidthPointSwitcher from './SingleWidthPointSwitcher.vue';

</script>

<style scoped lang="less"></style>
