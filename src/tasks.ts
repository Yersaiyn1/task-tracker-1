export type TaskStatus = 'todo' | 'done'

export interface Task {
  id: number
  name: string
  status: TaskStatus
}

export type Filter = 'all' | 'todo' | 'done'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'К выполнению',
  done: 'Выполнена',
}

export function filterTasks(tasks: Task[], filter: Filter): Task[] {
  if (filter === 'all') return tasks
  return tasks.filter((task) => task.status === filter)
}

export function applyAction(
  state: { tasks: Task[]; nextId: number },
  action:
    | { type: 'add'; name: string }
    | { type: 'toggle'; id: number }
    | { type: 'delete'; id: number },
): { tasks: Task[]; nextId: number } {
  switch (action.type) {
    case 'add': {
      const name = action.name.trim()
      if (!name) return state
      const task: Task = { id: state.nextId, name, status: 'todo' }
      return { tasks: [...state.tasks, task], nextId: state.nextId + 1 }
    }
    case 'toggle':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id
            ? { ...task, status: task.status === 'done' ? 'todo' : 'done' }
            : task,
        ),
      }
    case 'delete':
      // ID удалённых задач не используются повторно: nextId только растёт.
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) }
  }
}
