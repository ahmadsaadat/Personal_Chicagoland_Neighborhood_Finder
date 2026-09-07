import { useCallback, useMemo, useState } from 'react'

export const MAX_COMPARE = 3

export interface UseCompareSelectionResult {
  selectedIds: string[]
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  isFull: boolean
}

/** Tracks up to MAX_COMPARE neighborhood ids selected for side-by-side comparison. */
export function useCompareSelection(): UseCompareSelectionResult {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((existing) => existing !== id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, id]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((existing) => existing !== id))
  }, [])

  const clear = useCallback(() => setSelectedIds([]), [])

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds])

  const isFull = useMemo(() => selectedIds.length >= MAX_COMPARE, [selectedIds])

  return { selectedIds, isSelected, toggle, remove, clear, isFull }
}
