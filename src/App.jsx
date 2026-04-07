import React, { useState, useRef, useEffect } from 'react'
import clients from './data/clients.json'

function formatCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPercent(n) {
  return `${(n * 100).toFixed(1)}%`
}

function daysUntil(d) {
  const diff = new Date(d) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Simple markdown-ish renderer ────────────────────────────────
function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/---/g, '<hr />')
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
  // Wrap remaining text in <p>
  html = html.split('\n').map(line => {
    if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line.startsWith('<hr') || line.trim() === '') return line
    return `<p>${line}</p>`
  }).join('\n')
  return html
}

// ─── Build prompts ───────────────────────────────────────────────
function buildMeetingPrepPrompt(client) {
  const c = client
  return `You are an AI assistant for a wealth management firm (Rhame & Gorrell Wealth Management). Generate a comprehensive meeting preparation brief for an upcoming client meeting.

CLIENT DATA (from CRM):
${JSON.stringify(c, null, 2)}

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

Generate a meeting prep brief with these sections:
1. **Client Snapshot** — Quick summary of who they are, key relationships, risk tolerance
2. **Portfolio Overview** — AUM, allocation highlights, YTD performance, any concentration risks
3. **Key Benefits & Planning Items** — Pension status, Mega Roth, NUA eligibility, RMDs, etc.
4. **Recent Life Events** — What's changed since last meeting
5. **Open Action Items** — Status check on what was promised last meeting
6. **Recommended Discussion Topics** — What the advisor should bring up, prioritized
7. **Preparation Checklist** — Specific materials/analyses to have ready

Use markdown formatting. Be specific and actionable — this is for the advisor's eyes only. Reference specific dollar amounts, dates, and plan details from the data.`
}

function buildFollowUpEmailPrompt(client) {
  const c = client
  return `You are an AI assistant for a wealth management firm (Rhame & Gorrell Wealth Management). Draft a personalized follow-up email from the advisor to the client after their meeting.

CLIENT DATA (from CRM):
${JSON.stringify(c, null, 2)}

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

Write a warm, professional follow-up email that:
- Thanks them for their time
- Summarizes the key topics discussed (infer from open action items and life events)
- Lists clear next steps with owners and timelines
- Strikes the right tone for this specific client (reference their communication preferences and personal notes)
- Includes a personal touch related to their life events
- Signs off from their assigned advisor

The email should feel personal, not templated. Use the client's first name. Keep it concise but thorough. Format as:

**Subject:** [subject line]

[email body]

Best regards,
[advisor name]`
}

// ─── Backend API call ────────────────────────────────────────────
async function callBackend(prompt) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data.response
}

