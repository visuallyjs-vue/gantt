<script setup lang="ts">
import {ref, inject, onMounted, watch} from 'vue'
import {
  newInstance,
  SurfaceComponent, useSurface,
  VisuallyJsService,
  VisuallyJsServiceKey
} from '@visuallyjs/browser-ui-vue'
import {
    registerParser, registerExporter, registerDecorator
} from "@visuallyjs/browser-ui"
import { GanttParser } from './gantt/parser'
import { GanttExporter } from './gantt/exporter'
import { subtaskDataset } from './gantt/data-generator'
import { createRenderOptions } from './gantt/render-options'
import { generateView } from './view-options'
import modelOptions from './gantt/model-options'
import { GANTT } from './gantt/constants'
import { Gantt } from './gantt/gantt'
import type {GanttOptions} from './gantt/defs'
import {useGanttContext} from "./gantt-context";

const {options} = defineProps(['options'])

const ganttInstance = useGanttContext()

registerParser(GANTT, GanttParser)
registerExporter(GANTT, GanttExporter)

let _model = newInstance(modelOptions)
const _surface = useSurface()

const gantt = new Gantt(options || ({} as GanttOptions), _model, () => _surface.value)

const renderOptions = ref<any>()
const viewOptions = ref<any>()

renderOptions.value = createRenderOptions(gantt)
viewOptions.value = generateView(gantt)

gantt.load(subtaskDataset(), () => {
  ganttInstance.value = gantt
})

</script>

<template>
    <SurfaceComponent
        v-if="renderOptions"
        class="vjs-gantt-canvas"
        :renderOptions="renderOptions"
        :viewOptions="viewOptions"
        :model="_model"
    />
</template>
