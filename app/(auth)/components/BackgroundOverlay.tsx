export function BackgroundOverlay() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 scale-105 filter contrast-125 saturate-150"
        style={{
          backgroundImage: `url(${encodeURI(
            'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_2267.JPEG-BbFdiDdZ4ypsuyWV1QLS3l1HPAcUMI.jpeg'
          )})`,
          backgroundPosition: 'center 30%',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent dark:from-white/70 dark:via-white/40 dark:to-transparent transition-colors duration-700" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 dark:from-white/60 dark:via-transparent dark:to-white/60 transition-colors duration-700" />
    </div>
  );
}
