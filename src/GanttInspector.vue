<script setup lang="ts">
import {computed, ref} from 'vue'
import { InspectorComponent } from '@visuallyjs/browser-ui-vue'
import type { Base, Surface } from '@visuallyjs/browser-ui'
import { TYPE_TASK, TYPE_TASK_GROUP } from './gantt/constants'

const current = ref<Base|null>(null)
const progress = computed(() => current == null ? 0 : (current.data as any).progress | 0)

// const currentObj = ref<Base | null>(null)
// const currentType = ref('')
// const progress = ref(0)
//
// function renderEmptyContainer() {
//     currentType.value = ''
//     currentObj.value = null
// }
//
// function refresh(obj: Base) {
//     currentType.value = obj.type
//     currentObj.value = obj
//     progress.value = (obj.data as any).progress || 0
// }

function afterUpdate(surface: Surface) {
    surface.relayout()
}

function onProgressInput(e: Event) {
    //progress.value = (e.target as HTMLInputElement).valueAsNumber
  console.log((e.target as HTMLInputElement).valueAsNumber)
}
</script>

<template>
    <InspectorComponent class="vjs-gantt-inspector"
                        v-model="current"
                        :showCloseButton="true"
                        :afterUpdate="afterUpdate">
        <template v-if="current?.type === TYPE_TASK">
            <div>Name</div>
            <input type="text" vjs-att="name" vjs-focus="true"/>
            <div>Progress</div>
            <div style="display:flex;align-items:center">
                <input type="range" vjs-att="progress" min="0" max="100" :value="current?.data?.progress || 0" @input="onProgressInput"/>
                <div class="vjs-gantt-progress-value-label">{{ progress }}</div>
            </div>
        </template>
        <template v-if="current?.type === TYPE_TASK_GROUP">
            <div>Name</div>
            <input type="text" vjs-att="name" vjs-focus="true"/>
        </template>
    </InspectorComponent>
</template>
