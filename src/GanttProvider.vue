<script setup>
import {SurfaceProvider} from "@visuallyjs/browser-ui-vue";
import {provideGanttContext} from "./gantt-context.ts";

provideGanttContext()

</script>
<template>
  <SurfaceProvider>
      <slot/>
  </SurfaceProvider>
</template>
