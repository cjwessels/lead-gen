import { useEffect, useMemo, useState } from 'react'
import { parseStructuredSearch } from '../../lib/structuredSearch'

type FieldKey = 'city' | 'province' | 'keyword' | 'service' | 'category' | 'source' | 'custom'

interface FieldConfig {
  key: FieldKey
  label: string
  placeholder: string
}

interface AdvancedSearchBuilderProps {
  query: string
  onApply: (value: string) => void
  fields: FieldConfig[]
  title: string
  description: string
}

type SearchState = Record<FieldKey | 'freeText', string>

const DEFAULT_STATE: SearchState = {
  city: '',
  province: '',
  keyword: '',
  service: '',
  category: '',
  source: '',
  custom: '',
  freeText: '',
}

function quoteIfNeeded(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed
}

function buildStructuredQuery(state: SearchState, fields: FieldConfig[]) {
  const fieldParts = fields
    .map((field) => {
      const value = state[field.key]?.trim()
      if (!value) return ''
      return `${field.key}:${quoteIfNeeded(value)}`
    })
    .filter(Boolean)

  const freeText = state.freeText.trim()
  return [...fieldParts, freeText].filter(Boolean).join(' ').trim()
}

export function AdvancedSearchBuilder({
  query,
  onApply,
  fields,
  title,
  description,
}: AdvancedSearchBuilderProps) {
  const [expanded, setExpanded] = useState(false)
  const [state, setState] = useState<SearchState>(DEFAULT_STATE)

  useEffect(() => {
    const parsed = parseStructuredSearch(query)
    setState({
      city: parsed.city || '',
      province: parsed.province || '',
      keyword: parsed.keyword || '',
      service: parsed.service || '',
      category: parsed.category || '',
      source: parsed.source || '',
      custom: parsed.custom || '',
      freeText: parsed.freeText || '',
    })
  }, [query])

  const preview = useMemo(() => buildStructuredQuery(state, fields), [state, fields])

  function updateField(key: keyof SearchState, value: string) {
    setState((current) => ({ ...current, [key]: value }))
  }

  function clearAll() {
    setState(DEFAULT_STATE)
    onApply('')
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="mt-1 text-xs text-slate-400">{description}</div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 hover:bg-slate-950/80"
        >
          {expanded ? 'Hide helper' : 'Show helper'}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{field.label}</div>
                <input
                  className="input"
                  value={state[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                />
              </label>
            ))}

            <label className="block md:col-span-2 xl:col-span-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Additional free text</div>
              <input
                className="input"
                value={state.freeText}
                onChange={(event) => updateField('freeText', event.target.value)}
                placeholder="Any extra words to broaden or sharpen the search"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Query preview</div>
            <div className="mt-2 break-all text-sm text-slate-200">
              {preview || 'Start filling in the fields above to build a structured search query.'}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onApply(preview)}
              className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-sky-300"
            >
              Apply to search box
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10"
            >
              Clear helper
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
