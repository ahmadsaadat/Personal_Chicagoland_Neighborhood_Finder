import { useMemo, useState } from 'react'
import { CompareModal } from './components/compare/CompareModal'
import { CompareTray } from './components/compare/CompareTray'
import { Header } from './components/layout/Header'
import { NeighborhoodDetailPanel } from './components/neighborhood/NeighborhoodDetailPanel'
import { useCompareSelection } from './hooks/useCompareSelection'
import { useNeighborhoodEntries } from './hooks/useNeighborhoodEntries'
import { useUserProfile } from './hooks/useUserProfile'
import { ExplorePage } from './pages/ExplorePage'

function App() {
  const { profile, updateProfile, resetProfile, isOnboarded } = useUserProfile()
  const entries = useNeighborhoodEntries(profile)

  const [profileExpanded, setProfileExpanded] = useState(false)
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | null>(null)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const compare = useCompareSelection()

  const selectedEntry = useMemo(
    () => entries.find((e) => e.neighborhood.id === selectedNeighborhoodId) ?? null,
    [entries, selectedNeighborhoodId],
  )

  const compareEntries = useMemo(
    () =>
      compare.selectedIds
        .map((id) => entries.find((e) => e.neighborhood.id === id))
        .filter((e): e is NonNullable<typeof e> => Boolean(e)),
    [compare.selectedIds, entries],
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Header
        onSelectNeighborhood={setSelectedNeighborhoodId}
        onOpenProfile={() => setProfileExpanded(true)}
        hasCustomProfile={isOnboarded}
      />

      <div className="relative flex-1 overflow-hidden">
        <ExplorePage
          profile={profile}
          onProfileChange={updateProfile}
          onResetProfile={resetProfile}
          entries={entries}
          selectedNeighborhoodId={selectedNeighborhoodId}
          onSelectNeighborhood={setSelectedNeighborhoodId}
          compare={compare}
          profileExpanded={profileExpanded}
          onProfileExpandedChange={setProfileExpanded}
        />
      </div>

      <NeighborhoodDetailPanel
        entry={selectedEntry}
        userProfile={profile}
        open={selectedEntry !== null}
        onClose={() => setSelectedNeighborhoodId(null)}
        isCompareSelected={selectedNeighborhoodId ? compare.isSelected(selectedNeighborhoodId) : false}
        compareDisabled={compare.isFull}
        onToggleCompare={compare.toggle}
      />

      <CompareModal open={compareModalOpen} onClose={() => setCompareModalOpen(false)} entries={compareEntries} />

      {!compareModalOpen && (
        <CompareTray
          entries={compareEntries}
          onRemove={compare.remove}
          onClear={compare.clear}
          onCompare={() => setCompareModalOpen(true)}
        />
      )}
    </div>
  )
}

export default App
