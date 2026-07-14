<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { DecoratorComponent, useZoom } from "@visuallyjs/browser-ui-vue"
import { useGanttContext } from '../gantt-context'
import {DayEntry} from "../gantt/defs";

const days = ref<Array<DayEntry>>([])
const rightNowLine = ref(0)
const gantt = useGanttContext()

const zoom = useZoom()

function repaint() {

    if (gantt != null) {
      days.value = gantt.value.days
      rightNowLine.value = gantt.value.rightNow
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
watch(zoom, repaint)
</script>

<template>
    <template v-if="gantt != null">
        <DecoratorComponent placement="fixed" :position="{ x: 0, y: 0 }">
            <div class="vjs-gantt-day-stripes">
                <div v-for="day in days" :key="day.id" :class="day.clazz" :style="{ flexBasis: (day.size * zoom) + 'px', height: day.height + 'px' }"></div>
            </div>
        </DecoratorComponent>
        <DecoratorComponent placement="fixed" :position="{ x: 0, y: 0 }">
            <div class="vjs-gantt-right-now" :style="{ top:0, left: (rightNowLine * zoom) + 'px', height: (gantt.model.getNodes().length * gantt.rowHeight * zoom) + 'px' }"></div>
        </DecoratorComponent>
    </template>
</template>
