import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { useTaskStore, LoadError, SaveError } from './useTaskStore'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
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

describe('useTaskStore', () => {
  it('после ошибки загрузки добавление задачи не записывает данные в хранилище', () => {
    const storage = memoryStorage({ tasks: '{это не json' })
    const setItemSpy = vi.spyOn(storage, 'setItem')
    const { result } = renderHook(() => useTaskStore(storage))

    expect(result.current.loadError).toBeInstanceOf(LoadError)
    expect(result.current.tasks).toEqual([])

    expect(() => act(() => result.current.add('Новая задача'))).toThrow(LoadError)
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(storage.getItem('tasks')).toBe('{это не json')
  })

  it('после ошибки загрузки переключение и удаление тоже не пишут в хранилище', () => {
    const raw = JSON.stringify({
      tasks: [{ id: 1, name: 'Задача', status: 'todo' }],
      nextId: 2,
    })
    const storage = memoryStorage({ tasks: '{битые данные' })
    const setItemSpy = vi.spyOn(storage, 'setItem')
    const { result } = renderHook(() => useTaskStore(storage))

    expect(() => act(() => result.current.toggle(1))).toThrow(LoadError)
    expect(() => act(() => result.current.remove(1))).toThrow(LoadError)
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(storage.getItem('tasks')).toBe('{битые данные')
    void raw
  })

  it('при отсутствии записи список пуст, добавление сохраняется в хранилище', () => {
    const storage = memoryStorage()
    const { result } = renderHook(() => useTaskStore(storage))

    expect(result.current.loadError).toBeNull()
    act(() => result.current.add('Первая задача'))
    expect(result.current.tasks).toEqual([
      { id: 1, name: 'Первая задача', status: 'todo' },
    ])
    expect(JSON.parse(storage.getItem('tasks')!)).toEqual({
      tasks: [{ id: 1, name: 'Первая задача', status: 'todo' }],
      nextId: 2,
    })
  })

  it('ошибка записи не меняет список: состояние остаётся до действия', () => {
    const storage = memoryStorage()
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    const { result } = renderHook(() => useTaskStore(storage))

    expect(() => act(() => result.current.add('Задача'))).toThrow(SaveError)
    expect(result.current.tasks).toEqual([])
  })
})
