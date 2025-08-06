export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-t-2 border-red-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-red-300 animate-spin-slow"></div>
        <div className="absolute inset-4 rounded-full border-b-2 border-red-700 animate-pulse"></div>
      </div>
    </div>
  );
}
