import { describe, expect, it } from 'vitest'
import { applyAction, filterTasks, type Task } from './tasks'

const initial = { tasks: [] as Task[], nextId: 1 }

describe('applyAction: add', () => {
  it('присваивает уникальный ID и статус «К выполнению»', () => {
    const first = applyAction(initial, { type: 'add', name: 'Запустить тесты' })
    const second = applyAction(first, { type: 'add', name: '  Написать отчёт  ' })

    expect(first.tasks[0]).toEqual({ id: 1, name: 'Запустить тесты', status: 'todo' })
    expect(second.tasks[1]).toEqual({ id: 2, name: 'Написать отчёт', status: 'todo' })
    expect(second.nextId).toBe(3)
  })

  it('отклоняет пустое название и название из одних пробелов', () => {
    expect(applyAction(initial, { type: 'add', name: '' })).toEqual(initial)
    expect(applyAction(initial, { type: 'add', name: '   ' })).toEqual(initial)
  })

  it('обрезает пробелы по краям названия', () => {
    const state = applyAction(initial, { type: 'add', name: '  Запустить тесты  ' })
    expect(state.tasks[0].name).toBe('Запустить тесты')
  })
})

describe('applyAction: toggle', () => {
  it('меняет статус на «Выполнена» и обратно', () => {
    const state = applyAction(initial, { type: 'add', name: 'Задача' })

    const done = applyAction(state, { type: 'toggle', id: 1 })
    expect(done.tasks[0].status).toBe('done')

    const back = applyAction(done, { type: 'toggle', id: 1 })
    expect(back.tasks[0].status).toBe('todo')
  })

  it('не меняет список при неизвестном ID', () => {
    const state = applyAction(initial, { type: 'add', name: 'Задача' })
    expect(applyAction(state, { type: 'toggle', id: 999 })).toEqual(state)
  })
})

describe('applyAction: delete', () => {
  it('удаляет задачу', () => {
    let state = applyAction(initial, { type: 'add', name: 'Первая' })
    state = applyAction(state, { type: 'add', name: 'Вторая' })
    state = applyAction(state, { type: 'delete', id: 1 })

    expect(state.tasks.map((task) => task.id)).toEqual([2])
  })

  it('не переиспользует ID удалённых задач, в том числе после удаления последней', () => {
    let state = applyAction(initial, { type: 'add', name: 'Первая' })
    state = applyAction(state, { type: 'delete', id: 1 })
    state = applyAction(state, { type: 'add', name: 'Вторая' })
    expect(state.tasks[0].id).toBe(2)

    state = applyAction(state, { type: 'delete', id: 2 })
    state = applyAction(state, { type: 'add', name: 'Третья' })
    expect(state.tasks[0].id).toBe(3)
  })

  it('не меняет список при неизвестном ID', () => {
    expect(applyAction(initial, { type: 'delete', id: 999 })).toEqual(initial)
  })
})

describe('filterTasks', () => {
  const tasks: Task[] = [
    { id: 1, name: 'Первая', status: 'todo' },
    { id: 2, name: 'Вторая', status: 'done' },
  ]

  it('показывает все задачи для фильтра «Все»', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(2)
  })

  it('показывает только задачи «К выполнению»', () => {
    expect(filterTasks(tasks, 'todo')).toEqual([tasks[0]])
  })

  it('показывает только выполненные задачи', () => {
    expect(filterTasks(tasks, 'done')).toEqual([tasks[1]])
  })
})
