import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#080B0F] text-white" style={{ fontFamily: "'GeistSans', system-ui, sans-serif" }}>
      
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-sm">⚡</div>
          <span className="font-semibold tracking-tight">FlowLens</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
          <Link href="/sign-up" className="text-sm bg-white text-black font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Now with AI-powered sprint retrospectives
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Engineering metrics<br />
          <span className="text-gray-500">your team actually trusts</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          FlowLens connects to GitHub and surfaces DORA metrics, PR cycle times, and AI-generated retrospectives — giving engineering managers data instead of gut feelings.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/sign-up">
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition text-sm">
              Start for free →
            </button>
          </Link>
          <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition">
            Sign in to existing account
          </Link>
        </div>
      </section>

      {/* Fake dashboard preview */}
      <section className="max-w-5xl mx-auto px-8 mb-24">
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Deployment Freq', value: '4.2', unit: '/ week', good: true },
              { label: 'Lead Time', value: '18.4', unit: 'hrs', good: true },
              { label: 'Failure Rate', value: '8', unit: '%', good: true },
              { label: 'MTTR', value: '0.8', unit: 'hrs', good: true },
            ].map((m) => (
              <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">{m.label}</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</p>
                <p className="text-xs text-gray-600 mt-1">{m.unit}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total PRs tracked', value: '142' },
              { label: 'Total deployments', value: '38' },
              { label: 'Repos connected', value: '6' },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className="text-sm font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 mb-24">
        <p className="text-xs uppercase tracking-widest text-gray-600 text-center mb-12">Everything your engineering team needs</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '▦', title: 'DORA Metrics', desc: 'Track the 4 key engineering metrics that every CTO knows — deployment frequency, lead time, failure rate, and MTTR.' },
            { icon: '⌥', title: 'PR Analytics', desc: 'See cycle times, review bottlenecks, and PR size analysis across all your repos in one place.' },
            { icon: '↗', title: 'Trend Charts', desc: 'Visualize how your team\'s performance changes over time with weekly and daily trend breakdowns.' },
            { icon: '✦', title: 'AI Retrospectives', desc: 'Get AI-written sprint summaries based on your actual metrics — not templates, real data-driven insights.' },
            { icon: '⬡', title: 'GitHub OAuth', desc: 'Connect in one click. No manual setup, no CSV imports. Just authenticate and your data flows in automatically.' },
            { icon: '◈', title: 'Multi-repo Support', desc: 'Track up to 10 repos simultaneously. See aggregate metrics or drill down into individual repositories.' },
          ].map((f) => (
            <div key={f.title} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.10] transition-all">
              <div className="text-blue-400 mb-4 text-lg">{f.icon}</div>
              <h3 className="font-medium text-sm mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-8 mb-24">
        <p className="text-xs uppercase tracking-widest text-gray-600 text-center mb-8">How FlowLens compares</p>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 gap-0 border-b border-white/[0.06]">
            {['Feature', 'FlowLens', 'LinearB', 'Swarmia'].map((h, i) => (
              <div key={h} className={`px-5 py-3 text-xs font-medium uppercase tracking-widest ${i === 1 ? 'text-blue-400 bg-blue-500/[0.05]' : 'text-gray-500'}`}>{h}</div>
            ))}
          </div>
          {[
            ['DORA Metrics', '✓', '✓', '✓'],
            ['PR Analytics', '✓', '✓', '✓'],
            ['AI Retrospectives', '✓', '✗', '✗'],
            ['Free tier', '✓', '✗', '✗'],
            ['Setup time', '< 2 min', '~1 hour', '~30 min'],
            ['Pricing', 'Free', '$49+/mo', '$240/dev/yr'],
          ].map(([feature, fl, lb, sw], i) => (
            <div key={feature} className={`grid grid-cols-4 border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
              <div className="px-5 py-3 text-sm text-gray-400">{feature}</div>
              <div className={`px-5 py-3 text-sm font-medium bg-blue-500/[0.03] ${fl === '✓' ? 'text-emerald-400' : fl === '✗' ? 'text-gray-600' : 'text-white'}`}>{fl}</div>
              <div className={`px-5 py-3 text-sm ${lb === '✓' ? 'text-gray-300' : lb === '✗' ? 'text-gray-600' : 'text-gray-400'}`}>{lb}</div>
              <div className={`px-5 py-3 text-sm ${sw === '✓' ? 'text-gray-300' : sw === '✗' ? 'text-gray-600' : 'text-gray-400'}`}>{sw}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-8 pb-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Start measuring what matters</h2>
        <p className="text-gray-500 mb-8">Connect your GitHub in 2 minutes and see your first DORA metrics today.</p>
        <Link href="/sign-up">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3.5 rounded-lg transition">
            Get started free →
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-8 py-6 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-xs">⚡</div>
          <span className="text-sm text-gray-600">FlowLens</span>
        </div>
        <p className="text-xs text-gray-700">Built for engineering teams who ship</p>
      </footer>

    </div>
  )
}