'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export const ModeToggle = () => {
	const { theme, setTheme, resolvedTheme } = useTheme()

	const toggleTheme = () => {
		if (theme === 'light') {
			setTheme('dark')
		} else if (theme === 'dark') {
			// If system is already dark, skip to light
			if (resolvedTheme === 'dark') setTheme('light')
			else setTheme('system')
		} else {
			// theme is system, skip to dark if system is already light
			if (resolvedTheme === 'light') setTheme('dark')
			else setTheme('light')
		}
	}

	// a11y review 9: the control announced only "Toggle theme", never the state
	// it is in or the one it moves to. The cycle above always lands on the
	// opposite of the resolved theme, so that is what the label names. Theme is
	// unknown on the server, hence the hydration suppression on this element.
	const label =
		resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'

	return (
		// a11y review 12: 44px below `md`. The extra hover wash (a raw
		// `neutral-100`/`neutral-800` overlay) and the pill shape are gone: the
		// ghost variant already has a hover, and §7 keeps `rounded-full` for
		// avatars only.
		<Button
			variant="ghost"
			size="icon"
			aria-label={label}
			suppressHydrationWarning
			className="relative size-11 overflow-hidden md:size-10"
			onClick={toggleTheme}
		>
			<Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform duration-[var(--motion-base)] ease-standard dark:-rotate-90 dark:scale-0" />
			<Sun className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform duration-[var(--motion-base)] ease-standard dark:rotate-0 dark:scale-100" />
		</Button>
	)
}
