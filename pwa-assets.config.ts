import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// The source is the rounded app tile. Maskable and Apple icons get padded onto
// the same brown, so the tile blends into a full-bleed background.
const brandBrown = '#3B2316'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    transparent: { ...preset.transparent, padding: 0 },
    maskable: { ...preset.maskable, resizeOptions: { background: brandBrown } },
    apple: { ...preset.apple, resizeOptions: { background: brandBrown } },
  },
  images: ['public/favicon.svg'],
})
