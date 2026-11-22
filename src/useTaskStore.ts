import { useCallback, useState } from 'react'
import { applyAction, type Filter, type Task } from './tasks'
import { loadState, saveState } from './storage'

export class SaveError extends Error {}

export class LoadError extends Error {
  constructor() {
    super('Не удалось загрузить сохранённые задачи. Исходные данные сохранены')
  }
}

export function useTaskStore(storage: Storage) {
  // Исходное значение localStorage не перезаписывается: при ошибке загрузки
  // запись заблокирована до успешной загрузки восстановленных данных.
  const [loadError, setLoadError] = useState<LoadError | null>(null)
  const [state, setState] = useState(() => {
    const result = loadState(storage)
    if (result.kind === 'loaded') return result.state
    if (result.kind === 'error') {
      setLoadError(new LoadError())
      return { tasks: [] as Task[], nextId: 1 }
    }
    return { tasks: [] as Task[], nextId: 1 }
  })
  const [filter, setFilter] = useState<Filter>('all')

  const mutate = useCallback(
    (action: Parameters<typeof applyAction>[1]) => {
      if (loadError !== null) throw loadError
      const snapshot = state
      const next = applyAction(state, action)
      try {
        saveState(storage, next)
      } catch (error) {
        throw new SaveError(error instanceof Error ? error.message : 'Не удалось сохранить изменения.')
      }
      setState(next)
      void snapshot
    },
    [state, storage, loadError],
  )

  const add = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return false
      mutate({ type: 'add', name: trimmed })
      return true
    },
    [mutate],
  )

  const toggle = useCallback((id: number) => mutate({ type: 'toggle', id }), [mutate])

  const remove = useCallback((id: number) => mutate({ type: 'delete', id }), [mutate])

  return {
    tasks: state.tasks,
    nextId: state.nextId,
    filter,
    setFilter,
    add,
    toggle,
    remove,
    loadError,
  }
}
