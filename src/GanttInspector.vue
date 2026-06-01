<script setup lang="ts">
import { ref } from 'vue'
import { InspectorComponent } from '@visuallyjs/browser-ui-vue'
import type { Base, Surface } from '@visuallyjs/browser-ui'
import { TYPE_TASK, TYPE_TASK_GROUP } from './constants'

const currentObj = ref<Base | null>(null)
const currentType = ref('')
const progress = ref(0)

function renderEmptyContainer() {
    currentType.value = ''
    currentObj.value = null
}

function refresh(obj: Base) {
    currentType.value = obj.type
    currentObj.value = obj
    progress.value = (obj.data as any).progress || 0
}

function afterUpdate(surface: Surface) {
    surface.relayout()
}

function onProgressInput(e: Event) {
    progress.value = (e.target as HTMLInputElement).valueAsNumber
}
</script>

<template>
    <InspectorComponent class="vjs-gantt-inspector"
                        :refresh="refresh"
                        :renderEmptyContainer="renderEmptyContainer"
                        :showCloseButton="true"
                        :afterUpdate="afterUpdate">
        <template v-if="currentType === TYPE_TASK">
            <div>Name</div>
            <input type="text" vjs-att="name" vjs-focus="true"/>
            <div>Progress</div>
            <div style="display:flex;align-items:center">
                <input type="range" vjs-att="progress" min="0" max="100" :value="currentObj?.data?.progress || 0" @input="onProgressInput"/>
                <div class="vjs-gantt-progress-value-label">{{ progress }}</div>
            </div>
        </template>
        <template v-if="currentType === TYPE_TASK_GROUP">
            <div>Name</div>
            <input type="text" vjs-att="name" vjs-focus="true"/>
        </template>
    </InspectorComponent>
</template>
