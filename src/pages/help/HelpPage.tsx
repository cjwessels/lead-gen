import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { helpImages } from './helpImages'

console.log('Loaded help images:', helpImages) // Debug log to verify image paths

type StepItem = {
  title: string
  body: string
  imageLabel: string
  checkpoints: string[]
}

type Lesson = {
  id: string
  title: string
  description: string
  goal: string
  route: string
  coachTip: string
  steps: StepItem[]
}

const lessons: Lesson[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Learn how to read the app at a glance and decide where to act next.',
    goal: 'Use your dashboard as the command centre for daily lead-generation work.',
    route: '/app/dashboard',
    coachTip: 'Start each session on the dashboard. It helps you decide whether you should search, follow up, or move deals in the pipeline first.',
    steps: [
      {
        title: 'Open the dashboard',
        body: 'Start on the dashboard to review your current totals, recent activity, and overall momentum before taking action elsewhere in the app.',
        imageLabel: 'Dashboard summary cards',
        checkpoints: ['Review the main KPI cards', 'Check recent activity', 'Look for stale or low-activity areas'],
      },
      {
        title: 'Read the patterns, not only the numbers',
        body: 'Use the dashboard to spot trends such as strong lead flow, low follow-up activity, or a pipeline slowdown.',
        imageLabel: 'Trend and activity highlights',
        checkpoints: ['Compare high vs low activity', 'Identify the next priority area', 'Decide which module to open next'],
      },
      {
        title: 'Jump to action',
        body: 'After reviewing the dashboard, move directly into Search, Pipeline, Outreach, or Tenders based on the signals you saw.',
        imageLabel: 'Action shortcuts',
        checkpoints: ['Choose the next module', 'Focus on one outcome', 'Repeat this review daily'],
      },
    ],
  },
  {
    id: 'search',
    title: 'Lead Search',
    description: 'Find businesses, build structured searches, and surface stronger opportunities first.',
    goal: 'Run targeted searches and save only high-value prospects into your lead pipeline.',
    route: '/app/search',
    coachTip: 'Use structured search terms for precision. City + keyword + service usually gives cleaner results than broad phrases.',
    steps: [
      {
        title: 'Enter a search query',
        body: 'Use the main search input to search by city, niche, service, or a structured query such as city:"Cape Town" keyword:"panel beaters" service:"VW Polo".',
        imageLabel: 'Lead search query bar',
        checkpoints: ['Type a niche or location', 'Try a structured query', 'Run the search'],
      },
      {
        title: 'Refine the results',
        body: 'Use the minimum score slider, Hot Leads filter, and pain-point filters to reduce noise and bring the best-fit opportunities to the top.',
        imageLabel: 'Lead filters and scoring controls',
        checkpoints: ['Set a score threshold', 'Toggle Hot Leads if needed', 'Pick one or more pain points'],
      },
      {
        title: 'Save the right leads',
        body: 'Review each lead card carefully and save the ones that fit your service offering, location, and sales priorities.',
        imageLabel: 'Search result cards and save action',
        checkpoints: ['Open the strongest leads first', 'Check relevance and quality', 'Save qualified leads only'],
      },
    ],
  },
  {
    id: 'leads',
    title: 'Saved Leads',
    description: 'Work through your saved lead list and keep it clean and actionable.',
    goal: 'Turn saved results into a curated prospect list you can actively sell to.',
    route: '/app/leads',
    coachTip: 'A short, well-qualified saved-leads list is better than a large cold list you never action.',
    steps: [
      {
        title: 'Open your saved leads list',
        body: 'This area is your working shortlist. Use it to review what has already been captured from search and decide what deserves follow-up.',
        imageLabel: 'Saved leads workspace',
        checkpoints: ['Open the saved leads page', 'Review the latest additions', 'Look for duplicates or weak-fit leads'],
      },
      {
        title: 'Prioritise the best prospects',
        body: 'Identify the strongest prospects based on service fit, urgency, lead score, and likely buying intent.',
        imageLabel: 'Lead prioritisation view',
        checkpoints: ['Check lead quality', 'Focus on best-fit industries', 'Decide next action per lead'],
      },
      {
        title: 'Move leads into action',
        body: 'Use the saved list as the bridge between discovery and execution by moving leads into pipeline or outreach workflows.',
        imageLabel: 'Lead next-step actions',
        checkpoints: ['Send to pipeline where relevant', 'Prepare for outreach', 'Keep the list current'],
      },
    ],
  },
  {
    id: 'pipeline',
    title: 'Pipeline',
    description: 'Track sales progress and keep deals moving through stages.',
    goal: 'Manage opportunity flow clearly so no promising lead gets stuck or forgotten.',
    route: '/app/pipeline',
    coachTip: 'The pipeline is most useful when stages are updated often. Treat it as live operational data, not a monthly admin task.',
    steps: [
      {
        title: 'Open the pipeline board',
        body: 'Use the pipeline to see where each active opportunity sits in your sales process and what needs attention next.',
        imageLabel: 'Pipeline stage board',
        checkpoints: ['Scan all current stages', 'Look for stuck opportunities', 'Spot deals ready to advance'],
      },
      {
        title: 'Update lead status',
        body: 'Move leads between stages as conversations progress so your sales view always reflects reality.',
        imageLabel: 'Status update controls',
        checkpoints: ['Move leads to the right stage', 'Keep statuses current', 'Use consistent stage discipline'],
      },
      {
        title: 'Focus on conversion movement',
        body: 'Use the board to identify bottlenecks, follow-up gaps, and strong opportunities that deserve immediate attention.',
        imageLabel: 'Conversion focus snapshot',
        checkpoints: ['Look for bottlenecks', 'Prioritise warm deals', 'Follow up on delayed items'],
      },
    ],
  },
  {
    id: 'outreach',
    title: 'Outreach',
    description: 'Prepare follow-ups and use the app to support consistent lead engagement.',
    goal: 'Turn qualified leads into real conversations through structured, repeatable outreach.',
    route: '/app/outreach',
    coachTip: 'The best outreach is specific. Refer to the prospect’s likely pain point instead of sending generic messages.',
    steps: [
      {
        title: 'Choose the lead to contact',
        body: 'Start with a good-fit lead from your saved leads or pipeline so outreach is based on qualified opportunities, not random cold lists.',
        imageLabel: 'Outreach target selection',
        checkpoints: ['Choose a relevant lead', 'Confirm the service fit', 'Check the opportunity context'],
      },
      {
        title: 'Prepare your message',
        body: 'Use the available outreach tools and context in the app to shape a message that speaks to the lead’s business need.',
        imageLabel: 'Message preparation panel',
        checkpoints: ['Reference a pain point', 'Keep the message concise', 'Aim for a clear next step'],
      },
      {
        title: 'Track follow-through',
        body: 'After sending or planning outreach, update the related records so the rest of the app stays aligned with your activity.',
        imageLabel: 'Follow-up tracking view',
        checkpoints: ['Record the outreach action', 'Schedule the next follow-up', 'Reflect progress in the pipeline'],
      },
    ],
  },
  {
    id: 'tenders',
    title: 'Tenders',
    description: 'Search tenders, filter opportunities, and manage bid activity in a dedicated tender pipeline.',
    goal: 'Use the tenders module to identify, qualify, and progress tender opportunities systematically.',
    route: '/app/tenders',
    coachTip: 'For tender work, speed matters. Check closing dates early and save strong opportunities into the tender pipeline before doing deeper qualification.',
    steps: [
      {
        title: 'Run a tender search',
        body: 'Use the tender search bar and advanced helper to search by province, city, keyword, source, or custom focus area.',
        imageLabel: 'Tender search query and helper',
        checkpoints: ['Enter a tender keyword', 'Use the advanced helper if needed', 'Run the tender search'],
      },
      {
        title: 'Filter and review opportunities',
        body: 'Use province, source, and open-only filters to narrow the list, then review closing dates, summaries, and tags carefully.',
        imageLabel: 'Tender filters and result review',
        checkpoints: ['Check closing dates', 'Filter by source or province', 'Review relevance before saving'],
      },
      {
        title: 'Save and manage tender pipeline',
        body: 'Save suitable tenders, then manage them through statuses such as identified, reviewing, qualifying, bid-prep, submitted, won, or lost.',
        imageLabel: 'Tender pipeline status flow',
        checkpoints: ['Save the right tender', 'Move it through the tender stages', 'Keep your tender board current'],
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    description: 'Review plan access and understand what features are available on your current subscription.',
    goal: 'Use Billing to understand your plan and unlock the modules you need.',
    route: '/app/billing',
    coachTip: 'If a feature looks disabled, check Billing before assuming it is broken. Some modules are plan-based.',
    steps: [
      {
        title: 'Open the billing page',
        body: 'Use Billing to view your current plan details and understand which modules and limits apply to your account.',
        imageLabel: 'Billing plan overview',
        checkpoints: ['Open Billing', 'Review current plan', 'Check what features are included'],
      },
      {
        title: 'Check feature access',
        body: 'Compare your plan with the features you want to use, especially where modules such as tenders are restricted by subscription level.',
        imageLabel: 'Feature access comparison',
        checkpoints: ['Identify gated features', 'Confirm current limits', 'Decide whether access is sufficient'],
      },
      {
        title: 'Align the plan to your workflow',
        body: 'Use the billing information to decide whether your current subscription fits your lead generation and tendering process.',
        imageLabel: 'Plan decision panel',
        checkpoints: ['Match plan to workflow', 'Review upgrade need', 'Return to the relevant module'],
      },
    ],
  },
]



const HELP_PROGRESS_STORAGE_KEY = 'leadgen_help_progress_v1'

type HelpProgress = {
  activeLessonId: string
  completedLessonIds: string[]
}

function loadHelpProgress(): HelpProgress {
  try {
    const raw = window.localStorage.getItem(HELP_PROGRESS_STORAGE_KEY)

    if (!raw) {
      return {
        activeLessonId: lessons[0].id,
        completedLessonIds: [],
      }
    }

    const parsed = JSON.parse(raw) as Partial<HelpProgress>
    const validLessonIds = new Set(lessons.map((lesson) => lesson.id))
    const activeLessonId = typeof parsed.activeLessonId === 'string' && validLessonIds.has(parsed.activeLessonId)
      ? parsed.activeLessonId
      : lessons[0].id
    const completedLessonIds = Array.isArray(parsed.completedLessonIds)
      ? parsed.completedLessonIds.filter((id): id is string => typeof id === 'string' && validLessonIds.has(id))
      : []

    return {
      activeLessonId,
      completedLessonIds,
    }
  } catch {
    return {
      activeLessonId: lessons[0].id,
      completedLessonIds: [],
    }
  }
}

function buildFallbackSVG(sectionTitle: string, stepTitle: string, imageLabel: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#818cf8" />
        </linearGradient>
      </defs>
      <rect width="1200" height="700" rx="36" fill="url(#bg)" />
      <rect x="44" y="42" width="1112" height="616" rx="28" fill="#0b1220" stroke="#1e293b" />
      <rect x="76" y="78" width="260" height="544" rx="22" fill="#111827" stroke="#1e293b" />
      <rect x="374" y="78" width="744" height="104" rx="22" fill="#111827" stroke="#1e293b" />
      <rect x="374" y="214" width="232" height="168" rx="22" fill="#111827" stroke="#1e293b" />
      <rect x="628" y="214" width="232" height="168" rx="22" fill="#111827" stroke="#1e293b" />
      <rect x="882" y="214" width="236" height="168" rx="22" fill="#111827" stroke="#1e293b" />
      <rect x="374" y="414" width="744" height="208" rx="22" fill="#111827" stroke="#1e293b" />
      <rect x="98" y="110" width="120" height="14" rx="7" fill="#38bdf8" fill-opacity="0.9" />
      <rect x="98" y="142" width="180" height="10" rx="5" fill="#334155" />
      <rect x="98" y="196" width="216" height="42" rx="21" fill="url(#accent)" />
      <rect x="98" y="268" width="188" height="12" rx="6" fill="#334155" />
      <rect x="98" y="298" width="152" height="12" rx="6" fill="#334155" />
      <rect x="98" y="328" width="204" height="12" rx="6" fill="#334155" />
      <rect x="98" y="390" width="204" height="94" rx="18" fill="#0f172a" stroke="#1e293b" />
      <rect x="402" y="104" width="184" height="14" rx="7" fill="#e2e8f0" fill-opacity="0.9" />
      <rect x="402" y="134" width="282" height="10" rx="5" fill="#334155" />
      <rect x="906" y="104" width="180" height="36" rx="18" fill="url(#accent)" />
      <rect x="402" y="446" width="688" height="18" rx="9" fill="#e2e8f0" fill-opacity="0.84" />
      <rect x="402" y="484" width="468" height="12" rx="6" fill="#334155" />
      <rect x="402" y="514" width="618" height="12" rx="6" fill="#334155" />
      <rect x="402" y="544" width="534" height="12" rx="6" fill="#334155" />
      <text x="402" y="600" font-size="34" font-family="Arial, Helvetica, sans-serif" fill="#7dd3fc">${sectionTitle}</text>
      <text x="402" y="640" font-size="24" font-family="Arial, Helvetica, sans-serif" fill="#cbd5e1">${stepTitle} · ${imageLabel}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function buildStepImage(
  lessonTitle: string,
  stepTitle: string,
  fallbackLabel?: string
) {
  const lesson = helpImages[lessonTitle];

  if (lesson && lesson[stepTitle]) {
    return lesson[stepTitle]; // ✅ real image
  }

  // fallback to your existing SVG generator
  return buildFallbackSVG(lessonTitle, fallbackLabel || stepTitle, fallbackLabel || 'Image not found');
}

export default function HelpPage() {
  const [helpProgress, setHelpProgress] = useState<HelpProgress>(() => loadHelpProgress())
  const { activeLessonId, completedLessonIds } = helpProgress

  useEffect(() => {
    window.localStorage.setItem(HELP_PROGRESS_STORAGE_KEY, JSON.stringify(helpProgress))
  }, [helpProgress])

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === activeLessonId) ?? lessons[0],
    [activeLessonId],
  )

  const progress = Math.round((completedLessonIds.length / lessons.length) * 100)

  function openLesson(id: string) {
    setHelpProgress((current) => ({
      ...current,
      activeLessonId: id,
    }))
  }

  function toggleComplete(id: string) {
    setHelpProgress((current) => ({
      ...current,
      completedLessonIds: current.completedLessonIds.includes(id)
        ? current.completedLessonIds.filter((item) => item !== id)
        : [...current.completedLessonIds, id],
    }))
  }

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden p-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div>
            <div className="badge mb-4">Interactive help system</div>
            <h1 className="text-3xl font-semibold text-white">Learn the app module by module</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              This help area is designed as a guided training space. Open a section, follow the steps in order, use the visual walk-throughs,
              and jump straight into the live screen when you are ready to practice.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">{lessons.length} training sections</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Tenders included</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Step-by-step visuals included</div>
            </div>
          </div>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
            <div className="text-sm font-medium text-sky-100">Training progress</div>
            <div className="mt-3 text-4xl font-semibold text-white">{progress}%</div>
            <div className="mt-2 text-sm text-slate-300">
              {completedLessonIds.length} of {lessons.length} sections marked complete
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/80">
              <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="card p-4">
          <div className="mb-3 text-sm font-medium text-white">Help sections</div>
          <div className="space-y-2">
            {lessons.map((lesson, index) => {
              const isActive = lesson.id === activeLesson.id
              const isDone = completedLessonIds.includes(lesson.id)
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => openLesson(lesson.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isActive
                      ? 'border-sky-400/40 bg-sky-400/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Section {index + 1}</div>
                      <div className="mt-1 text-sm font-medium text-white">{lesson.title}</div>
                    </div>
                    {isDone ? <span className="badge">Done</span> : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{lesson.description}</p>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="badge mb-3">{activeLesson.title}</div>
                <h2 className="text-2xl font-semibold text-white">{activeLesson.goal}</h2>
                <p className="mt-3 max-w-3xl text-slate-300">{activeLesson.description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={activeLesson.route}
                  className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-sky-300"
                >
                  Open this section
                </Link>
                <button
                  type="button"
                  onClick={() => toggleComplete(activeLesson.id)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10"
                >
                  {completedLessonIds.includes(activeLesson.id) ? 'Mark incomplete' : 'Mark complete'}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <span className="font-medium">Coach tip:</span> {activeLesson.coachTip}
            </div>
          </section>

          <section className="space-y-5">
            {activeLesson.steps.map((step, index) => (
              <article key={`${activeLesson.id}-${step.title}`} className="card overflow-hidden p-0">
                <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="p-6">
                    <div className="text-xs uppercase tracking-[0.24em] text-sky-300">Step {index + 1}</div>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{step.title}</h3>
                    <p className="mt-3 text-slate-300">{step.body}</p>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-medium text-white">What to do</div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {step.checkpoints.map((checkpoint) => (
                          <li key={checkpoint} className="flex gap-3">
                            <span className="mt-[2px] text-sky-300">•</span>
                            <span>{checkpoint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-slate-950/40 p-6 xl:border-l xl:border-t-0">
                    <div className="mb-3 text-sm font-medium text-white">Visual guide</div>
                    <img
                      src={buildStepImage(activeLesson.title, step.title, step.imageLabel)}
                      alt={`${activeLesson.title} - ${step.imageLabel}`}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 object-cover shadow-2xl"
                    />
                    <div className="mt-3 text-xs text-slate-400">Illustrative training image: {step.imageLabel}</div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </div>
  )
}
