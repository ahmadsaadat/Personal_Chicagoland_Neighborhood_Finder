import {
  Check as CheckIcon,
  ChevronDown,
  Heart,
  Home,
  Info,
  Landmark,
  Plus,
  ShieldCheck,
  ShoppingBasket,
  TrainFront,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'
import { formatBedrooms, formatCurrency, formatMinutes, formatPercent } from '../../utils/format'
import { disposableIncomeColor } from '../../utils/incomeColor'
import type { NeighborhoodEntry } from '../../utils/metrics'
import type { UserProfile } from '../../types'

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
    <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
      <Icon size={15} className="text-slate-400" />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
    </div>
  )
}

/** A header's headline number, colored green for income or red for an expense so it stands out from the section label next to it. */
function AmountBadge({ value, variant }: { value: string; variant: 'income' | 'expense' }) {
  return (
    <span className={`text-sm font-semibold tabular-nums ${variant === 'income' ? 'text-green-700' : 'text-red-700'}`}>
      {value}
    </span>
  )
}

/**
 * A section header with a value inline on the right, like
 * CollapsibleSectionHeader but static (no toggle) — for a section with
 * nothing to expand. Reserves the same width a chevron would take (via an
 * invisible one) so its value lines up with the collapsible headers' values
 * above/below it instead of extending further right.
 */
function StaticSectionHeader({
  icon: Icon,
  title,
  titleSuffix,
  value,
}: {
  icon: LucideIcon
  title: string
  titleSuffix?: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-green-700/40 px-3 py-2.5">
      <span className="flex items-center gap-2">
        <Icon size={15} className="text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
      </span>
      <span className="flex items-center gap-1.5">
        {titleSuffix && (
          <>
            <span className="text-xs font-medium normal-case tracking-normal text-slate-400">{titleSuffix}</span>
            <span className="text-xs text-slate-300">•</span>
          </>
        )}
        <AmountBadge value={value} variant="income" />
        <ChevronDown size={14} className="invisible" />
      </span>
    </div>
  )
}

