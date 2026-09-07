import { useMemo, useState } from 'react'
import { CompareModal } from './components/compare/CompareModal'
import { CompareTray } from './components/compare/CompareTray'
import { Header } from './components/layout/Header'
import { NeighborhoodDetailPanel } from './components/neighborhood/NeighborhoodDetailPanel'
import { ProfileDrawer } from './components/profile/ProfileDrawer'
import { useCompareSelection } from './hooks/useCompareSelection'
import { useNeighborhoodEntries } from './hooks/useNeighborhoodEntries'
import { useUserProfile } from './hooks/useUserProfile'
import { ExplorePage, type ExploreTab } from './pages/ExplorePage'
import { LandingPage } from './pages/LandingPage'

type View = 'landing' | 'explore'

function App() {
  const { profile, updateProfile, resetProfile, isOnboarded } = useUserProfile()
  const entries = useNeighborhoodEntries(profile)

  const [view, setView] = useState<View>('landing')
  const [exploreTab, setExploreTab] = useState<ExploreTab>('map')
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | null>(null)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const compare = useCompareSelection()

  function goExplore(tab: ExploreTab) {
    setExploreTab(tab)
    setView('explore')
  }

  function handleSelectFromHeader(id: string) {
    setSelectedNeighborhoodId(id)
    setView('explore')
  }

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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header
        onSelectNeighborhood={handleSelectFromHeader}
        onOpenProfile={() => setProfileOpen(true)}
        onGoHome={() => setView('landing')}
        hasCustomProfile={isOnboarded}
      />

      {view === 'landing' ? (
        <LandingPage onExplore={() => goExplore('map')} onFindBestMatch={() => goExplore('best')} />
      ) : (
        <ExplorePage
          profile={profile}
          entries={entries}
          activeTab={exploreTab}
          onTabChange={setExploreTab}
          selectedNeighborhoodId={selectedNeighborhoodId}
          onSelectNeighborhood={setSelectedNeighborhoodId}
          compare={compare}
          onOpenProfile={() => setProfileOpen(true)}
          isOnboarded={isOnboarded}
        />
      )}

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onSave={updateProfile}
        onReset={resetProfile}
      />

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
