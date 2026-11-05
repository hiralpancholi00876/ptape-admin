import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  // Runs with the dialog showing a spinner; the dialog closes once it settles.
  onConfirm: () => void | Promise<void>
  // Runs when the dialog is dismissed without confirming.
  onCancel?: () => void
}

interface ConfirmState {
  options: ConfirmOptions | null
  loading: boolean
  close: () => void
  run: () => Promise<void>
}

export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  options: null,
  loading: false,

  close: () => {
    const { loading, options } = get()
    if (loading) return
    set({ options: null })
    options?.onCancel?.()
  },

  run: async () => {
    const { options } = get()
    if (!options) return
    set({ loading: true })
    try {
      await options.onConfirm()
    } finally {
      set({ loading: false, options: null })
    }
  },
}))

// Opens the shared confirm dialog rendered by <ConfirmHost />.
export function confirm(options: ConfirmOptions) {
  useConfirmStore.setState({ options })
}
