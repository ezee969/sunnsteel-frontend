import { Logo } from '../../components/Logo';

export function SignupHeader() {
  return (
    <div className="mb-12 text-center">
      <Logo />
      <h1 className="text-4xl font-bold tracking-tighter mb-2 text-white dark:text-black transition-colors duration-700">
        SUNNSTEEL
      </h1>
      <div className="text-sm text-red-300/80 dark:text-red-800/80 uppercase tracking-widest transition-colors duration-700">
        Begin Your Ascension
      </div>
    </div>
  );
}
