import L from 'leaflet'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

/**
 * Vite bundles Leaflet's default marker images with hashed filenames, which
 * breaks Leaflet's built-in reference to `images/marker-icon.png` (the
 * well-known "broken marker" issue). Re-point the default icon at the
 * bundler-resolved asset URLs once, on module load.
 */
let patched = false

export function fixLeafletDefaultIcon(): void {
  if (patched) return
  patched = true

  type IconDefaultPrototype = typeof L.Icon.Default.prototype & { _getIconUrl?: unknown }
  delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: marker2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  })
}
