import type { ReactNode } from 'react'

export function DetailModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-2 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center py-4">
        <div
          className="flex w-full max-w-4xl flex-col rounded-3xl border border-white/10 bg-slate-950 shadow-2xl max-h-[calc(100vh-2rem)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}