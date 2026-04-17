import { useState } from 'react'

type NoteShape = {
  id: string
  note_text: string
  created_at: string
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function NotesPanel<T extends NoteShape>({
  title,
  notes,
  onAdd,
  busy,
}: {
  title: string
  notes: T[]
  onAdd: (note: string) => Promise<void>
  busy?: boolean
}) {
  const [draft, setDraft] = useState('')

  async function submit() {
    const trimmed = draft.trim()
    if (!trimmed) return
    await onAdd(trimmed)
    setDraft('')
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">Add dated working notes. Newest entries appear first.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          placeholder="Add a note about this opportunity..."
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Saving note...' : 'Add note'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Entry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {notes.length ? (
              notes.map((note) => (
                <tr key={note.id} className="align-top">
                  <td className="px-4 py-3 text-slate-400">{formatDate(note.created_at)}</td>
                  <td className="px-4 py-3 whitespace-pre-wrap text-slate-200">{note.note_text}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-slate-500">No notes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