function Row({
  label,
  labelSuffix,
  valueSuffix,
  value,
}: {
  label: string
  labelSuffix?: string
  /** A short note (e.g. a percentage) shown right before the value, separated by a bullet — for things measured against this row's own number, as opposed to labelSuffix's longer annotations tied to the label. */
  valueSuffix?: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="text-slate-500">
        {label}
        {labelSuffix && <span className="ml-1.5 font-medium tabular-nums text-slate-400">{labelSuffix}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {valueSuffix && (
          <>
            <span className="text-xs font-medium tabular-nums text-slate-400">{valueSuffix}</span>
            <span className="text-xs text-slate-300">•</span>
          </>
        )}
        <span className="font-medium tabular-nums text-slate-800">{value}</span>
      </span>
    </div>
  )
}

/**
 * The toggle button for a collapsible section (Taxes, Housing) — shows the
 * section's total up front so it's useful collapsed. Deliberately has no
 * border/rounding of its own: the caller wraps this together with the
 * conditionally-rendered details in one shared bordered container, so
 * expanding never produces two separate boxes stacked with a gap.
 */
function CollapsibleSectionHeader({
  icon: Icon,
  title,
  titleSuffix,
  summaryValue,
  expanded,
  onToggle,
}: {
  icon: LucideIcon
  title: string
  titleSuffix?: string
  summaryValue: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-100"
    >
      <span className="flex items-center gap-2">
        <Icon size={15} className="text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
      </span>
      <span className="flex items-center gap-1.5">
        {titleSuffix && (
          <>
            <span className="text-xs font-medium normal-case tracking-normal text-slate-400">{titleSuffix}</span>
            <span className="text-xs text-slate-300">•</span>
          </>
        )}
        <AmountBadge value={summaryValue} variant="expense" />
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </span>
    </button>
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
  const [taxesExpanded, setTaxesExpanded] = useState(false)
  const [housingExpanded, setHousingExpanded] = useState(false)

  if (!entry) return null
  const { neighborhood, profile, summary } = entry
  const isNegative = summary.estimatedDisposableIncome < 0
  const bedroomLabel = formatBedrooms(userProfile.bedrooms)
  // "Income Tax" here means everything withheld from a paycheck — federal
  // income tax, the two FICA payroll taxes (Social Security, Medicare), and
  // state income tax — not sales, restaurant, property, or vehicle taxes,
  // which are surfaced elsewhere rather than folded into this section.
  const incomeTaxAnnual =
    summary.taxes.federalIncomeTax +
    summary.taxes.socialSecurityTax +
    summary.taxes.medicareTax +
    summary.taxes.stateIncomeTax
  const incomeTaxPercentOf = (amount: number) =>
    summary.grossIncome > 0 ? Math.round((amount / summary.grossIncome) * 100) : 0
  const incomeTaxRatePercent = incomeTaxPercentOf(incomeTaxAnnual)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={neighborhood.name}
      subtitle={neighborhood.type === 'chicago-community-area' ? 'Chicago community area' : 'Suburb'}
      widthClassName="max-w-xl"
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
      <div className="space-y-4">
        {/* Headline stats */}
        <div>
          <div
            className={`rounded-2xl p-5 ${
              isNegative ? 'bg-[color:var(--color-status-critical)]/8' : 'bg-gradient-to-br from-blue-50 to-slate-50'
            }`}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Disposable income
            </div>
            <div
              className="mt-1 text-3xl font-bold tabular-nums"
              style={{ color: disposableIncomeColor(summary.estimatedDisposableIncome, summary.grossIncome) }}
            >
              {formatCurrency(Math.round(summary.estimatedDisposableIncome / 12))}
              <span className="ml-1 text-base font-medium text-slate-400">/mo</span>
            </div>
            {isNegative && (
              <p className="mt-1 text-xs font-medium text-[color:var(--color-status-critical)]">
                For this profile, estimated costs exceed income here.
              </p>
            )}
          </div>
        </div>

        {/* Income */}
        <section>
          <StaticSectionHeader
            icon={Wallet}
            title="Income"
            titleSuffix="100%"
            value={`${formatCurrency(Math.round(summary.grossIncome / 12))}/mo`}
          />
        </section>

        {/* Taxes */}
        <section>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <CollapsibleSectionHeader
              icon={Landmark}
              title="Income Tax"
              titleSuffix={`${incomeTaxRatePercent}%`}
              summaryValue={`${formatCurrency(Math.round(incomeTaxAnnual / 12))}/mo`}
              expanded={taxesExpanded}
              onToggle={() => setTaxesExpanded((v) => !v)}
            />
            {taxesExpanded && (
              <div className="divide-y divide-slate-100 border-t border-slate-100 px-3">
                <Row
                  label="Federal income tax"
                  valueSuffix={`${incomeTaxPercentOf(summary.taxes.federalIncomeTax)}%`}
                  value={`${formatCurrency(Math.round(summary.taxes.federalIncomeTax / 12))}/mo`}
                />
                <Row
                  label="Illinois state income tax"
                  valueSuffix={`${incomeTaxPercentOf(summary.taxes.stateIncomeTax)}%`}
                  value={`${formatCurrency(Math.round(summary.taxes.stateIncomeTax / 12))}/mo`}
                />
                <Row
                  label="Social Security"
                  valueSuffix={`${incomeTaxPercentOf(summary.taxes.socialSecurityTax)}%`}
                  value={`${formatCurrency(Math.round(summary.taxes.socialSecurityTax / 12))}/mo`}
                />
                <Row
                  label="Medicare"
                  valueSuffix={`${incomeTaxPercentOf(summary.taxes.medicareTax)}%`}
                  value={`${formatCurrency(Math.round(summary.taxes.medicareTax / 12))}/mo`}
                />
                <div className="flex items-center justify-between py-2 text-sm font-semibold">
                  <span className="text-slate-700">Total</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs font-medium tabular-nums text-slate-400">{incomeTaxRatePercent}%</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="tabular-nums text-slate-900">
                      {formatCurrency(Math.round(incomeTaxAnnual / 12))}/mo
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
          {taxesExpanded && (
            <>
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
            </>
          )}
        </section>

        {/* Housing */}
        <section>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <CollapsibleSectionHeader
              icon={Home}
              title="Housing"
              summaryValue={`${formatCurrency(Math.round(summary.housingAnnualCost / 12))}/mo`}
              expanded={housingExpanded}
              onToggle={() => setHousingExpanded((v) => !v)}
            />
            {housingExpanded && (
              <div className="divide-y divide-slate-100 border-t border-slate-100 px-3">
                {userProfile.housingChoice === 'rent' ? (
                  <Row label="Your monthly rent" value={`${formatCurrency(Math.round(summary.monthlyRentShare))}/mo`} />
                ) : (
                  <>
                    <Row
                      label="Mortgage"
                      labelSuffix={
                        userProfile.ownHomeSizing === 'median'
                          ? `(${bedroomLabel} Median Home Price: ${formatCurrency(Math.round(summary.estimatedHomeValue))})`
                          : undefined
                      }
                      value={`${formatCurrency(Math.round(summary.monthlyMortgagePaymentAmount))}/mo`}
                    />
                    <Row label="Home Insurance" value={`${formatCurrency(Math.round(summary.monthlyHomeInsurance))}/mo`} />
                    <Row
                      label="Property Tax"
                      valueSuffix={formatPercent(profile.housing.effectivePropertyTaxRate, 2)}
                      value={`${formatCurrency(Math.round(summary.taxes.propertyTaxEstimate / 12))}/mo`}
                    />
                  </>
                )}
                <Row label="Utilities" value={`${formatCurrency(Math.round(summary.monthlyUtilitiesShare))}/mo`} />
                <Row
                  label="Total Monthly Cost"
                  value={`${formatCurrency(Math.round(summary.housingAnnualCost / 12))}/mo`}
                />
              </div>
            )}
          </div>
          {housingExpanded && userProfile.housingChoice === 'own' && userProfile.ownHomeSizing === 'custom' && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs leading-relaxed text-slate-500">
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>
                Your entered monthly mortgage payment implies a home value of about{' '}
                {formatCurrency(Math.round(summary.estimatedHomeValue))}, applied uniformly here to compare
                property-tax rates on an apples-to-apples basis — it isn't adjusted to this area's typical home
                price ({formatCurrency(profile.housing.medianHomePrice)}), so treat "cost to own" as carrying your
                stated payment at this rate, not the cost of buying a typical home here.
              </span>
            </div>
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
