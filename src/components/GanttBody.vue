<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, watch } from 'vue'
import { DecoratorComponent } from "@visuallyjs/browser-ui-vue"
import { EVENT_DATA_UPDATED } from "@visuallyjs/browser-ui"
import type { Gantt } from "../defs"
import { millisecondsToDays } from "../util"
import { STEP_WIDTH } from "../constants"

type DayEntry = {
    clazz: string,
    left: number,
    size: number,
    height: number,
    id: number
}

const CLASS_DAY_STRIPE = "vjs-gantt-day-stripe"
const CLASS_DAY_STRIPE_ALT = "vjs-gantt-day-stripe-alt"

const days = ref<Array<DayEntry>>([])
const rightNowLine = ref(0)
const gantt = inject<Gantt>('gantt')!

function repaint() {
    if (gantt != null) {
        const min = gantt.minValue(), max = gantt.maxValue()
        const stripeHeight = (gantt.model.getNodes().length * gantt.rowHeight) * gantt.getZoom()
        const dayRange = millisecondsToDays(max - min)

        const newDays: Array<DayEntry> = []
        let flipflop = false
        for (let i = 0; i < dayRange; i++) {
            newDays.push({
                clazz: flipflop ? CLASS_DAY_STRIPE : CLASS_DAY_STRIPE_ALT,
                left: i * STEP_WIDTH,
                size: STEP_WIDTH,
                height: stripeHeight,
                id: i
            })
            flipflop = !flipflop
        }
        days.value = newDays

        const rightNow = new Date().getTime()
        if (min < rightNow && max > rightNow) {
            const xLocDays = millisecondsToDays(rightNow - min)
            rightNowLine.value = xLocDays * STEP_WIDTH
        }
    }
}

onMounted(() => {
    gantt.model.bind(EVENT_DATA_UPDATED, repaint)
    repaint()

    onUnmounted(() => {
        gantt.model.unbind(EVENT_DATA_UPDATED, repaint)
    })
})

watch(() => gantt, repaint)
</script>

<template>
    <DecoratorComponent placement="fixed" :position="{ x: 0, y: 0 }">
        <div v-if="gantt != null" class="vjs-gantt-day-stripes">
            <div v-for="day in days" :key="day.id" :class="day.clazz" :style="{ flexBasis: day.size + 'px', height: day.height + 'px' }"></div>
        </div>
    </DecoratorComponent>
    <DecoratorComponent placement="fixed" :position="{ x: 0, y: 0 }">
        <div v-if="gantt != null" class="vjs-gantt-right-now" :style="{ left: rightNowLine + 'px', height: (gantt.model.getNodes().length * gantt.rowHeight) + 'px' }"></div>
    </DecoratorComponent>
</template>
