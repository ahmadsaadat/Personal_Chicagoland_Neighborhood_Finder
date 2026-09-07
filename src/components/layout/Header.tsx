import { MapPinned, User } from 'lucide-react'
import { SearchInput } from './SearchInput'

interface HeaderProps {
  onSelectNeighborhood: (id: string) => void
  onOpenProfile: () => void
  hasCustomProfile: boolean
}

export function Header({ onSelectNeighborhood, onOpenProfile, hasCustomProfile }: HeaderProps) {
  return (
    <header className="relative z-20 shrink-0 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <MapPinned size={16} strokeWidth={2.25} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">Chicagoland</span>
        </div>

        <div className="hidden flex-1 justify-center sm:flex">
          <SearchInput onSelect={onSelectNeighborhood} className="w-full max-w-sm" />
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <User size={13} />
          </span>
          {hasCustomProfile ? 'Your profile' : 'Set up profile'}
        </button>
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5 sm:hidden">
        <SearchInput onSelect={onSelectNeighborhood} />
      </div>
    </header>
  )
}
