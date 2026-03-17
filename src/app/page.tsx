import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: '#0E0B1E', color: '#F0EEFF', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #2A2450' }}>
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="FlowLens" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg" style={{ color: '#F0EEFF' }}>FlowLens</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Docs'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`}
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: '#8B7EC8' }}
                >
                  {item}
                </a>
              ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <button className="text-sm px-4 py-2 rounded-lg transition-all"
                style={{ color: '#8B7EC8' }}>
                Sign in
              </button>
            </Link>
            <Link href="/sign-up">
              <button
                className="text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
              >
                Get started free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-28 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{ background: '#7C3AED22', border: '1px solid #7C3AED44', color: '#A78BFA' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7C3AED' }} />
          Now with AI-powered sprint retrospectives
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Engineering metrics
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            your team trusts
          </span>
        </h1>

        <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#8B7EC8' }}>
          FlowLens connects to GitHub and surfaces DORA metrics, PR cycle times,
          and AI-generated retrospectives — giving engineering managers
          <strong style={{ color: '#C4B8FF' }}> data instead of gut feelings</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <Link href="/sign-up">
            <button
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', boxShadow: '0 0 30px rgba(124,58,237,0.4)', fontSize: '15px' }}
            >
              Start for free →
            </button>
          </Link>
          <Link href="/sign-in">
            <button
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all"
              style={{ background: '#16122A', border: '1px solid #2A2450', color: '#C4B8FF', fontSize: '15px' }}
            >
              Sign in
            </button>
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mb-20">
          <p className="text-xs" style={{ color: '#4B4272' }}>Trusted by engineering teams at</p>
          {['Startups', 'Scale-ups', 'Agencies', 'Dev Teams'].map(c => (
            <span key={c} className="text-xs font-semibold" style={{ color: '#6B5FA0' }}>{c}</span>
          ))}
        </div>

        {/* Dashboard Preview */}
        <div
          className="rounded-2xl p-6 mx-auto max-w-5xl"
          style={{
            background: 'linear-gradient(135deg, #16122A, #1A1630)',
            border: '1px solid #2A2450',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.1)',
          }}
        >
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid #2A2450' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#F87171' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#10B981' }} />
            <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-center" style={{ background: '#0E0B1E', color: '#4B4272', border: '1px solid #2A2450' }}>
              flowlens-production.up.railway.app/dashboard
            </div>
          </div>

          {/* Fake DORA cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Deploy Freq', value: '4.2', unit: '/ week', badge: 'High', color: '#06B6D4' },
              { label: 'Lead Time', value: '18.4', unit: 'hrs', badge: 'Elite', color: '#10B981' },
              { label: 'Failure Rate', value: '8', unit: '%', badge: 'Medium', color: '#F59E0B' },
              { label: 'MTTR', value: '0.8', unit: 'hrs', badge: 'Elite', color: '#10B981' },
            ].map((m) => (
              <div key={m.label}
                className="rounded-xl p-4 text-left"
                style={{ background: '#0E0B1E66', border: '1px solid #2A2450' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4B4272' }}>{m.label}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${m.color}22`, color: m.color, fontSize: '10px' }}>
                    {m.badge}
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#F0EEFF', fontFamily: 'monospace' }}>{m.value}</p>
                <p className="text-xs mt-1" style={{ color: '#4B4272' }}>{m.unit}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total PRs tracked', value: '142' },
              { label: 'Total deployments', value: '38' },
              { label: 'Repos connected', value: '6' },
            ].map((s) => (
              <div key={s.label}
                className="rounded-lg px-4 py-3 flex items-center justify-between"
                style={{ background: '#0E0B1E66', border: '1px solid #2A2450' }}
              >
                <span className="text-xs" style={{ color: '#6B5FA0' }}>{s.label}</span>
                <span className="text-sm font-bold" style={{ color: '#F0EEFF', fontFamily: 'monospace' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ borderTop: '1px solid #2A2450', borderBottom: '1px solid #2A2450' }}>
        <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-4 gap-8 text-center">
          {[
            { value: '2 min', label: 'Setup time' },
            { value: '10+', label: 'Repos supported' },
            { value: '4', label: 'DORA metrics tracked' },
            { value: '3', label: 'AI providers supported' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold mb-1" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </p>
              <p className="text-sm" style={{ color: '#6B5FA0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: '#7C3AED' }}>Features</p>
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#F0EEFF' }}>Everything your engineering team needs</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#8B7EC8' }}>
            Stop guessing about your team's performance. Start shipping faster with data.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {[
            { icon: '▦', title: 'DORA Metrics', desc: 'Track deployment frequency, lead time, failure rate, and MTTR with industry benchmarks built in.', color: '#7C3AED' },
            { icon: '⌥', title: 'PR Analytics', desc: 'See cycle times, review bottlenecks, and PR size analysis across all your repos in one place.', color: '#06B6D4' },
            { icon: '↗', title: 'Trend Charts', desc: 'Visualize how your team\'s performance changes over time with weekly and daily breakdowns.', color: '#10B981' },
            { icon: '✦', title: 'AI Retrospectives', desc: 'Get AI-written sprint summaries based on your actual metrics — not templates, real data-driven insights.', color: '#EC4899' },
            { icon: '◈', title: 'Developer Analytics', desc: 'See contribution stats, review load, and cycle times per developer. Spot bottlenecks instantly.', color: '#F59E0B' },
            { icon: '⬡', title: 'GitHub OAuth', desc: 'Connect in one click. No manual setup, no CSV imports. Just authenticate and your data flows in.', color: '#A78BFA' },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 transition-all group"
              style={{ background: '#16122A', border: '1px solid #2A2450' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4"
                style={{ background: `${f.color}22`, color: f.color }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#F0EEFF' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8B7EC8' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: '#7C3AED' }}>Pricing</p>
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#F0EEFF' }}>Simple, transparent pricing</h2>
          <p className="text-lg" style={{ color: '#8B7EC8' }}>Start free. Upgrade when your team grows.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              name: 'Free',
              price: '$0',
              period: 'forever',
              desc: 'Perfect for solo engineers and small projects',
              color: '#6B5FA0',
              features: [
                '1 repository',
                'DORA metrics',
                'PR analytics',
                '30 days history',
                'AI retrospectives',
              ],
              cta: 'Get started free',
              href: '/sign-up',
              highlight: false,
            },
            {
              name: 'Pro',
              price: '$19',
              period: 'per month',
              desc: 'For growing engineering teams',
              color: '#7C3AED',
              features: [
                '10 repositories',
                'Everything in Free',
                '90 days history',
                'PDF export',
                'Slack notifications',
                'Team goals & targets',
                'Priority support',
              ],
              cta: 'Start Pro trial',
              href: '/sign-up',
              highlight: true,
            },
            {
              name: 'Team',
              price: '$49',
              period: 'per month',
              desc: 'For larger teams and organizations',
              color: '#06B6D4',
              features: [
                'Unlimited repositories',
                'Everything in Pro',
                '1 year history',
                'Jira integration',
                'Team management',
                'SSO / SAML',
                'SLA support',
              ],
              cta: 'Contact us',
              href: '/sign-up',
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl p-6 relative"
              style={{
                background: plan.highlight ? 'linear-gradient(135deg, #16122A, #1E1A35)' : '#16122A',
                border: plan.highlight ? `1px solid ${plan.color}66` : '1px solid #2A2450',
                boxShadow: plan.highlight ? `0 0 40px ${plan.color}22` : 'none',
              }}
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
                >
                  Most Popular
                </div>
              )}
              <p className="font-bold text-sm mb-1" style={{ color: plan.color }}>{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold" style={{ color: '#F0EEFF' }}>{plan.price}</span>
                <span className="text-sm" style={{ color: '#6B5FA0' }}>/{plan.period}</span>
              </div>
              <p className="text-sm mb-6" style={{ color: '#6B5FA0' }}>{plan.desc}</p>

              <Link href={plan.href}>
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-6"
                  style={plan.highlight ? {
                    background: `linear-gradient(135deg, ${plan.color}, #6D28D9)`,
                    color: '#fff',
                    boxShadow: `0 0 20px ${plan.color}44`,
                  } : {
                    background: '#1E1A35',
                    border: `1px solid ${plan.color}44`,
                    color: plan.color,
                  }}
                >
                  {plan.cta}
                </button>
              </Link>

              <div className="space-y-2.5">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <span className="text-sm" style={{ color: '#10B981' }}>✓</span>
                    <span className="text-sm" style={{ color: '#C4B8FF' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-8 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold" style={{ color: '#F0EEFF' }}>How FlowLens compares</h2>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2450' }}>
          <div className="grid grid-cols-4 gap-0" style={{ borderBottom: '1px solid #2A2450', background: '#16122A' }}>
            {['Feature', 'FlowLens', 'LinearB', 'Swarmia'].map((h, i) => (
              <div key={h} className={`px-5 py-4 text-xs font-bold uppercase tracking-widest ${i === 1 ? '' : ''}`}
                style={{ color: i === 1 ? '#A78BFA' : '#4B4272', background: i === 1 ? '#7C3AED11' : 'transparent' }}>
                {h}
              </div>
            ))}
          </div>
          {[
            ['DORA Metrics', '✓', '✓', '✓'],
            ['PR Analytics', '✓', '✓', '✓'],
            ['AI Retrospectives', '✓', '✗', '✗'],
            ['Free tier', '✓', '✗', '✗'],
            ['Setup time', '< 2 min', '~1 hour', '~30 min'],
            ['Pricing', 'Free–$49/mo', '$49+/mo', '$240/dev/yr'],
          ].map(([feature, fl, lb, sw], i) => (
            <div key={feature}
              className="grid grid-cols-4"
              style={{ borderBottom: '1px solid #2A245044', background: i % 2 === 0 ? 'transparent' : '#16122A44' }}
            >
              <div className="px-5 py-3.5 text-sm" style={{ color: '#8B7EC8' }}>{feature}</div>
              <div className="px-5 py-3.5 text-sm font-semibold" style={{ color: fl === '✓' ? '#10B981' : fl === '✗' ? '#4B4272' : '#C4B8FF', background: '#7C3AED08' }}>{fl}</div>
              <div className="px-5 py-3.5 text-sm" style={{ color: lb === '✓' ? '#C4B8FF' : lb === '✗' ? '#4B4272' : '#8B7EC8' }}>{lb}</div>
              <div className="px-5 py-3.5 text-sm" style={{ color: sw === '✓' ? '#C4B8FF' : sw === '✗' ? '#4B4272' : '#8B7EC8' }}>{sw}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ borderTop: '1px solid #2A2450' }}>
        <div className="max-w-3xl mx-auto px-8 py-24 text-center">
          <div
            className="rounded-3xl p-12"
            style={{
              background: 'linear-gradient(135deg, #16122A, #1E1A35)',
              border: '1px solid #7C3AED44',
              boxShadow: '0 0 60px rgba(124,58,237,0.1)',
            }}
          >
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#F0EEFF' }}>
              Start measuring what matters
            </h2>
            <p className="text-lg mb-8" style={{ color: '#8B7EC8' }}>
              Connect your GitHub in 2 minutes and see your first DORA metrics today.
              No credit card required.
            </p>
            <Link href="/sign-up">
              <button
                className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                  boxShadow: '0 0 40px rgba(124,58,237,0.4)',
                }}
              >
                Get started free →
              </button>
            </Link>
            <p className="text-xs mt-4" style={{ color: '#4B4272' }}>
              Free forever · No credit card · 2 minute setup
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #2A2450' }}>
        <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="FlowLens" className="w-6 h-6 object-contain" />
            <span className="font-bold text-sm" style={{ color: '#F0EEFF' }}>FlowLens</span>
            <span className="text-xs" style={{ color: '#4B4272' }}>· Built for engineering teams who ship</span>
          </div>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map(item => (
              <a key={item} href="#" className="text-xs transition-colors" style={{ color: '#4B4272' }}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}