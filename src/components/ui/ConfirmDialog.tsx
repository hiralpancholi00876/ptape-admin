import { AlertTriangle, CircleHelp } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  tone = 'danger',
  loading,
}: ConfirmDialogProps) {
  const danger = tone === 'danger'
  const Icon = danger ? AlertTriangle : CircleHelp

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            danger ? 'bg-danger/15 text-danger' : 'bg-accent-500/10 text-accent-500'
          }`}
        >
          <Icon className="size-5" />
        </div>
        <p className="text-sm leading-relaxed text-zinc-300">{message}</p>
      </div>
    </Modal>
  )
}
