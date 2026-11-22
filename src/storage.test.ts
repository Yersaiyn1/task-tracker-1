import { describe, expect, it, vi } from 'vitest'
import {
  loadState,
  saveState,
  StorageUnavailableError,
  type LoadResult,
  type StoredState,
} from './storage'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => map.delete(key),
    setItem: (key: string, value: string) => map.set(key, value),
  } satisfies Storage
}

const validState: StoredState = {
  tasks: [{ id: 1, name: 'Запустить тесты', status: 'done' }],
  nextId: 5,
}

describe('loadState', () => {
  it('отсутствующая запись даёт kind: missing — новый пустой список', () => {
    const result = loadState(memoryStorage())
    expect(result).toEqual({ kind: 'missing' })
  })

  it('корректные данные с уникальными ID успешно загружаются', () => {
    const storage = memoryStorage()
    storage.setItem('tasks', JSON.stringify(validState))
    const result: LoadResult = loadState(storage)
    expect(result).toEqual({ kind: 'loaded', state: validState })
  })

  it('повреждённый JSON даёт kind: error', () => {
    const storage = memoryStorage()
    storage.setItem('tasks', '{это не json')
    expect(loadState(storage)).toEqual({ kind: 'error' })
  })

  it('ошибка getItem даёт kind: error', () => {
    const storage = memoryStorage()
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied')
    })
    expect(loadState(storage)).toEqual({ kind: 'error' })
  })

  it('повторяющиеся ID дают kind: error', () => {
    const storage = memoryStorage()
    storage.setItem(
      'tasks',
      JSON.stringify({
        tasks: [
          { id: 1, name: 'Первая', status: 'todo' },
          { id: 1, name: 'Дубль', status: 'done' },
        ],
        nextId: 3,
      }),
    )
    expect(loadState(storage)).toEqual({ kind: 'error' })
  })

  it('уникальные, но неупорядоченные ID загружаются без ошибки', () => {
    const storage = memoryStorage()
    storage.setItem(
      'tasks',
      JSON.stringify({
        tasks: [
          { id: 5, name: 'Пятая', status: 'todo' },
          { id: 2, name: 'Вторая', status: 'done' },
        ],
        nextId: 9,
      }),
    )
    expect(loadState(storage)).toEqual({
      kind: 'loaded',
      state: {
        tasks: [
          { id: 5, name: 'Пятая', status: 'todo' },
          { id: 2, name: 'Вторая', status: 'done' },
        ],
        nextId: 9,
      },
    })
  })

  it('отбрасывает записи с неверным форматом, но восстанавливает корректные', () => {
    const storage = memoryStorage()
    storage.setItem(
      'tasks',
      JSON.stringify({
        tasks: [
          { id: 2, name: 'Хорошая', status: 'todo' },
          { id: 'плохой', name: 'Плохая', status: 'todo' },
          { id: 3, name: 'Без статуса' },
        ],
        nextId: 10,
      }),
    )
    expect(loadState(storage)).toEqual({
      kind: 'loaded',
      state: {
        tasks: [{ id: 2, name: 'Хорошая', status: 'todo' }],
        nextId: 10,
      },
    })
  })

  it('гарантирует, что nextId больше максимального ID, даже если в файле он меньше', () => {
    const storage = memoryStorage()
    storage.setItem(
      'tasks',
      JSON.stringify({ tasks: [{ id: 7, name: 'Задача', status: 'todo' }], nextId: 2 }),
    )
    expect(loadState(storage)).toMatchObject({ kind: 'loaded', state: { nextId: 8 } })
  })
})

describe('saveState', () => {
  it('сохраняет состояние в хранилище', () => {
    const storage = memoryStorage()
    saveState(storage, validState)
    expect(JSON.parse(storage.getItem('tasks')!)).toEqual(validState)
  })

  it('бросает ошибку записи, если хранилище недоступно', () => {
    const storage = memoryStorage()
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => saveState(storage, validState)).toThrow(StorageUnavailableError)
  })

  it('сообщение об ошибке записи понятно пользователю', () => {
    const storage = memoryStorage()
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => saveState(storage, validState)).toThrow(/Не удалось сохранить/)
  })
})
