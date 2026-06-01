<script setup lang="ts">
import { inject } from 'vue'
import type { VueWrapperProps } from "@visuallyjs/browser-ui-vue"
import type { Gantt } from '../defs'
import { BAR_HEIGHT } from '../constants'

const { data, obj } = defineProps<VueWrapperProps>()
const gantt = inject<Gantt>('gantt')!
</script>

<template>
    <div class="vjs-gantt-task-group"
         data-vjs-target="true"
         :style="{
             left: data.left + 'px',
             width: data.size + 'px',
             height: BAR_HEIGHT + 'px',
             backgroundColor: data.color
         }"
         data-vjs-resizable="false"
         data-vjs-not-draggable="true">
        <div class="vjs-gantt-delete" @click="gantt.removeTask(obj.id)">×</div>
        <div class="vjs-gantt-connect" data-vjs-source="true">+</div>
    </div>
</template>
