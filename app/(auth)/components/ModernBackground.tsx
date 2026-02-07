'use client';

export function ModernBackground() {
  return (
    <div className="absolute inset-0 z-0 bg-neutral-100 dark:bg-neutral-950 overflow-hidden transition-colors duration-300">
        {/* Modern Mesh Gradient - adapts to theme */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-neutral-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950 opacity-100" />
        
        {/* Accent Glows - Cooler tones mixed with Gold */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[5000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neutral-200/40 dark:bg-neutral-800/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
        
        {/* Subtle grid pattern for structure */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
  );
}
