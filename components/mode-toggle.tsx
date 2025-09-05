'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const ModeToggle = () => {
  const { setTheme } = useTheme()

  const handleLight = () => setTheme('light')
  const handleDark = () => setTheme('dark')
  const handleSystem = () => setTheme('system')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Toggle theme"
          className="rounded-full h-9 w-9"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={handleLight} role="menuitem" aria-label="Switch to light theme">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDark} role="menuitem" aria-label="Switch to dark theme">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSystem} role="menuitem" aria-label="Use system theme">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
