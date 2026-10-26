import {
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config";

const brandBrown = "#3B2316";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...preset,
    transparent: { ...preset.transparent, padding: 0 },
    maskable: { ...preset.maskable, resizeOptions: { background: brandBrown } },
    apple: { ...preset.apple, resizeOptions: { background: brandBrown } },
  },
  images: ["public/favicon.svg"],
});