// ─── Client Card ─────────────────────────────────────────────────
function ClientCard({ client, selected, onClick }) {
  const c = client.profile
  const nextMeeting = client.meetings.nextScheduled
  const days = daysUntil(nextMeeting)
  const isUrgent = days <= 7

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        selected
          ? 'bg-navy-800/80 border-gold-500/40 shadow-lg shadow-gold-500/5'
          : 'bg-navy-900/40 border-navy-700/30 hover:bg-navy-800/50 hover:border-navy-600/40'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-display text-lg text-gold-100">{c.firstName} {c.lastName}</h3>
          <p className="text-sm text-navy-300">{c.title}</p>
        </div>
        <span className="text-xs font-mono bg-navy-800 text-gold-400 px-2 py-1 rounded-md">
          {formatCurrency(client.portfolio.totalAUM)}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-navy-400">
        <span className={`flex items-center gap-1 ${isUrgent ? 'text-gold-400' : ''}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {days > 0 ? `${days}d` : 'Today'}
        </span>
        <span>{c.advisorAssigned.split(',')[0]}</span>
        {client.meetings.openActionItems.length > 0 && (
          <span className="flex items-center gap-1 text-gold-500/70">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500/70" />
            {client.meetings.openActionItems.length} open
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Client Detail Panel ─────────────────────────────────────────
function ClientDetail({ client }) {
  const c = client.profile
  const p = client.portfolio

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl text-gold-100">{c.firstName} {c.lastName}</h2>
          <p className="text-navy-300 mt-1">{c.title} · {c.employer}</p>
          {c.spouse && <p className="text-navy-400 text-sm mt-1">Spouse: {c.spouse.firstName} ({c.spouse.age})</p>}
          {c.dependents?.length > 0 && (
            <p className="text-navy-400 text-sm">
              Dependents: {c.dependents.map(d => `${d.name} (${d.age})`).join(', ')}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl text-gold-300">{formatCurrency(p.totalAUM)}</p>
          <p className="text-sm text-navy-400">Total AUM</p>
        </div>
      </div>

      {/* Accounts */}
      <div className="bg-navy-900/50 border border-navy-700/30 rounded-xl p-4">
        <h3 className="font-display text-sm text-gold-200 mb-3 uppercase tracking-wider">Accounts</h3>
        <div className="space-y-2">
          {p.accounts.map((a, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-navy-300">{a.type}</span>
              <span className="font-mono text-navy-200">{formatCurrency(a.balance)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-navy-900/50 border border-navy-700/30 rounded-xl p-3 text-center">
          <p className="text-xs text-navy-400 mb-1">YTD Return</p>
          <p className="font-mono text-lg text-emerald-400">{formatPercent(p.ytdPerformance)}</p>
        </div>
        <div className="bg-navy-900/50 border border-navy-700/30 rounded-xl p-3 text-center">
          <p className="text-xs text-navy-400 mb-1">Risk</p>
          <p className="text-sm text-navy-200 capitalize">{c.riskTolerance}</p>
        </div>
        <div className="bg-navy-900/50 border border-navy-700/30 rounded-xl p-3 text-center">
          <p className="text-xs text-navy-400 mb-1">Next Meeting</p>
          <p className="text-sm text-navy-200">{formatDate(client.meetings.nextScheduled)}</p>
        </div>
      </div>

      {/* Life Events */}
      {client.lifeEvents.length > 0 && (
        <div className="bg-navy-900/50 border border-navy-700/30 rounded-xl p-4">
          <h3 className="font-display text-sm text-gold-200 mb-3 uppercase tracking-wider">Life Events</h3>
          <div className="space-y-3">
            {client.lifeEvents.map((e, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1 rounded-full bg-gold-500/30 flex-shrink-0" />
                <div>
                  <p className="text-sm text-navy-200">
                    <span className="text-gold-400 capitalize">{e.type.replace(/_/g, ' ')}</span>
                    <span className="text-navy-500 ml-2">{formatDate(e.date)}</span>
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">{e.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Action Items */}
      {client.meetings.openActionItems.length > 0 && (
        <div className="bg-navy-900/50 border border-gold-500/15 rounded-xl p-4">
          <h3 className="font-display text-sm text-gold-200 mb-3 uppercase tracking-wider">Open Action Items</h3>
          <div className="space-y-2">
            {client.meetings.openActionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="w-5 h-5 rounded border border-gold-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-gold-500/50">{i + 1}</span>
                <span className="text-navy-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AI Output Panel ─────────────────────────────────────────────
function AIPanel({ client }) {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(null) // 'prep' | 'email'
  const outputRef = useRef(null)

  useEffect(() => {
    setOutput('')
    setMode(null)
  }, [client?.id])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  async function generate(type) {
    setMode(type)
    setOutput('')
    setLoading(true)
    const prompt = type === 'prep'
      ? buildMeetingPrepPrompt(client)
      : buildFollowUpEmailPrompt(client)
    try {
      const response = await callBackend(prompt)
      setOutput(response)
    } catch (err) {
      setOutput(`**Error:** ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Action buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => generate('prep')}
          disabled={loading}
          className="flex-1 py-3 px-4 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-navy-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Prepare for Meeting
        </button>
        <button
          onClick={() => generate('email')}
          disabled={loading}
          className="flex-1 py-3 px-4 bg-navy-700 hover:bg-navy-600 disabled:opacity-40 text-navy-100 font-semibold rounded-xl transition-all border border-navy-600/50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Draft Follow-Up Email
        </button>
      </div>

      {/* Output area */}
      <div ref={outputRef} className="flex-1 overflow-y-auto rounded-xl border border-navy-700/30 bg-navy-950/60 p-5">
        {!mode && !output && (
          <div className="h-full flex flex-col items-center justify-center text-navy-500">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <p className="text-sm">Select an action to generate AI-powered content</p>
          </div>
        )}
        {loading && (
          <div className="h-full flex flex-col items-center justify-center text-navy-400">
            <div className="flex gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse-dot" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse-dot" style={{ animationDelay: '200ms' }} />
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse-dot" style={{ animationDelay: '400ms' }} />
            </div>
            <p className="text-sm">
              {mode === 'prep' ? 'Analyzing client data and preparing brief...' : 'Drafting personalized email...'}
            </p>
            <p className="text-xs text-navy-500 mt-2">This may take a moment — Claude is thinking...</p>
          </div>
        )}
        {output && !loading && (
          <div className="ai-output animate-fade-in" dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }} />
        )}
      </div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────
export default function App() {
  const [selectedId, setSelectedId] = useState(clients[0].id)

  const selectedClient = clients.find(c => c.id === selectedId)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-navy-700/30 bg-navy-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg text-gold-100">Advisor AI</h1>
            <p className="text-xs text-navy-400">Meeting Prep & Client Outreach</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-navy-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Powered by Claude CLI
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — Client List */}
        <aside className="w-80 flex-shrink-0 border-r border-navy-700/30 bg-navy-950/40 p-4 overflow-y-auto">
          <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3 px-1">
            Upcoming Meetings
          </h2>
          <div className="space-y-2">
            {clients
              .sort((a, b) => new Date(a.meetings.nextScheduled) - new Date(b.meetings.nextScheduled))
              .map(c => (
                <ClientCard
                  key={c.id}
                  client={c}
                  selected={c.id === selectedId}
                  onClick={() => setSelectedId(c.id)}
                />
              ))}
          </div>
        </aside>

        {/* Center — Client Detail */}
        <section className="w-[420px] flex-shrink-0 border-r border-navy-700/30 bg-navy-950/20 p-5 overflow-y-auto">
          {selectedClient && <ClientDetail client={selectedClient} />}
        </section>

        {/* Right — AI Panel */}
        <section className="flex-1 p-5 flex flex-col min-w-0">
          {selectedClient && (
            <AIPanel client={selectedClient} />
          )}
        </section>
      </div>
    </div>
  )
}
