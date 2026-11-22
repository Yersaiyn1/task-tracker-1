import { useState } from 'react'
import { useTaskStore, SaveError } from './useTaskStore'
import { filterTasks, STATUS_LABELS, type Filter } from './tasks'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Все',
  todo: 'К выполнению',
  done: 'Выполненные',
}

const FILTER_ORDER: Filter[] = ['all', 'todo', 'done']

function confirmDelete(name: string): boolean {
  return window.confirm(`Удалить задачу «${name}»?`)
}

export default function App() {
  const { tasks, filter, setFilter, add, toggle, remove, loadError } = useTaskStore(
    window.localStorage,
  )
  const [draft, setDraft] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const readOnly = loadError !== null

  const visibleTasks = filterTasks(tasks, filter)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (readOnly) return
    setInputError(null)
    if (!draft.trim()) {
      setInputError('Введите название задачи')
      return
    }
    try {
      add(draft)
    } catch (error) {
      if (error instanceof SaveError) setSaveError(error.message)
      return
    }
    setDraft('')
  }

  function handleToggle(id: number) {
    if (readOnly) return
    setSaveError(null)
    try {
      toggle(id)
    } catch (error) {
      if (error instanceof SaveError) setSaveError(error.message)
    }
  }

  function handleRemove(id: number, name: string) {
    if (readOnly) return
    setSaveError(null)
    if (!confirmDelete(name)) return
    try {
      remove(id)
    } catch (error) {
      if (error instanceof SaveError) setSaveError(error.message)
    }
  }

  return (
    <main className="app">
      <h1 className="app__title">Мои задачи</h1>

      <form className="add-form" onSubmit={handleSubmit} noValidate>
        <div className="add-form__row">
          <input
            className="add-form__input"
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
              setInputError(null)
            }}
            placeholder="Название задачи"
            aria-label="Название задачи"
            aria-invalid={inputError !== null}
            disabled={readOnly}
          />
          <button className="add-form__submit" type="submit" disabled={readOnly}>
            Добавить
          </button>
        </div>
        {inputError !== null && (
          <p className="add-form__error" role="alert">
            {inputError}
          </p>
        )}
      </form>

      {loadError !== null && (
        <p className="save-error" role="alert">
          {loadError.message}
        </p>
      )}

      {saveError !== null && (
        <p className="save-error" role="alert">
          {saveError}
        </p>
      )}

      <div className="filters" role="group" aria-label="Фильтр задач">
        {FILTER_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`filters__button${filter === key ? ' filters__button--active' : ''}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      <ul className="task-list">
        {visibleTasks.map((task) => (
          <li key={task.id} className={`task task--${task.status}`}>
            <label className="task__label">
              <input
                type="checkbox"
                className="task__checkbox"
                checked={task.status === 'done'}
                onChange={() => handleToggle(task.id)}
                disabled={readOnly}
                aria-label={`Отметить «${task.name}» как ${STATUS_LABELS[
                  task.status === 'done' ? 'todo' : 'done'
                ].toLowerCase()}`}
              />
              <span className="task__name">{task.name}</span>
            </label>
            <span className="task__status">{STATUS_LABELS[task.status]}</span>
            <button
              type="button"
              className="task__delete"
              onClick={() => handleRemove(task.id, task.name)}
              aria-label={`Удалить «${task.name}»`}
              disabled={readOnly}
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && <p className="empty-message">Список задач пуст. Добавьте первую задачу.</p>}
      {tasks.length > 0 && visibleTasks.length === 0 && (
        <p className="empty-message">
          {filter === 'todo' ? 'Нет задач «К выполнению».' : 'Нет выполненных задач.'}
        </p>
      )}
    </main>
  )
}
