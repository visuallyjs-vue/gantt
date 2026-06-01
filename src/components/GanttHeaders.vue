<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, watch } from 'vue'
import { EVENT_DATA_UPDATED, EVENT_ZOOM } from "@visuallyjs/browser-ui"
import {VisuallyJsService, VisuallyJsServiceKey} from "@visuallyjs/browser-ui-vue"
import type { Gantt, TimelineHeaderEntry, TimelineHeaderEntryValue, TimelineHeaderDayEntryValue } from "../defs"
import { getWeekOfYear, millisecondsToDays, MONTH_FORMAT, NARROW_DAY_FORMAT, SHORT_DAY_FORMAT } from "../util"
import { ONE_WEEK_IN_MILLISECONDS, STEP_WIDTH } from "../constants"

const headers = ref<Array<TimelineHeaderEntry>>([])
const dayRange = ref(0)
const gantt = inject<Gantt>('gantt')!
const zoom = ref(1)

const service:VisuallyJsService = inject(VisuallyJsServiceKey)

function _addTimelineDays(headersList: Array<TimelineHeaderEntry>) {
    const days = []
    const formatter = gantt.dayNameFormat === "short" ? SHORT_DAY_FORMAT : NARROW_DAY_FORMAT
    const currentDay = new Date(gantt.minValue())
    while (currentDay.getTime() < gantt.maxValue()) {
        days.push({
            day: currentDay.getDate().toString(),
            start: currentDay.getTime(),
            end: currentDay.getTime(),
            label: formatter.format(currentDay),
            size: STEP_WIDTH,
            id: `day_${days.length}`,
            type: "day"
        } as TimelineHeaderDayEntryValue)
        currentDay.setDate(currentDay.getDate() + 1)
    }

    headersList.unshift({ values: days, id: "day" })
}

function _addTimelineWeeks(headersList: Array<TimelineHeaderEntry>) {
    const weeks = []

    let currentWeekDetails = getWeekOfYear(gantt.minValue())
    const currentWeek = new Date(currentWeekDetails[1])
    let currentWeekMillis = currentWeek.getTime()
    while (currentWeekMillis < gantt.maxValue()) {
        const start = Math.max(gantt.minValue(), currentWeekMillis)
        const end = Math.min(currentWeekMillis + ONE_WEEK_IN_MILLISECONDS, gantt.maxValue())
        weeks.push({
            start,
            end,
            label: `Week ${currentWeekDetails[0]}`,
            size: STEP_WIDTH * millisecondsToDays(end - start),
            id: `week_${weeks.length}`,
            type: "week"
        })
        currentWeekMillis += ONE_WEEK_IN_MILLISECONDS
        currentWeekDetails = getWeekOfYear(currentWeekMillis)
    }

    headersList.unshift({ values: weeks, id: "weeks" })
}

function _addTimelineMonths(headersList: Array<TimelineHeaderEntry>) {
    const months = []
    const currentMonth = new Date(gantt.minValue())
    currentMonth.setDate(1)

    let currentMonthStart = currentMonth.getTime()
    while (currentMonthStart < gantt.maxValue()) {
        const start = Math.max(gantt.minValue(), currentMonthStart)
        const monthName = MONTH_FORMAT.format(new Date(start))

        const nextMonth = new Date(currentMonthStart)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)

        const end = Math.min(gantt.maxValue(), nextMonth.getTime())
        months.push({
            start: start,
            end: end,
            label: monthName,
            size: STEP_WIDTH * millisecondsToDays(end - start),
            id: `month_${start}`,
            type: "month"
        })
        currentMonthStart = nextMonth.getTime()
    }

    headersList.unshift({ values: months, id: "months" })
}

function _addTimelineQuarters(headersList: Array<TimelineHeaderEntry>) {
    const quarters = []

    const startDate = new Date(gantt.minValue())
    startDate.setDate(1)
    const currentMonthValue = startDate.getMonth()
    let currentQuarter = Math.floor(currentMonthValue / 3)

    let startMonthForQuarter = currentQuarter * 3
    startDate.setMonth(startMonthForQuarter)
    startDate.setDate(1)
    let currentQuarterStart = startDate.getTime()

    while (currentQuarterStart < gantt.maxValue()) {
        const start = Math.max(gantt.minValue(), currentQuarterStart)

        currentQuarter = Math.floor(startDate.getMonth() / 3)
        const label = `Q${currentQuarter + 1} ${startDate.getFullYear()}`

        const nextQuarter = new Date(startDate)
        nextQuarter.setMonth(nextQuarter.getMonth() + 3)
        nextQuarter.setDate(1)

        const end = Math.min(gantt.maxValue(), nextQuarter.getTime())
        quarters.push({
            start: start,
            end: end,
            label,
            size: STEP_WIDTH * millisecondsToDays(end - start),
            id: `quarter_${start}`,
            type: "quarter"
        })
        currentQuarterStart = nextQuarter.getTime()
        startDate.setTime(currentQuarterStart)
    }

    headersList.unshift({ values: quarters, id: "quarters" })
}

function repaint() {
    if (gantt != null) {
        dayRange.value = millisecondsToDays(gantt.maxValue() - gantt.minValue())

        const headersList: Array<TimelineHeaderEntry> = []
        if (gantt.showDays) {
            _addTimelineDays(headersList)
        }

        if (gantt.showWeekOfYear) {
            _addTimelineWeeks(headersList)
        }

        if (gantt.showMonthNames) {
            _addTimelineMonths(headersList)
        }

        if (gantt.showQuarter) {
            _addTimelineQuarters(headersList)
        }

        gantt.headerSize = gantt.rowHeight * headersList.length
        headers.value = headersList
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

    gantt.model.bind(EVENT_DATA_UPDATED, repaint)
    repaint()

    onUnmounted(() => {
      if (cleanupZoom) cleanupZoom()
      gantt.model.unbind(EVENT_DATA_UPDATED, repaint)
    })
  })
})

watch(() => gantt, repaint)
</script>

<template>
    <div class="vjs-gantt-timeline-container">
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
