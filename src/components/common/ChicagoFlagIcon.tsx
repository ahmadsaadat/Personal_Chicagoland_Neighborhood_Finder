/** The flag of Chicago: two blue bars and four red six-pointed stars on white — used as the app's mark in place of a generic icon. */
export function ChicagoFlagIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <rect width="32" height="32" rx="4" fill="#FFFFFF" />
      <rect x="0" y="5.33" width="32" height="5.33" fill="#41B6E6" />
      <rect x="0" y="21.33" width="32" height="5.33" fill="#41B6E6" />
      <polygon
        points="6.40,11.80 7.15,14.70 10.04,13.90 7.90,16.00 10.04,18.10 7.15,17.30 6.40,20.20 5.65,17.30 2.76,18.10 4.90,16.00 2.76,13.90 5.65,14.70"
        fill="#B3132D"
      />
      <polygon
        points="12.80,11.80 13.55,14.70 16.44,13.90 14.30,16.00 16.44,18.10 13.55,17.30 12.80,20.20 12.05,17.30 9.16,18.10 11.30,16.00 9.16,13.90 12.05,14.70"
        fill="#B3132D"
      />
      <polygon
        points="19.20,11.80 19.95,14.70 22.84,13.90 20.70,16.00 22.84,18.10 19.95,17.30 19.20,20.20 18.45,17.30 15.56,18.10 17.70,16.00 15.56,13.90 18.45,14.70"
        fill="#B3132D"
      />
      <polygon
        points="25.60,11.80 26.35,14.70 29.24,13.90 27.10,16.00 29.24,18.10 26.35,17.30 25.60,20.20 24.85,17.30 21.96,18.10 24.10,16.00 21.96,13.90 24.85,14.70"
        fill="#B3132D"
      />
    </svg>
  )
}
