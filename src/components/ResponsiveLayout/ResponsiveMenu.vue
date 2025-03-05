<template>
    <SingleWidthPointSwitcher :breakpoint="700">
        <template #wide>
            <!-- wide!!! -->
            <v-menu :close-on-content-click="props.closeOnContentClick">
                <template v-slot:activator="{ props }">
                    <slot name="activator" :activator="{ props }"></slot>
                </template>
                <slot name="default"></slot>
            </v-menu>
        </template>
        <template #narrow>
            <!-- narrow!!! -->
            <v-bottom-sheet>
                <template v-slot:activator="{ props }">
                    <slot name="activator" :activator="{ props }"></slot>
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
}

const props = withDefaults(defineProps<Props>(), {
    closeOnContentClick: false,
});

</script>
