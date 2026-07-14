<script setup lang="ts">
import type { VueWrapperProps } from "@visuallyjs/browser-ui-vue"
import { useGanttContext } from '../gantt-context'
import { BAR_HEIGHT } from "../gantt/constants"

const { data, vertex } = defineProps<VueWrapperProps>()
const gantt  = useGanttContext()
</script>

<template>
    <div class="vjs-gantt-task"
         data-vjs-target="true"
         :style="{
             left: data.left + 'px',
             width: data.size + 'px',
             height: BAR_HEIGHT + 'px',
             backgroundColor: data.color
         }"
         data-vjs-y-resize="false"
         data-vjs-show-progress="true">
        <div class="vjs-gantt-progress-value">{{ data.progress }}</div>
        <div class="vjs-gantt-progress-gauge" :style="{ width: data.progress + '%' }"></div>
        <div class="vjs-gantt-delete" @click="gantt.removeTask(vertex.id)">×</div>
        <div class="vjs-gantt-connect" data-vjs-source="true">+</div>
    </div>
</template>
