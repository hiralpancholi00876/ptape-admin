import { useConfirmStore } from '../stores/confirmStore'
import { ConfirmDialog } from './ui/ConfirmDialog'

// The single dialog behind every confirm() call.
export function ConfirmHost() {
  const options = useConfirmStore((state) => state.options)
  const loading = useConfirmStore((state) => state.loading)
  const close = useConfirmStore((state) => state.close)
  const run = useConfirmStore((state) => state.run)

  return (
    <ConfirmDialog
      open={Boolean(options)}
      onClose={close}
      onConfirm={run}
      title={options?.title ?? ''}
      message={options?.message ?? ''}
      confirmLabel={options?.confirmLabel}
      tone={options?.tone}
      loading={loading}
    />
  )
}
