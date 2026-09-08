import { ChicagoFlagIcon } from '../common/ChicagoFlagIcon'
import { SearchInput } from './SearchInput'

interface HeaderProps {
  onSelectNeighborhood: (id: string) => void
}

export function Header({ onSelectNeighborhood }: HeaderProps) {
  return (
    <header className="relative z-20 shrink-0 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-slate-100">
            <ChicagoFlagIcon size={32} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">Chicagoland - Neighborhood Finder - αlpha</span>
        </div>

        <div className="hidden flex-1 justify-center sm:flex">
          <SearchInput onSelect={onSelectNeighborhood} className="w-full max-w-sm" />
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5 sm:hidden">
        <SearchInput onSelect={onSelectNeighborhood} />
      </div>
    </header>
  )
}
