<script setup lang="ts">
import { ref, provide, inject } from 'vue'
import {
    SurfaceComponent,
    VisuallyJsService,
    VisuallyJsServiceKey
} from '@visuallyjs/browser-ui-vue'
import type { BrowserUIVueModel } from '@visuallyjs/browser-ui-vue'
import {
    registerParser, registerExporter, registerDecorator,
    RandomColorGenerator, type Node,
    EVENT_NODE_REMOVED, EVENT_NODE_UPDATED,
    EVENT_UNDO, EVENT_REDO,
    APPEND_TO_CURRENT, VERTEX_UPDATE_REASON_MOVED,
    type NodeRemovedParams, type VertexUpdatedParams, type Surface
} from "@visuallyjs/browser-ui"
import { GanttParser } from './parser'
import { GanttExporter } from './exporter'
import { GanttDecorator } from './decorator'
import { subtaskDataset } from './data-generator'
import { createRenderOptions } from './render-options'
import { generateView } from './view-options'
import modelOptions from './model-options'
import {
    BAR_HEIGHT, GANTT, ONE_DAY_IN_MILLISECONDS,
    ROW_HEIGHT, STEP_WIDTH, TYPE_TASK_GROUP
} from './constants'
import { millisecondsToDays, pixelsToMilliseconds, today } from './util'
import type { Gantt, ParsedTask, TaskEntry } from './defs'

const _model = ref<BrowserUIVueModel>()
const _surface = ref<Surface>()

const colorGenerator = new RandomColorGenerator()
const entries: Array<TaskEntry> = []
const entryMap = new Map<string, TaskEntry>()
const minValue = ref(today())
const maxValue = ref(today())

