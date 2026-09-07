import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  widthClassName?: string
  /** Skip the default body padding for content that manages its own layout (e.g. a full-bleed panel). */
  noBodyPadding?: boolean
}

/** Right-side slide-over panel used for the profile editor, filters, and neighborhood detail. */
export function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClassName = 'max-w-md',
  noBodyPadding = false,
}: SlideOverProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex h-full w-full ${widthClassName} flex-col bg-white shadow-2xl animate-[slideIn_220ms_cubic-bezier(0.16,1,0.3,1)]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className={`flex-1 overflow-y-auto ${noBodyPadding ? '' : 'px-6 py-5'}`}>{children}</div>
        {footer && <div className="border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
