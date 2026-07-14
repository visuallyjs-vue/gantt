<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch, computed } from 'vue'
import { EVENT_DATA_UPDATED, EVENT_REDO, EVENT_UNDO, type Node } from "@visuallyjs/browser-ui"
import { TYPE_TASK_GROUP } from "../gantt/constants"
import { VisuallyJsService, VisuallyJsServiceKey, useZoom } from "@visuallyjs/browser-ui-vue";
import { useGanttContext } from '../gantt-context'
import {LabelEntry} from "../gantt/defs";

const entries = ref<Array<LabelEntry>>([])
const gantt = useGanttContext()
const zoom = useZoom()

function repaint() {
    if (gantt.value != null) {
      entries.value = gantt.value.labels
    }
}

onMounted(() => {
    if (gantt.value) {
        const updateHandler = () => repaint()

        gantt.value.bind("update", updateHandler)

        repaint()

        onUnmounted(() => {
          gantt.value.unbind("update", updateHandler)
        })
    }
})

watch(() => gantt, repaint)
</script>

<template>
    <div v-if="gantt != null" class="vjs-gantt-task-labels-container">
        <div class="vjs-gantt-task-labels">
            <div :style="{ height: gantt.headerSize + 'px', top: 0, backgroundColor: 'white', position: 'sticky' }"></div>
            <div v-for="entry in entries" :key="entry.id" :data-vjs-type="entry.type" class="vjs-gantt-task-label" :style="{ height: (gantt.rowHeight * zoom) + 'px', marginLeft: entry.indent + 'rem' }">
                <div v-if="entry.type === TYPE_TASK_GROUP" class="vjs-gantt-task-group-toggle" @click="gantt.toggleCollapse(entry.id)">
                    {{ entry.collapsed ? '+' : '-' }}
                </div>
                {{ entry.name }}
                <div class="vjs-gantt-task-label-controls">
                    <div class="vjs-gantt-task-label-edit" @click.stop="gantt.editTask(entry.id)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
