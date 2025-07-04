import { getCurrentInstance, inject, ref } from 'vue'
import { isNull } from 'lodash-unified'
import {
  addClass,
  hasClass,
  isClient,
  isElement,
  removeClass,
} from '@element-plus/utils'
import { TABLE_INJECTION_KEY } from '../tokens'

import type { EmitFn } from '@element-plus/utils'
import type { TableHeaderProps } from '.'
import type { TableColumnCtx } from '../table-column/defaults'
import type { DefaultRow, TableSortOrder } from '../table/defaults'

function useEvent<T extends DefaultRow>(
  props: TableHeaderProps<T>,
  emit: EmitFn<string[]>
) {
  const instance = getCurrentInstance()
  const parent = inject(TABLE_INJECTION_KEY)
  const handleFilterClick = (event: Event) => {
    event.stopPropagation()
    return
  }

  const handleHeaderClick = (event: Event, column: TableColumnCtx<T>) => {
    if (!column.filters && column.sortable) {
      handleSortClick(event, column, false)
    } else if (column.filterable && !column.sortable) {
      handleFilterClick(event)
    }
    parent?.emit('header-click', column, event)
  }

  const handleHeaderContextMenu = (event: Event, column: TableColumnCtx<T>) => {
    parent?.emit('header-contextmenu', column, event)
  }
  const draggingColumn = ref<TableColumnCtx<T> | null>(null)
  const dragging = ref(false)
  const dragState = ref<{
    startMouseLeft: number
    startLeft: number
    startColumnLeft: number
    tableLeft: number
  }>()
  const handleMouseDown = (event: MouseEvent, column: TableColumnCtx<T>) => {
    if (!isClient) return
    if (column.children && column.children.length > 0) return
    /* istanbul ignore if */
    if (draggingColumn.value && props.border) {
      dragging.value = true

      const table = parent
      emit('set-drag-visible', true)
      const tableEl = table?.vnode.el
      const tableLeft = tableEl?.getBoundingClientRect().left
      const columnEl = instance?.vnode?.el?.querySelector(`th.${column.id}`)
      const columnRect = columnEl.getBoundingClientRect()
      const minLeft = columnRect.left - tableLeft + 30

      addClass(columnEl, 'noclick')

      dragState.value = {
        startMouseLeft: event.clientX,
        startLeft: columnRect.right - tableLeft,
        startColumnLeft: columnRect.left - tableLeft,
        tableLeft,
      }
      const resizeProxy = table?.refs.resizeProxy as HTMLElement
      resizeProxy.style.left = `${(dragState.value as any).startLeft}px`

      document.onselectstart = function () {
        return false
      }
      document.ondragstart = function () {
        return false
      }

      const handleMouseMove = (event: MouseEvent) => {
        const deltaLeft =
          event.clientX - (dragState.value as any).startMouseLeft
        const proxyLeft = (dragState.value as any).startLeft + deltaLeft

        resizeProxy.style.left = `${Math.max(minLeft, proxyLeft)}px`
      }

      const handleMouseUp = () => {
        if (dragging.value) {
          const { startColumnLeft, startLeft } = dragState.value as any
          const finalLeft = Number.parseInt(resizeProxy.style.left, 10)
          const columnWidth = finalLeft - startColumnLeft
          column.width = column.realWidth = columnWidth
          table?.emit(
            'header-dragend',
            column.width,
            startLeft - startColumnLeft,
            column,
            event
          )
          requestAnimationFrame(() => {
            props.store.scheduleLayout(false, true)
          })
          document.body.style.cursor = ''
          dragging.value = false
          draggingColumn.value = null
          dragState.value = undefined
          emit('set-drag-visible', false)
        }

        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.onselectstart = null
        document.ondragstart = null

        setTimeout(() => {
          removeClass(columnEl, 'noclick')
        }, 0)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }

  const handleMouseMove = (event: MouseEvent, column: TableColumnCtx<T>) => {
    if (column.children && column.children.length > 0) return
    const el = event.target as HTMLElement
    if (!isElement(el)) {
      return
    }
    const target = el?.closest('th')

    if (!column || !column.resizable || !target) return

    if (!dragging.value && props.border) {
      const rect = target.getBoundingClientRect()

      const bodyStyle = document.body.style
      const isLastTh = target.parentNode?.lastElementChild === target
      const allowDarg = props.allowDragLastColumn || !isLastTh
      if (rect.width > 12 && rect.right - event.clientX < 8 && allowDarg) {
        bodyStyle.cursor = 'col-resize'
        if (hasClass(target, 'is-sortable')) {
          target.style.cursor = 'col-resize'
        }
        draggingColumn.value = column as any
      } else if (!dragging.value) {
        bodyStyle.cursor = ''
        if (hasClass(target, 'is-sortable')) {
          target.style.cursor = 'pointer'
        }
        draggingColumn.value = null
      }
    }
  }

  const handleMouseOut = () => {
    if (!isClient) return
    document.body.style.cursor = ''
  }
  const toggleOrder = ({ order, sortOrders }: TableColumnCtx<T>) => {
    if ((order as string) === '') return sortOrders[0]
    const index = sortOrders.indexOf(order || null)
    return sortOrders[index > sortOrders.length - 2 ? 0 : index + 1]
  }
  const handleSortClick = (
    event: Event,
    column: TableColumnCtx<T>,
    givenOrder?: TableSortOrder | boolean
  ) => {
    event.stopPropagation()
    const order = (
      column.order === givenOrder ? null : givenOrder || toggleOrder(column)
    ) as TableSortOrder | null
    const target = (event.target as HTMLElement)?.closest('th')

    if (target) {
      if (hasClass(target, 'noclick')) {
        removeClass(target, 'noclick')
        return
      }
    }

    if (!column.sortable) return

    const clickTarget = event.currentTarget

    if (
      ['ascending', 'descending'].some(
        (str) =>
          hasClass(clickTarget as Element, str) &&
          !column.sortOrders.includes(str as TableSortOrder)
      )
    ) {
      return
    }

    const states = props.store.states
    let sortProp = states.sortProp.value
    let sortOrder
    const sortingColumn = states.sortingColumn.value

    if (
      sortingColumn !== column ||
      (sortingColumn === column && isNull(sortingColumn.order))
    ) {
      if (sortingColumn) {
        sortingColumn.order = null
      }
      states.sortingColumn.value = column
      sortProp = column.property
    }
    if (!order) {
      sortOrder = column.order = null
    } else {
      sortOrder = column.order = order
    }

    states.sortProp.value = sortProp
    states.sortOrder.value = sortOrder

    parent?.store.commit('changeSortCondition')
  }

  return {
    handleHeaderClick,
    handleHeaderContextMenu,
    handleMouseDown,
    handleMouseMove,
    handleMouseOut,
    handleSortClick,
    handleFilterClick,
  }
}

export default useEvent
