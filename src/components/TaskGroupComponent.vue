<script setup lang="ts">
import type { VueWrapperProps } from "@visuallyjs/browser-ui-vue"
import { BAR_HEIGHT } from '../gantt/constants'
import { useGanttContext } from '../gantt-context'

const { data, vertex } = defineProps<VueWrapperProps>()
const gantt = useGanttContext()
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
    </div>
</template>
