import HeroBackdrop from '@/components/backgrounds/HeroBackdrop'
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay'
import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay'

export function BackgroundOverlay() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Local hero background with blur + dark overlay */}
      <HeroBackdrop
        src="/backgrounds/hero-greek-background.webp"
        blurPx={18}
        overlayGradient="linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 80%)"
        className="absolute inset-0"
      />
      {/* Subtle parchment texture and gold vignette */}
      <ParchmentOverlay opacity={0.10} />
      <GoldVignetteOverlay intensity={0.10} />
    </div>
  )
}
