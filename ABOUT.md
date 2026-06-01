### About this Demo

This Vue application demonstrates a highly customized **Gantt Chart** built with **VisuallyJS**.

### VisuallyJS Components Used

The demo utilizes several components from the `@visuallyjs/browser-ui-vue` package:

- **SurfaceProvider**: Provides the VisuallyJS context.
- **SurfaceComponent**: Used within `GanttChart.vue` to render the timeline bars and tasks.

The Gantt implementation also makes extensive use of the VisuallyJS core API through the `VisuallyJsService` to manage the data model, parsers, exporters, and decorators.

### Component Options

The `SurfaceComponent` in the Gantt demo is configured with:

- **renderOptions**: Custom rendering options tailored for a Gantt timeline.
- **viewOptions**: Defines the visual representation of tasks, task groups, and milestones.
- **modelOptions**: Configures the data model behavior for Gantt-specific data.

### CSS Requirement

For the VisuallyJS components to render correctly, the standard VisuallyJS stylesheet must be included in the project. In this demo, it is imported in `src/main.ts`:

```typescript
import "@visuallyjs/browser-ui/css/visuallyjs.css"
```