function _addTask(data: ParsedTask) {
    if (data.parent != null && entryMap.get(data.parent) == null) {
        throw `Cannot add subtask ${data.name} to parent ${data.parent}; parent does not exist`
    }
    const dayRange = Math.floor((data.end - data.start) / ONE_DAY_IN_MILLISECONDS)
    const t = Object.assign(data as any, {
        dayRange,
        left: ((data.start - minValue.value) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
        size: dayRange * STEP_WIDTH
    })
    const vertex = _model.value!.addNode(t)
    const newEntry: TaskEntry = { node: vertex, subtasks: [], id: vertex.id }
    entryMap.set(vertex.id, newEntry)
    if (vertex.data['parent'] != null) {
        entryMap.get(vertex.data['parent'])!.subtasks.push(newEntry)
    } else {
        entries.push(newEntry)
    }
}

function _removeTask(taskId: string, noNeedToConfirm?: boolean) {
    const entry = entryMap.get(taskId)
    if (entry != null) {
        const confirmationMessage = entry.node.type === 'task' ?
            `Delete task ${entry.node.data['name']} ?` :
            entry.node.type === 'taskGroup' ?
                `Delete task group ${entry.node.data['name']} ? Group and all subtasks will be deleted!` :
                `Delete milestone ${entry.node.data['name']} ?`

        if (noNeedToConfirm || confirm(confirmationMessage)) {
            const tasks: Array<Node> = [], groups: Array<Node> = []
            const _one = (e: TaskEntry) => {
                if (e.node.type === 'task') tasks.unshift(e.node)
                else groups.unshift(e.node)
                e.subtasks.forEach(st => _one(st))
            }
            _one(entry)
            _model.value!.transaction(() => {
                tasks.forEach(t => _model.value!.removeNode(t))
                groups.forEach(t => _model.value!.removeNode(t))
            })
            _relayoutTasks()
        }
    }
}

function _recalculateTaskDuration(taskGroupId: string): { start: number, end: number } {
    const entry = entryMap.get(taskGroupId)!
    let start = entry.node.data['type'] === TYPE_TASK_GROUP ? Infinity : entry.node.data['start']
    let end = entry.node.data['type'] === TYPE_TASK_GROUP ? -Infinity : entry.node.data['end']
    if (entry.subtasks && entry.subtasks.length > 0) {
        entry.subtasks.forEach(st => {
            const std = _recalculateTaskDuration(st.id)
            start = Math.min(start, std.start)
            end = Math.max(end, std.end)
        })
    }
    return { start, end }
}

function _recalc(vertex: Node) {
    let taskGroupId = vertex.data['parent']
    while (taskGroupId != null) {
        const { start, end } = _recalculateTaskDuration(taskGroupId)
        const dayRange = Math.floor((end - start) / ONE_DAY_IN_MILLISECONDS)
        _model.value!.updateNode(taskGroupId, {
            start, end, dayRange,
            left: ((start - minValue.value) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
            size: dayRange * STEP_WIDTH
        })
        const taskGroup = _model.value!.getNode(taskGroupId)
        taskGroupId = taskGroup.data['parent']
    }
    _computeExtents()
}

function _computeExtents() {
    let _min = minValue.value, _max = maxValue.value
    const _one = (entry: TaskEntry) => {
        _min = Math.min(_min, entry.node.data['start'])
        _max = Math.max(_max, entry.node.data['end'])
        entry.subtasks.forEach(_one)
    }
    entries.forEach(_one)
    minValue.value = _min
    maxValue.value = _max
}

function _relayoutTasks() {
    let y = 0
    _model.value!.transaction(() => {
        const _one = (entry: TaskEntry) => {
            const collapsed = entry.node.data['collapsed'] === true
            _model.value!.updateNode(entry.id, { top: y + ((ROW_HEIGHT - BAR_HEIGHT) / 2) })
            y += ROW_HEIGHT
            if (!collapsed) {
                entry.subtasks.forEach(_one)
            }
        }
        entries.forEach(_one)
    }, APPEND_TO_CURRENT)
    _surface.value!.relayout()
}

function _nodeRemoved(n: Node) {
    const entry = entryMap.get(n.id)
    if (entry != null) {
        if (entry.node.data['parent'] != null) {
            const parentEntry = entryMap.get(entry.node.data['parent'])
            if (parentEntry) {
                parentEntry.subtasks = parentEntry.subtasks.filter(st => st.id !== n.id)
            }
        }
        const idx = entries.findIndex(e => e.id === n.id)
        if (idx !== -1) entries.splice(idx, 1)
        entryMap.delete(n.id)
    }
}

function _taskMoved(p: VertexUpdatedParams) {
    const startMillis = minValue.value + pixelsToMilliseconds(p.vertex.data['left'])
    const endMillis = startMillis + pixelsToMilliseconds(p.vertex.data['size'])
    const dayRange = millisecondsToDays(endMillis - startMillis)
    minValue.value = Math.min(startMillis, minValue.value)
    maxValue.value = Math.max(endMillis, maxValue.value)
    _model.value!.updateNode(p.vertex, { start: startMillis, end: endMillis, dayRange })
    _recalc(p.vertex as Node)
    _surface.value!.relayout()
}

const gantt: Gantt = {
    assignColor: () => colorGenerator.generate(),
    barHeight: BAR_HEIGHT,
    minValue: () => minValue.value,
    maxValue: () => maxValue.value,
    rowHeight: ROW_HEIGHT,
    addTask: _addTask,
    removeTask: _removeTask,
    showDays: true,
    showWeekOfYear: true,
    showMonthNames: true,
    showQuarter: true,
    showDayName: true,
    showDayNumber: true,
    dayNameFormat: 'short',
    exportToConsole: () => console.log(JSON.stringify(_model.value?.exportData({ type: GANTT, parameters: { gantt } }), null, 2)),
    relayoutTasks: _relayoutTasks,
    get model() { return _model.value! },
    headerSize: ROW_HEIGHT * 2,
    toggleCollapse: (taskId: string) => {
        const node = _model.value!.getNode(taskId)
        if (node) {
            _model.value!.updateNode(taskId, { collapsed: node.data['collapsed'] !== true })
            _relayoutTasks()
        }
    },
    listTopLevelTasks: () => entries.map(e => e.node),
    listSubtasks: (entry: Node) => {
        const e = entryMap.get(entry.id)
        return e ? e.subtasks.map(st => st.node) : []
    },
    getTask: (id: string) => _model.value?.getNode(id) || null,
    zoomIn: () => _surface.value?.zoomIn(),
    zoomOut: () => _surface.value?.zoomOut(),
    getZoom: () => _surface.value?.getZoom() || 1
}

provide('gantt', gantt)

registerParser(GANTT, GanttParser)
registerExporter(GANTT, GanttExporter)
registerDecorator(GANTT, GanttDecorator)

const renderOptions = createRenderOptions(minValue, _recalc)
const viewOptions = generateView()

const vjsService = inject<VisuallyJsService>(VisuallyJsServiceKey as any)!

vjsService.getModel((model: BrowserUIVueModel) => {
    _model.value = model

    model.bind<NodeRemovedParams>(EVENT_NODE_REMOVED, (p: NodeRemovedParams) => {
        _nodeRemoved(p.node)
    })

    model.bind<VertexUpdatedParams>(EVENT_NODE_UPDATED, (p: VertexUpdatedParams) => {
        if (p.reason === VERTEX_UPDATE_REASON_MOVED) {
            _taskMoved(p)
        }
    })

    const undoHandler = () => {
        _computeExtents()
        _surface.value?.relayout()
    }
    const redoHandler = () => {
        _computeExtents()
        _surface.value?.relayout()
    }

    model.bind(EVENT_UNDO, undoHandler)
    model.bind(EVENT_REDO, redoHandler)
})

vjsService.getSurface((surface: Surface) => {
    _surface.value = surface

    entries.length = 0
    entryMap.clear()
    minValue.value = today()
    maxValue.value = today()

    surface.model.load({
        data: subtaskDataset(),
        type: GANTT,
        onload: () => { _computeExtents() },
        parameters: { gantt }
    })
})
</script>

<template>
    <SurfaceComponent
        class="vjs-gantt-canvas"
        :render-options="renderOptions"
        :view-options="viewOptions"
        :model-options="modelOptions"
    />
</template>
