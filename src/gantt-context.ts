import { inject, provide, shallowRef, type InjectionKey, type ShallowRef } from 'vue';
import type { Gantt } from './gantt/gantt';

const GanttContextKey: InjectionKey<ShallowRef<Gantt | null>> = Symbol('GanttContext');

export function provideGanttContext() {
    const ganttInstance = shallowRef<Gantt | null>(null);
    provide(GanttContextKey, ganttInstance);
    return ganttInstance;
}

export function useGanttContext() {
    const context = inject(GanttContextKey);
    if (!context) {
        throw new Error('useGanttContext must be used after provideGanttContext');
    }
    return context;
}
