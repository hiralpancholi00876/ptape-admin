import { create } from 'zustand'

export type Theme = 'light' | 'dark'

// index.html reads this key before first paint, so it stays a raw 'light' | 'dark' string.
const THEME_KEY = 'p-tape-theme'

function initialTheme(): Theme {
  // The pre-paint script in index.html has already applied the stored theme.
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'dark' ? 'dark' : 'light'
}

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: initialTheme(),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}))

useThemeStore.subscribe(({ theme }) => {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
})
