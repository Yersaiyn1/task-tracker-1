import type { Task } from './tasks'

const STORAGE_KEY = 'tasks'

export interface StoredState {
  tasks: Task[]
  nextId: number
}

export class StorageUnavailableError extends Error {}

export type LoadResult =
  | { kind: 'missing' }
  | { kind: 'loaded'; state: StoredState }
  | { kind: 'error' }

export function loadState(storage: Pick<Storage, 'getItem'>): LoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { kind: 'error' }
  }
  if (raw === null) return { kind: 'missing' }

  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return { kind: 'error' }
    const { tasks, nextId } = data as Record<string, unknown>
    if (!Array.isArray(tasks)) return { kind: 'error' }
    const parsed: Task[] = []
    const seenIds = new Set<number>()
    let maxId = 0
    for (const item of tasks) {
      if (typeof item !== 'object' || item === null) continue
      const { id, name, status } = item as Record<string, unknown>
      if (typeof id !== 'number' || !Number.isInteger(id) || typeof name !== 'string') continue
      if (status !== 'todo' && status !== 'done') continue
      if (seenIds.has(id)) return { kind: 'error' }
      seenIds.add(id)
      parsed.push({ id, name, status })
      if (id > maxId) maxId = id
    }
    const storedNextId =
      typeof nextId === 'number' && Number.isInteger(nextId) ? nextId : maxId + 1
    // nextId только растёт: ID удалённых задач не переиспользуются.
    return { kind: 'loaded', state: { tasks: parsed, nextId: Math.max(storedNextId, maxId + 1, 1) } }
  } catch {
    return { kind: 'error' }
  }
}

export function saveState(
  storage: Pick<Storage, 'setItem'>,
  state: StoredState,
): void {
  let raw: string
  try {
    raw = JSON.stringify(state)
  } catch {
    throw new StorageUnavailableError('Не удалось сохранить изменения.')
  }
  try {
    storage.setItem(STORAGE_KEY, raw)
  } catch {
    throw new StorageUnavailableError('Не удалось сохранить изменения. Проверьте настройки хранилища браузера.')
  }
}
