<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useZoom } from "@visuallyjs/browser-ui-vue"
import type { TimelineHeaderEntry, TimelineHeaderDayEntryValue } from "../gantt/defs"
import { STEP_WIDTH } from "../gantt/constants"
import { useGanttContext } from '../gantt-context'

const headers = ref<Array<TimelineHeaderEntry>>([])
const dayRange = ref(0)

const gantt = useGanttContext()
const zoom = useZoom()

function repaint() {
    if (gantt.value != null) {
      headers.value = gantt.value.headers
      dayRange.value = gantt.value.dayRange
    }
}

onMounted(() => {
    if (gantt.value) {
        gantt.value.bind("update", repaint)
        repaint()

        onUnmounted(() => {
            gantt.value.unbind("update", repaint)
        })
    }
})

watch(() => gantt, repaint)
</script>

<template>
    <div v-if="gantt != null" class="vjs-gantt-timeline-container">
        <div class="vjs-gantt-timeline" :style="{ width: (dayRange * STEP_WIDTH) + 'px' }">
            <div v-for="header in headers" :key="header.id" :class="['vjs-gantt-timeline-row', 'vjs-gantt-timeline-' + header.id]">
                <div v-for="value in header.values" :key="value.id" class="vjs-gantt-timeline-entry" :style="{ flexBasis: (value.size * zoom) + 'px', height: gantt.rowHeight + 'px' }">
                    <template v-if="value.type === 'day'">
                        <template v-if="gantt.showDayName && gantt.showDayNumber">
                            <span>{{ (value as TimelineHeaderDayEntryValue).day }}</span>
                            <span class="vjs-gantt-day-name">{{ value.label }}</span>
                        </template>
                        <template v-else-if="!gantt.showDayName && gantt.showDayNumber">
                            <span>{{ (value as TimelineHeaderDayEntryValue).day }}</span>
                        </template>
                        <template v-else-if="!gantt.showDayNumber">
                            <span>{{ value.label }}</span>
                        </template>
                    </template>
                    <template v-else>
                        {{ value.label }}
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
