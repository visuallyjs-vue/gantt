<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, watch } from 'vue'
import { EVENT_DATA_UPDATED, EVENT_REDO, EVENT_UNDO, EVENT_ZOOM, type Node } from "@visuallyjs/browser-ui"
import type { Gantt } from "../defs"
import { TYPE_TASK_GROUP } from "../constants"
import { editTask } from "../util"
import {VisuallyJsService, VisuallyJsServiceKey} from "@visuallyjs/browser-ui-vue";

type LabelEntry = { id: string, name: string, indent: number, type: string, collapsed?: boolean }

const entries = ref<Array<LabelEntry>>([])
const gantt = inject<Gantt>('gantt')!
const zoom = ref(1)

const service:VisuallyJsService = inject(VisuallyJsServiceKey)

function repaint() {
    if (gantt != null) {
        requestAnimationFrame(() => {
            const newEntries: Array<LabelEntry> = []

            function _one(entry: Node, indent: number) {
                const collapsed = entry.data['collapsed'] === true
                newEntries.push({ id: entry.id, name: entry.data.name, indent, type: entry.type, collapsed })
                if (!collapsed) {
                    gantt.listSubtasks(entry).forEach(st => _one(st, indent + 1))
                }
            }

            gantt.listTopLevelTasks().forEach(entry => {
                _one(entry, 0)
            })

            entries.value = newEntries
        })
    }
}

let cleanupZoom: (() => void) | null = null

onMounted(async () => {
    service.getSurface((surface) => {
      const zoomHandler = (z: { zoom: number }) => {
        zoom.value = z.zoom
      }
      surface.bind(EVENT_ZOOM, zoomHandler)
      cleanupZoom = () => surface.unbind(EVENT_ZOOM, zoomHandler)

      const undoHandler = () => repaint()
      const redoHandler = () => repaint()
      const updateHandler = () => repaint()

      gantt.model.bind(EVENT_DATA_UPDATED, updateHandler)
      gantt.model.bind(EVENT_UNDO, undoHandler)
      gantt.model.bind(EVENT_REDO, redoHandler)

      repaint()

      onUnmounted(() => {
        if (cleanupZoom) cleanupZoom()
        gantt.model.unbind(EVENT_DATA_UPDATED, updateHandler)
        gantt.model.unbind(EVENT_UNDO, undoHandler)
        gantt.model.unbind(EVENT_REDO, redoHandler)
      })
    })

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
                    <div class="vjs-gantt-task-label-edit" @click.stop="editTask(gantt, entry.id)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </div>
                    <div class="vjs-gantt-task-label-delete" @click.stop="gantt.removeTask(entry.id)">
                        &times;
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
