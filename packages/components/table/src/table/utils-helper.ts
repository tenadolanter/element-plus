import type { Store } from '../store'
import type { DefaultRow } from './defaults'

function useUtils<T extends DefaultRow>(store: Store<T>) {
  const setCurrentRow = (row: T) => {
    store.commit('setCurrentRow', row)
  }
  const getSelectionRows = () => {
    return store.getSelectionRows()
  }
  const toggleRowSelection = (
    row: T,
    selected?: boolean,
    ignoreSelectable = true
  ) => {
    store.toggleRowSelection(row, selected, false, ignoreSelectable)
    store.updateAllSelected()
  }
  const clearSelection = () => {
    store.clearSelection()
  }
  const clearFilter = (columnKeys?: string[] | string) => {
    store.clearFilter(columnKeys)
  }
  const toggleAllSelection = () => {
    store.commit('toggleAllSelection')
  }
  const toggleRowExpansion = (row: T, expanded?: boolean) => {
    store.toggleRowExpansionAdapter(row, expanded)
  }
  const clearSort = () => {
    store.clearSort()
  }
  const sort = (prop: string, order: string) => {
    store.commit('sort', { prop, order })
  }
  const updateKeyChildren = (key: string, data: T[]) => {
    store.updateKeyChildren(key, data)
  }

  return {
    setCurrentRow,
    getSelectionRows,
    toggleRowSelection,
    clearSelection,
    clearFilter,
    toggleAllSelection,
    toggleRowExpansion,
    clearSort,
    sort,
    updateKeyChildren,
  }
}

export default useUtils
