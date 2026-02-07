import { ReactNode } from 'react';
import HeroBackdrop from '@/components/backgrounds/HeroBackdrop';
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay';
import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay';
import OrnateCorners from '@/components/backgrounds/OrnateCorners';

export interface HeroSectionProps {
  imageSrc: string;
  title: ReactNode;
  subtitle?: ReactNode;
  overlayGradient?: string;
  blurPx?: number;
  sectionClassName?: string;
  innerClassName?: string;
}

export const HeroSection = ({
  imageSrc,
  title,
  subtitle,
  overlayGradient = 'linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 75%)',
  blurPx = 5,
  sectionClassName = '',
  innerClassName = '',
}: HeroSectionProps) => {
  // Enforce consistent hero height across the app and reduce mobile height footprint
  const computedHeightClass = 'h-[100px] sm:h-[130px]';
  return (
    <section
      className={`relative overflow-hidden rounded-xl border ${sectionClassName}`}
    >
      <HeroBackdrop
        src={imageSrc}
        blurPx={blurPx}
        overlayGradient={overlayGradient}
        className={computedHeightClass}
      >
        <div
          className={`relative h-full flex items-center px-4 py-3 sm:px-8 sm:py-6 ${innerClassName}`}
        >
          <div>
            <h2 className="heading-classical text-xl sm:text-3xl text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-white/85 text-sm sm:text-base mt-1">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </HeroBackdrop>
      <ParchmentOverlay opacity={0.08} />
      <GoldVignetteOverlay intensity={0.1} />
      <OrnateCorners inset={10} length={28} thickness={1.25} />
    </section>
  );
};

export default HeroSection;
