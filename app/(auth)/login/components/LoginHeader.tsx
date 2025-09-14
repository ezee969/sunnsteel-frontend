import OrnateCorners from '@/components/backgrounds/OrnateCorners';

export function LoginHeader() {
  return (
    <div className="relative mb-10 sm:mb-12 text-center">
      {/* Content container with padding to accommodate corners */}
      <div className="relative px-8 py-6 sm:px-12 sm:py-8">
        <OrnateCorners inset={4} length={24} thickness={1.25} />
        <h1
          className="text-4xl sm:text-5xl font-black tracking-wider mb-2 text-black dark:text-white transition-colors duration-700"
          style={{
            fontFamily: '"Cinzel", "Times New Roman", serif',
            letterSpacing: '0.05em',
            fontWeight: '900',
          }}
        >
          SUNNSTEEL
        </h1>
        <div className="mx-auto h-1 w-28 rounded-full bg-gradient-to-r from-transparent via-amber-400/70 to-transparent dark:via-amber-300/70 mb-3" />
        <p className="text-xs sm:text-sm text-neutral-700/80 dark:text-neutral-300/80 uppercase tracking-[0.25em] transition-colors duration-700">
          Ascend to Greatness
        </p>
      </div>
    </div>
  );
}
