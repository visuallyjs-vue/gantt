<script setup lang="ts">
import GanttChart from './GanttChart.vue'
import GanttControls from './GanttControls.vue'
import GanttLabels from './components/GanttLabels.vue'
import GanttHeaders from './components/GanttHeaders.vue'
import GanttBody from './components/GanttBody.vue'

import GanttProvider from "./GanttProvider.vue";

</script>

<template>
  <GanttProvider>
    <div class="vjs-gantt-main">
      <GanttControls/>
      <div class="vjs-gantt-body">
        <GanttLabels/>
        <div style="display:flex; flex-grow:1; flex-direction:column" class="vjs-gantt-body-content">
          <GanttHeaders/>
          <GanttChart/>
        </div>
        <GanttBody/>
      </div>
    </div>
  </GanttProvider>
</template>
