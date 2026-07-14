import { EVENT_TAP, PlainArrowOverlay, NodeEventCallbackPayload, EdgeEventCallbackPayload } from "@visuallyjs/browser-ui"
import { TYPE_TASK, TYPE_TASK_GROUP, TYPE_MILESTONE } from "./gantt/constants"
import {Gantt} from "./gantt/gantt";
import TaskComponent from "./components/TaskComponent.vue";
import TaskGroupComponent from "./components/TaskGroupComponent.vue";
import MilestoneComponent from "./components/MilestoneComponent.vue";

export function generateView(gantt:Gantt) {
    return {
        nodes: {
            selectable: {
                events: {
                    [EVENT_TAP]: (p: NodeEventCallbackPayload<any>) => {
                        p.model.setSelection(p.obj)
                    }
                }
            },
            [TYPE_TASK]: {
                component: TaskComponent,
                parent: 'selectable'
            },
            [TYPE_TASK_GROUP]: {
                component: TaskGroupComponent,
                parent: 'selectable'
            },
            [TYPE_MILESTONE]: {
                component: MilestoneComponent,
                parent: 'selectable'
            }
        },
        edges: {
            default: {
                overlays: [
                    {
                        type: PlainArrowOverlay.type,
                        options: {
                            location: 1,
                            width: 8,
                            length: 8
                        }
                    }
                ],
                events: {
                    [EVENT_TAP]: (e: EdgeEventCallbackPayload) => {
                        gantt.maybeDeleteDependency(e.obj)
                    }
                }
            }
        }
    }
}
