import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface PopoverPanelProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  widthClassName?: string
  children: ReactNode
}

/**
 * Renders `children` into a portal at document.body, positioned with
 * `position: fixed` just under the anchor element, left-aligned to it.
 *
 * Why a portal: a CSS quirk means any ancestor with `overflow-y: auto` (or
 * scroll/hidden) forces its computed `overflow-x` to also clip, even though
 * only vertical scrolling was asked for. The tools panel needs
 * `overflow-y-auto` to scroll as one column, so a plain `position: absolute`
 * popover nested inside it gets cut off at the panel's right edge no matter
 * its z-index — z-index only controls paint order among unclipped content,
 * it can't undo a clip from an ancestor's overflow. Rendering into
 * document.body sidesteps that DOM subtree (and its clip) entirely.
 *
 * Closes on outside click, scroll (of any ancestor, including the panel
 * itself — via a capturing window listener), or resize, so it never goes
 * stale relative to a trigger that's since moved or scrolled away.
 */
export function PopoverPanel({ open, onClose, anchorRef, widthClassName = 'w-64', children }: PopoverPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setCoords(null)
      return
    }
    const rect = anchorRef.current.getBoundingClientRect()
    setCoords({ top: rect.bottom + 8, left: rect.left })
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onClose()
    }
    function handleClose() {
      onClose()
    }
    document.addEventListener('mousedown', handlePointerDown)
    // capture:true catches scroll on any scrollable ancestor, not just window
    // (the native 'scroll' event doesn't bubble, only capture reaches it).
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('resize', handleClose)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('resize', handleClose)
    }
  }, [open, anchorRef, onClose])

  if (!open || !coords) return null

  const style: CSSProperties = { top: coords.top, left: coords.left }

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className={`fixed z-50 ${widthClassName} rounded-xl border border-slate-200 bg-white p-3 shadow-lg`}
    >
      {children}
    </div>,
    document.body,
  )
}
