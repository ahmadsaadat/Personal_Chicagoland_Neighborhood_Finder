import {
  Car,
  Check as CheckIcon,
  ChevronDown,
  Heart,
  Home,
  Info,
  Landmark,
  Plus,
  Receipt,
  ShieldCheck,
  ShoppingBasket,
  TrainFront,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../common/Modal'
import { StatTile } from '../common/StatTile'
import { Badge } from '../common/Badge'
import { getRentForBedrooms } from '../../data'
import { formatBedrooms, formatCurrency, formatMinutes, formatPercent } from '../../utils/format'
import type { NeighborhoodEntry } from '../../utils/metrics'
import { yourMonthlyRentShare, yourMonthlyUtilitiesShare, type UserProfile } from '../../types'

interface NeighborhoodDetailPanelProps {
  entry: NeighborhoodEntry | null
  userProfile: UserProfile
  open: boolean
  onClose: () => void
  isCompareSelected: boolean
  compareDisabled: boolean
  onToggleCompare: (id: string) => void
}

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={15} className="text-slate-400" />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium tabular-nums text-slate-800">{value}</span>
    </div>
  )
}

export function NeighborhoodDetailPanel({
  entry,
  userProfile,
  open,
  onClose,
  isCompareSelected,
  compareDisabled,
  onToggleCompare,
}: NeighborhoodDetailPanelProps) {
  const [showAssumptions, setShowAssumptions] = useState(false)

  if (!entry) return null
  const { neighborhood, profile, summary } = entry
  const isNegative = summary.estimatedDisposableIncome < 0
  // Match the benchmark rent to the bedroom size the user actually picked —
  // always showing the 2BR figure regardless of their selection would be
  // misleading (e.g. showing 2BR rent for someone who chose a studio).
  const bedroomRent = getRentForBedrooms(profile.housing, userProfile.bedrooms)
  const bedroomLabel = formatBedrooms(userProfile.bedrooms)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={neighborhood.name}
      subtitle={neighborhood.type === 'chicago-community-area' ? 'Chicago community area' : 'Suburb'}
      widthClassName="max-w-lg"
      footer={
        <button
          type="button"
          onClick={() => onToggleCompare(neighborhood.id)}
          disabled={compareDisabled && !isCompareSelected}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isCompareSelected
              ? 'bg-[color:var(--color-compare-accent-soft)] text-[color:var(--color-compare-accent)] hover:brightness-95'
              : compareDisabled
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isCompareSelected ? (
            <>
              <CheckIcon size={16} /> Added to comparison
            </>
          ) : (
            <>
              <Plus size={16} />
              {compareDisabled ? 'Comparison full (3 max)' : 'Add to comparison'}
            </>
          )}
        </button>
      }
    >
      <div className="space-y-8">
        {/* Headline stats */}
        <div>
          <div
            className={`rounded-2xl p-5 ${
              isNegative ? 'bg-[color:var(--color-status-critical)]/8' : 'bg-gradient-to-br from-blue-50 to-slate-50'
            }`}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Estimated disposable income
            </div>
            <div
              className={`mt-1 text-3xl font-bold tabular-nums ${
                isNegative ? 'text-[color:var(--color-status-critical)]' : 'text-slate-900'
              }`}
            >
              {formatCurrency(Math.round(summary.estimatedDisposableIncome))}
              <span className="ml-1 text-base font-medium text-slate-400">/yr</span>
            </div>
            {isNegative && (
              <p className="mt-1 text-xs font-medium text-[color:var(--color-status-critical)]">
                For this profile, estimated costs exceed income here.
              </p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <StatTile icon={Home} label={`${bedroomLabel} Rent`} value={`${formatCurrency(bedroomRent)}/mo`} />
            <StatTile icon={Receipt} label="Est. Annual Cost" value={formatCurrency(Math.round(summary.totalAnnualCost))} />
            <StatTile icon={Landmark} label="Est. Annual Taxes" value={formatCurrency(Math.round(summary.taxes.totalTax))} />
            <StatTile
              icon={Car}
              label="Transportation/yr"
              value={formatCurrency(Math.round(summary.transportationAnnualCost))}
            />
          </div>
        </div>

        {/* Housing */}
        <section>
          <SectionHeader icon={Home} title="Housing" />
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">
            <Row label={`Median ${bedroomLabel} rent (this area)`} value={`${formatCurrency(bedroomRent)}/mo`} />
            <Row label="Median home price" value={formatCurrency(profile.housing.medianHomePrice)} />
            <Row label="Effective property tax rate" value={formatPercent(profile.housing.effectivePropertyTaxRate, 2)} />
            {userProfile.housingChoice === 'rent' && (
              <Row label="Your monthly rent" value={`${formatCurrency(yourMonthlyRentShare(userProfile))}/mo`} />
            )}
            <Row label="Your monthly utilities" value={`${formatCurrency(yourMonthlyUtilitiesShare(userProfile))}/mo`} />
            <Row label="Your est. annual housing cost" value={formatCurrency(Math.round(summary.housingAnnualCost))} />
          </div>
          {userProfile.housingChoice === 'own' && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs leading-relaxed text-slate-500">
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>
                Your entered purchase price ({formatCurrency(userProfile.homePurchasePrice)}) is applied here to
                compare property-tax rates on an apples-to-apples basis — it isn't adjusted to this area's typical
                home price ({formatCurrency(profile.housing.medianHomePrice)}), so treat "cost to own" as carrying
                your stated price at this rate, not the cost of buying a typical home here.
              </span>
            </div>
          )}
        </section>

        {/* Taxes */}
        <section>
          <SectionHeader icon={Landmark} title="Taxes (estimated)" />
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">
            <Row label="Federal income tax" value={formatCurrency(Math.round(summary.taxes.federalIncomeTax))} />
            <Row label="Illinois state income tax" value={formatCurrency(Math.round(summary.taxes.stateIncomeTax))} />
            <Row label="Local income tax" value={formatCurrency(summary.taxes.localIncomeTax)} />
            <Row label="Sales tax" value={formatCurrency(Math.round(summary.taxes.salesTaxEstimate))} />
            <Row label="Restaurant / food tax" value={formatCurrency(Math.round(summary.taxes.restaurantTaxEstimate))} />
            <Row label="Property tax" value={formatCurrency(Math.round(summary.taxes.propertyTaxEstimate))} />
            <Row label="Vehicle tax & fees" value={formatCurrency(Math.round(summary.taxes.vehicleTaxEstimate))} />
            <div className="flex items-center justify-between py-2 text-sm font-semibold">
              <span className="text-slate-700">Total</span>
              <span className="tabular-nums text-slate-900">{formatCurrency(Math.round(summary.taxes.totalTax))}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAssumptions((v) => !v)}
            className="mt-2 flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-700"
          >
            <span className="flex items-center gap-1.5">
              <Info size={13} /> How we estimate this
            </span>
            <ChevronDown size={14} className={`transition-transform ${showAssumptions ? 'rotate-180' : ''}`} />
          </button>
          {showAssumptions && (
            <ul className="mt-1 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
              {summary.taxes.assumptions.map((assumption) => (
                <li key={assumption} className="flex gap-1.5">
                  <span className="text-slate-300">•</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Transportation */}
        <section>
          <SectionHeader icon={TrainFront} title="Transportation" />
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">
            <Row label="Avg. commute to the Loop" value={formatMinutes(profile.transportation.avgCommuteMinutesToLoop)} />
            <Row label="Transit score" value={`${Math.round(profile.transportation.transitScore)}/100`} />
            <Row
              label="Rail access"
              value={profile.transportation.hasRailAccess ? 'Yes' : 'No'}
            />
            <Row label="Monthly parking estimate" value={formatCurrency(profile.transportation.parkingMonthlyEstimate)} />
            <Row label="Your est. annual transportation cost" value={formatCurrency(Math.round(summary.transportationAnnualCost))} />
          </div>
          {profile.transportation.transitLines.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.transportation.transitLines.map((line) => (
                <Badge key={line}>{line}</Badge>
              ))}
            </div>
          )}
        </section>

        {/* Cost of living */}
        <section>
          <SectionHeader icon={ShoppingBasket} title="Cost of living" />
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">
            <Row label="Groceries" value={`${formatCurrency(profile.costOfLiving.groceriesMonthly)}/mo`} />
            <Row label="Restaurants" value={`${formatCurrency(profile.costOfLiving.restaurantsMonthly)}/mo`} />
            <Row label="Healthcare" value={`${formatCurrency(profile.costOfLiving.healthcareMonthly)}/mo`} />
            <Row label="Other" value={`${formatCurrency(profile.costOfLiving.otherMonthly)}/mo`} />
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            Utilities live in the Housing section above — your own entered figure is used there instead of a
            neighborhood average.
          </p>
        </section>

        {/* Lifestyle */}
        <section>
          <SectionHeader icon={Heart} title="Lifestyle" />
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">
            <Row label="Walkability" value={`${Math.round(profile.lifestyle.walkability)}/100`} />
            <Row label="Transit access" value={`${Math.round(profile.lifestyle.transitAccess)}/100`} />
            <Row label="Restaurant density" value={`${Math.round(profile.lifestyle.restaurantDensity)}/100`} />
            <Row label="Parks access" value={`${Math.round(profile.lifestyle.parksAccess)}/100`} />
            <Row label="Family-friendliness" value={`${Math.round(profile.lifestyle.familyFriendliness)}/100`} />
            <Row label="Safety indicator" value={`${Math.round(profile.lifestyle.safetyIndicator)}/100`} />
          </div>
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-700">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            <span>
              The safety indicator is an illustrative relative index for comparing neighborhoods in this app — it is
              not an official crime statistic.
            </span>
          </div>
        </section>

        <div className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>All figures are MVP estimates for comparing locations, not financial or tax advice.</span>
        </div>
      </div>
    </Modal>
  )
}
