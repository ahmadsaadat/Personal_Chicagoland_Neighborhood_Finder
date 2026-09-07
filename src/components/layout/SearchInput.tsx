import { MapPin, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getNeighborhoods } from '../../data'

interface SearchInputProps {
  onSelect: (neighborhoodId: string) => void
  className?: string
}

/** Header search box: filters neighborhoods by name and jumps to the selected one. Never hardcodes ids/names. */
export function SearchInput({ onSelect, className = '' }: SearchInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const matches =
    query.trim().length === 0
      ? []
      : getNeighborhoods()
          .filter((n) => n.name.toLowerCase().includes(query.trim().toLowerCase()))
          .slice(0, 8)

  function handleSelect(id: string) {
    onSelect(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search a neighborhood…"
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl animate-[riseIn_120ms_ease-out]">
          {matches.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleSelect(n.id)}
              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <MapPin size={13} className="text-slate-300" />
              {n.name}
              <span className="ml-auto text-xs text-slate-400">
                {n.type === 'chicago-community-area' ? 'Chicago' : 'Suburb'}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim().length > 0 && matches.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-slate-100 bg-white px-3.5 py-3 text-sm text-slate-400 shadow-xl">
          No neighborhoods match “{query}”.
        </div>
      )}
    </div>
  )
}
