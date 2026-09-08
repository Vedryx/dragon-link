import { useEffect, useMemo, useRef, useState } from 'react'
import { RIBBON, SERVICES, WHATSAPP_NUMBER } from './data.js'

const LOGO = '/assets/logo.jpg'
const HERO_PHOTO = '/assets/hero-photo.webp'
const DEIRA_PHOTO = null // drop a photograph at /assets/deira-photo.webp and point this at it

/* ── small helpers ─────────────────────────────────────────────────────── */

function Icon({ paths, size = 19, width = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

const WA_PATH = ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z']
const ARROW_PATH = ['M5 12h14', 'm12 5 7 7-7 7']

function Photo({ src, alt, placeholder }) {
  if (!src) return <div className="dl-slot">{placeholder}</div>
  return <div className="dl-slot"><img src={src} alt={alt} loading="lazy" decoding="async" /></div>
}

/* ── scroll behaviours (reveal, parallax, auto-hiding nav) ─────────────── */

function useScrollChrome() {
  const parallaxRef = useRef(null)
  const navRef = useRef(null)

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let io, revealTimer, onScroll

    if (!reduce && 'IntersectionObserver' in window) {
      const els = Array.from(document.querySelectorAll('[data-reveal]'))
      const show = (el) => {
        if (el.dataset.revealed) return
        el.dataset.revealed = '1'
        const d = parseInt(el.dataset.delay || '0', 10)
        el.style.animation = `dlRise .8s cubic-bezier(.2,.7,.2,1) ${d}ms both`
        el.style.opacity = ''
      }
      let delivered = false
      io = new IntersectionObserver((entries) => {
        // hide-on-first-callback: only dim pending elements once the observer proves it delivers
        if (!delivered) {
          delivered = true
          els.forEach((el) => { if (!el.dataset.revealed) el.style.opacity = '0' })
        }
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          show(e.target)
          io.unobserve(e.target)
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
      els.forEach((el) => io.observe(el))
      // unconditional safety net — nothing can stay stranded at opacity 0
      revealTimer = setTimeout(() => els.forEach(show), 1200)
    }

    if (!reduce) {
      let last = window.scrollY, hidden = false
      onScroll = () => {
        const y0 = window.scrollY
        const el = parallaxRef.current
        if (el) el.style.transform = `translateY(${Math.max(-26, Math.min(26, (y0 - 120) * -0.06))}px)`

        const nav = navRef.current
        if (!nav) return
        const dy = y0 - last
        if (Math.abs(dy) > 4) {
          if (dy > 0 && y0 > 140 && !hidden) {
            hidden = true
            nav.style.transform = `translateY(-${nav.offsetHeight + 6}px)`
            nav.style.boxShadow = 'none'
          } else if (dy < 0 && hidden) {
            hidden = false
            nav.style.transform = 'translateY(0)'
            nav.style.boxShadow = y0 > 140 ? 'var(--shadow-sm)' : 'none'
          }
          last = y0
        }
        if (y0 <= 140 && hidden) { hidden = false; nav.style.transform = 'translateY(0)'; nav.style.boxShadow = 'none' }
      }
      window.addEventListener('scroll', onScroll, { passive: true })
    }

    return () => {
      if (io) io.disconnect()
      if (revealTimer) clearTimeout(revealTimer)
      if (onScroll) window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return { parallaxRef, navRef }
}

/* ── page ──────────────────────────────────────────────────────────────── */

const EMPTY_FORM = { name: '', nationality: '', phone: '', email: '', message: '' }

export default function App({ floatingWhatsApp = true }) {
  const { parallaxRef, navRef } = useScrollChrome()

  const [svcKey, setSvcKey] = useState('visa')
  const [subKey, setSubKey] = useState('tourist')
  const [anim, setAnim] = useState('dlFadeA')
  const [form, setForm] = useState(EMPTY_FORM)
  const [files, setFiles] = useState({})
  const [sent, setSent] = useState(false)

  const active = useMemo(() => SERVICES.find((s) => s.key === svcKey), [svcKey])
  const sub = useMemo(
    () => active.options.find((o) => o.key === subKey) || active.options[0],
    [active, subKey],
  )

  const docs = useMemo(
    () => [...active.baseDocs, ...sub.docs].map(([key, label]) => ({
      key,
      label,
      status: files[key] ? `Attached · ${files[key]}` : 'Required',
      mark: files[key] ? 'var(--color-accent)' : 'var(--color-divider)',
    })),
    [active, sub, files],
  )

  const pick = (key) => {
    const next = SERVICES.find((s) => s.key === key)
    setSvcKey(key)
    setSubKey(next.options[0].key)
    setAnim((a) => (a === 'dlFadeA' ? 'dlFadeB' : 'dlFadeA'))
    setFiles({})
    setSent(false)
  }

  const onField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const onFile = (e) => {
    const k = e.target.dataset.doc
    const file = e.target.files && e.target.files[0]
    setFiles((prev) => ({ ...prev, [k]: file ? file.name : undefined }))
  }
  const reset = () => { setSent(false); setFiles({}); setForm(EMPTY_FORM) }

  const waText =
    `Hello Dragon Link, I would like help with ${active.title} — ${sub.label}.` +
    (form.name ? `\nName: ${form.name}` : '') +
    (form.nationality ? `\nNationality: ${form.nationality}` : '') +
    (form.message ? `\nDetails: ${form.message}` : '')
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`

  return (
    <>
      {/* ── nav ─────────────────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="nav"
        style={{
          position: 'sticky', top: 0, zIndex: 30, transform: 'translateY(0)',
          transition: 'transform .32s cubic-bezier(.3,.7,.2,1), box-shadow .32s ease',
          willChange: 'transform',
          background: 'color-mix(in srgb, var(--color-bg) 86%, transparent)',
          backdropFilter: 'blur(12px)', paddingInline: 'clamp(20px, 5vw, 72px)',
          gap: 'var(--space-4)', borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <a className="dl-nav-brand" href="#top" style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 'auto', flex: 'none', whiteSpace: 'nowrap', textDecoration: 'none', color: 'var(--color-text)', transition: 'opacity .3s ease' }}>
          <img src={LOGO} alt="Dragon Link" width="46" height="46" style={{ width: 46, height: 46, mixBlendMode: 'multiply', objectFit: 'cover' }} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span className="dl-nav-name" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, letterSpacing: '0.02em' }}>Dragon Link</span>
            <span style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>Stronger Together</span>
          </span>
        </a>
        <div className="dl-navlinks" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          {[['#services', 'Services'], ['#why', 'Why us'], ['#contact', 'Contact']].map(([href, label]) => (
            <a key={href} className="dl-navlink" href={href} style={{ color: 'inherit', textDecoration: 'none', fontSize: 14, paddingBottom: 3, borderBottom: '1px solid transparent', transition: 'color .3s ease, border-color .3s ease' }}>{label}</a>
          ))}
        </div>
        <a className="btn btn-primary dl-btn-lift" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener" style={{ whiteSpace: 'nowrap', transition: 'background .3s ease, transform .3s ease, box-shadow .3s ease' }}>
          <Icon paths={WA_PATH} size={15} width={2} />
          WhatsApp
        </a>
      </nav>

      {/* ── hero ────────────────────────────────────────────────────────── */}
      <section id="top" style={{ position: 'relative', overflow: 'hidden', background: '#171614', color: '#f6f3ee' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 70% at 78% 28%, rgba(182,130,53,.34), transparent 68%), radial-gradient(50% 60% at 8% 88%, rgba(182,130,53,.18), transparent 70%)', animation: 'dlGlow 11s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -140, right: -140, width: 460, height: 460, border: '1px solid rgba(225,173,102,.16)', borderRadius: '50%', animation: 'dlSpinSlow 60s linear infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: 'clamp(56px, 7vw, 108px) clamp(20px, 5vw, 72px) clamp(48px, 6vw, 96px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '44px clamp(32px, 5vw, 84px)', alignItems: 'center' }}>
          <div>
            <span className="dl-hero-badge" data-reveal data-delay="0" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#e1ad66', border: '1px solid rgba(225,173,102,.4)', borderRadius: 999, padding: '7px 16px', marginBottom: 26, whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e1ad66', animation: 'dlGlow 2.6s ease-in-out infinite' }} />
              Al Rigga · Deira · Dubai
            </span>
            <h1 data-reveal data-delay="90" style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(46px, 6.4vw, 88px)', lineHeight: 1.03, letterSpacing: '-0.012em', margin: '0 0 26px -0.04em' }}>
              <span style={{ display: 'block' }}>Your journey,</span>
              <span style={{ display: 'block' }}>your business,</span>
              <span style={{ display: 'block', background: 'linear-gradient(100deg, #b68235, #ffe3bf 28%, #e1ad66 52%, #b68235 78%, #ffe3bf)', backgroundSize: '220% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'dlShimmer 7s linear infinite' }}>one trusted link.</span>
            </h1>
            <p data-reveal data-delay="170" style={{ fontSize: 17.5, lineHeight: 1.7, maxWidth: '54ch', margin: '0 0 34px', color: 'rgba(246,243,238,.82)' }}>
              Dragon Link Consultancy &amp; Travel Tours handles the paperwork and the plane tickets — visas, company formation, PRO services and holidays — from a single desk in Deira, so you never have to chase an office twice.
            </p>
            <div className="dl-hero-cta" data-reveal data-delay="240" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <a className="btn dl-btn-gold" href="#services" style={{ minHeight: 46, paddingInline: 26, fontSize: 15, color: '#171614', background: 'linear-gradient(100deg, #e1ad66, #ffe3bf 45%, #c28d41)', border: '1px solid #e1ad66', transition: 'transform .3s ease, box-shadow .3s ease, filter .3s ease' }}>Explore services</a>
              <a className="btn dl-btn-outline-light" href="tel:+971504308516" style={{ minHeight: 46, paddingInline: 22, fontSize: 15, color: '#f6f3ee', border: '1px solid rgba(246,243,238,.3)', transition: 'border-color .3s ease, background .3s ease, transform .3s ease' }}>
                <Icon size={16} width={2} paths={['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z']} />
                +971 50 430 8516
              </a>
            </div>
            <div className="dl-hero-stats" data-reveal data-delay="320" style={{ display: 'flex', gap: 'clamp(24px, 4vw, 48px)', flexWrap: 'wrap', marginTop: 46, paddingTop: 26, borderTop: '1px solid rgba(246,243,238,.14)' }}>
              {[['4', 'Service lines', '#e1ad66'], ['1', 'Point of contact', undefined], ['7 days', 'On WhatsApp', undefined]].map(([n, label, color]) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 36, lineHeight: 1, margin: '0 0 8px', fontFeatureSettings: "'tnum' 1", color }}>{n}</p>
                  <p style={{ margin: 0, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(246,243,238,.62)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="dl-hero-photo" data-reveal data-delay="140" style={{ position: 'relative', justifySelf: 'end', width: 'min(100%, 520px)' }}>
            <div className="dl-hero-frame" style={{ position: 'absolute', inset: -26, border: '1px solid rgba(225,173,102,.28)', borderRadius: 4, pointerEvents: 'none' }} />
            <figure ref={parallaxRef} className="plate" style={{ margin: 0, width: '100%', aspectRatio: '4 / 5', borderColor: 'rgba(246,243,238,.12)', boxShadow: '0 28px 70px rgba(0,0,0,.45)', transition: 'transform .6s cubic-bezier(.2,.7,.2,1)' }}>
              <Photo src={HERO_PHOTO} alt="Dubai skyline at dusk" placeholder="Dubai skyline or travel photograph" />
            </figure>
            <img className="dl-hero-logo" src={LOGO} alt="" width="118" height="118" style={{ position: 'absolute', right: -20, bottom: -26, width: 118, height: 118, objectFit: 'cover', borderRadius: '50%', border: '1px solid rgba(225,173,102,.45)', boxShadow: '0 12px 30px rgba(0,0,0,.5)', animation: 'dlDrift 8s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ── marquee ribbon ──────────────────────────────────────────────── */}
      <div style={{ overflow: 'hidden', borderBottom: '1px solid var(--color-divider)', background: 'color-mix(in srgb, var(--color-accent-100) 45%, var(--color-bg))' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: 'dlMarquee 34s linear infinite' }}>
          {[...RIBBON, ...RIBBON].map((label, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 22, padding: '12px 22px', fontFamily: 'var(--font-heading)', fontSize: 15, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent-800)', whiteSpace: 'nowrap' }}>
              {label}
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)' }} />
            </span>
          ))}
        </div>
      </div>

      {/* ── services ────────────────────────────────────────────────────── */}
      <section id="services" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(52px, 6vw, 92px) clamp(20px, 5vw, 72px) clamp(44px, 5vw, 76px)', scrollMarginTop: 84 }}>
        <div data-reveal style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24, flexWrap: 'wrap', marginBottom: 36 }}>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 16 }}>
              Services<span style={{ width: 54, height: 1, background: 'linear-gradient(90deg, var(--color-accent), transparent)' }} />
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(31px, 3.6vw, 46px)', lineHeight: 1.08, margin: 0 }}>Choose a service to see what we need from you.</h2>
          </div>
          <p className="dl-services-note" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'color-mix(in srgb, var(--color-text) 70%, transparent)', maxWidth: '34ch' }}>Details and required documents update as you pick. Scroll the strip on smaller screens.</p>
        </div>

        <div className="dl-strip" data-reveal style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(250px, 1fr)', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '6px 6px 14px', margin: '0 -6px', scrollbarWidth: 'none' }}>
          {SERVICES.map((s) => {
            const on = s.key === svcKey
            return (
              <button
                key={s.key} type="button" className="dl-svc-card" onClick={() => pick(s.key)} aria-pressed={on}
                style={{
                  scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: 'pointer',
                  font: 'inherit', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: 14,
                  padding: '24px 22px 20px', borderRadius: 'var(--radius-md)',
                  background: on ? 'linear-gradient(160deg, color-mix(in srgb, var(--color-accent-100) 85%, transparent), color-mix(in srgb, var(--color-bg) 92%, transparent))' : 'transparent',
                  border: `1px solid ${on ? 'var(--color-accent)' : 'var(--color-divider)'}`,
                  boxShadow: on ? 'var(--shadow-md)' : 'none',
                  transform: on ? 'translateY(-6px)' : 'none',
                  transition: 'border-color .4s ease, background .4s ease, box-shadow .4s ease, transform .4s cubic-bezier(.2,.7,.2,1)',
                }}
              >
                <span style={{ position: 'absolute', top: 0, left: 0, height: 3, width: on ? '100%' : '0%', background: 'linear-gradient(90deg, var(--color-accent-600), var(--color-accent-300))', transition: 'width .5s cubic-bezier(.2,.7,.2,1)' }} />
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `1px solid ${on ? 'var(--color-accent)' : 'var(--color-divider)'}`, background: on ? 'color-mix(in srgb, var(--color-accent-200) 55%, transparent)' : 'transparent', color: 'var(--color-accent-700)', transition: 'border-color .4s ease, background .4s ease' }}>
                    <Icon paths={s.icon} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 17, letterSpacing: '0.06em', color: on ? 'var(--color-accent-700)' : 'color-mix(in srgb, var(--color-text) 42%, transparent)', fontFeatureSettings: "'tnum' 1", transition: 'color .4s ease' }}>{s.num}</span>
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22, lineHeight: 1.14 }}>{s.title}</span>
                <span style={{ fontSize: 13, lineHeight: 1.55, color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}>{s.lead}</span>
                <span style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: on ? 'var(--color-accent-700)' : 'color-mix(in srgb, var(--color-text) 50%, transparent)', transition: 'color .4s ease' }}>
                  {on ? 'Selected' : 'View details'}
                  <Icon paths={ARROW_PATH} size={13} width={2} />
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '24px clamp(24px, 3vw, 40px)', marginTop: 44, alignItems: 'start' }}>

          {/* detail card */}
          <div className="dl-detail-card" style={{ position: 'sticky', top: 96, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-lg)', padding: 'clamp(24px, 3vw, 36px)', background: 'color-mix(in srgb, var(--color-surface) 28%, transparent)', boxShadow: 'var(--shadow-sm)', animation: `${anim} .6s cubic-bezier(.2,.7,.2,1) both` }}>
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--color-accent-600), var(--color-accent-300) 60%, transparent)' }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 14 }}>
              {active.num} · {active.title}
              <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--color-accent-300), transparent)' }} />
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(27px, 2.6vw, 34px)', lineHeight: 1.1, margin: '0 0 16px' }}>{active.headline}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.75, margin: '0 0 26px', color: 'color-mix(in srgb, var(--color-text) 82%, transparent)' }}>{active.body}</p>

            <span style={{ display: 'block', fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginBottom: 10 }}>What we handle</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0 26px', borderTop: '1px solid var(--color-divider)', marginBottom: 30 }}>
              {active.options.map((o) => {
                const on = o.key === sub.key
                return (
                  <button key={o.key} type="button" className="dl-opt" onClick={() => setSubKey(o.key)}
                    style={{ font: 'inherit', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 0, borderBottom: '1px solid var(--color-divider)', padding: '13px 0', display: 'flex', alignItems: 'center', gap: 12, color: on ? 'var(--color-accent-700)' : 'var(--color-text)', transition: 'color .3s ease, padding-left .3s ease' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px solid var(--color-accent)', background: on ? 'var(--color-accent)' : 'transparent', boxShadow: on ? '0 0 0 4px color-mix(in srgb, var(--color-accent) 18%, transparent)' : 'none', flex: 'none', transition: 'background .3s ease, box-shadow .3s ease' }} />
                    <span style={{ fontSize: 14.5 }}>{o.label}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: 4, padding: '22px 24px', border: '1px solid var(--color-accent-300)', borderRadius: 'var(--radius-md)', background: 'linear-gradient(160deg, color-mix(in srgb, var(--color-accent-100) 78%, transparent), transparent 78%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Icon size={16} width={2} style={{ color: 'var(--color-accent-700)' }} paths={['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 9H8', 'M16 13H8', 'M16 17H8']} />
                <span style={{ fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent-800)' }}>Required documents · {sub.label}</span>
              </div>
              <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'grid', gap: 9, fontSize: 14.5, lineHeight: 1.5, color: 'var(--color-accent-900)' }}>
                {docs.map((d) => <li key={d.key}>{d.label}</li>)}
              </ol>
              <p style={{ margin: '16px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'color-mix(in srgb, var(--color-accent-900) 75%, transparent)' }}>{active.note}</p>
            </div>
          </div>

          {/* request form */}
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--color-accent-300)', borderRadius: 'var(--radius-lg)', padding: 'clamp(24px, 3vw, 36px)', background: 'color-mix(in srgb, var(--color-accent-100) 32%, transparent)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--color-accent-600), var(--color-accent-300), var(--color-accent-600))', backgroundSize: '200% 100%', animation: 'dlShimmer 8s linear infinite' }} />
            <div style={{ paddingBottom: 4, borderBottom: '1px solid var(--color-divider)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 14 }}>
                Start your request<span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--color-accent-300), transparent)' }} />
              </span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(27px, 2.6vw, 34px)', lineHeight: 1.1, margin: '0 0 16px' }}>{active.formTitle}</h3>
            </div>

            {!sent && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14 }}>
                  {[
                    ['name', 'Full name', 'text', 'As on passport', true],
                    ['nationality', 'Nationality', 'text', 'e.g. Filipino', false],
                    ['phone', 'Phone / WhatsApp', 'tel', '+971 5x xxx xxxx', true],
                    ['email', 'Email', 'email', 'you@example.com', false],
                  ].map(([name, label, type, placeholder, required]) => (
                    <div className="field" key={name}>
                      <label htmlFor={`f-${name}`}>{label}</label>
                      <input id={`f-${name}`} className="input dl-input-hover" type={type} name={name} value={form[name]} onChange={onField} placeholder={placeholder} required={required} style={{ transition: 'border-color .3s ease, background .3s ease' }} />
                    </div>
                  ))}
                </div>
                <div className="field">
                  <label htmlFor="f-sub">{active.optionLabel}</label>
                  <select id="f-sub" className="input" value={sub.key} onChange={(e) => setSubKey(e.target.value)} style={{ appearance: 'auto' }}>
                    {active.options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="f-message">{active.messageLabel}</label>
                  <textarea id="f-message" className="input" name="message" value={form.message} onChange={onField} placeholder={active.messagePlaceholder} style={{ minHeight: 78 }} />
                </div>

                <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 18, animation: `${anim} .6s cubic-bezier(.2,.7,.2,1) both` }}>
                  <span style={{ display: 'block', fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginBottom: 12 }}>Upload documents · {docs.length} required</span>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {docs.map((d) => (
                      <div className="field" key={d.key} style={{ borderLeft: `2px solid ${d.mark}`, paddingLeft: 12, transition: 'border-color .35s ease' }}>
                        <label htmlFor={`doc-${d.key}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <span>{d.label}</span>
                          <span style={{ color: 'var(--color-accent-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45%' }}>{d.status}</span>
                        </label>
                        <input id={`doc-${d.key}`} className="input" type="file" accept=".pdf,.jpg,.jpeg,.png" data-doc={d.key} onChange={onFile} style={{ padding: '5px 8px', fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }} />
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.5, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>PDF, JPG or PNG · up to 10 MB each. Missing something? Send what you have — we'll guide you on the rest.</p>
                </div>

                <div className="dl-form-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                  <button type="submit" className="btn dl-btn-gold-soft" style={{ minHeight: 44, paddingInline: 24, fontSize: 15, color: '#171614', background: 'linear-gradient(100deg, var(--color-accent-400), var(--color-accent-200) 45%, var(--color-accent-500))', border: '1px solid var(--color-accent)', transition: 'transform .3s ease, box-shadow .3s ease, filter .3s ease' }}>Submit request</button>
                  <a className="btn btn-ghost" href={waHref} target="_blank" rel="noopener" style={{ minHeight: 44, fontSize: 15 }}>Send on WhatsApp instead</a>
                </div>
              </>
            )}

            {sent && (
              <div style={{ padding: '28px 0 12px', animation: 'dlRise .6s cubic-bezier(.2,.7,.2,1) both' }}>
                <Icon size={42} width={1.5} style={{ color: 'var(--color-accent)', marginBottom: 16 }} paths={['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'm9 12 2 2 4-4']} />
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 27, margin: '0 0 10px' }}>Request received, {form.name}.</h4>
                <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 22px', color: 'color-mix(in srgb, var(--color-text) 80%, transparent)' }}>Our team will review your {active.title} request and reach you on {form.phone} within one working day. For anything urgent, WhatsApp us directly.</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a className="btn btn-primary" href={waHref} target="_blank" rel="noopener">Open WhatsApp</a>
                  <button type="button" className="btn btn-secondary" onClick={reset}>New request</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ── why ─────────────────────────────────────────────────────────── */}
      <section id="why" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px, 6vw, 88px) clamp(20px, 5vw, 72px)', borderTop: '1px solid var(--color-divider)', scrollMarginTop: 84 }}>
        <div data-reveal>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: 16 }}>
            Why Dragon Link<span style={{ width: 54, height: 1, background: 'linear-gradient(90deg, var(--color-accent), transparent)' }} />
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(31px, 3.6vw, 46px)', lineHeight: 1.08, margin: '0 0 34px', maxWidth: '26ch' }}>
            One desk for the whole move — <span style={{ background: 'linear-gradient(100deg, var(--color-accent-600), var(--color-accent-300) 35%, var(--color-accent) 65%, var(--color-accent-600))', backgroundSize: '220% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'dlShimmer 8s linear infinite' }}>arrival to paperwork.</span>
          </h2>
        </div>

        <div className="dl-why-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)', gap: '34px clamp(32px, 5vw, 72px)', alignItems: 'start' }}>
          <div data-reveal style={{ position: 'relative' }}>
            <figure className="plate" style={{ margin: 0, width: '100%', aspectRatio: '4 / 5', boxShadow: 'var(--shadow-md)', animation: 'dlDrift 10s ease-in-out infinite' }}>
              <Photo src={DEIRA_PHOTO} alt="Deira creek, Al Rigga" placeholder="Deira creek · Al Rigga · the team" />
            </figure>
            <div className="dl-why-badge" style={{ position: 'absolute', right: -14, bottom: -20, width: 'min(78%, 260px)', padding: '18px 20px', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', boxShadow: 'var(--shadow-md)' }}>
              <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-heading)', fontSize: 30, lineHeight: 1, fontFeatureSettings: "'tnum' 1", color: 'var(--color-accent-700)' }}>4 in 1</p>
              <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 65%, transparent)' }}>Travel · Visas · Setup · PRO</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 0, borderTop: '1px solid var(--color-divider)' }}>
            {[
              ['01', ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', 'm9 12 2 2 4-4'], 'Trusted partners', 'Flights, hotels and tours are booked through established tourism partners, so your holiday is priced fairly and backed by people we know.', 0],
              ['02', ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'm9 15 2 2 4-4'], 'Paperwork, done properly', 'Visas, Emirates ID, medicals, trade licences — we tell you exactly which documents are needed up front, then handle the offices for you.', 120],
              ['03', ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'], 'In the heart of Deira', 'Our office in Al Rigga is a short walk from the metro. Drop in, or simply message us on WhatsApp — most requests start with a photo of a passport.', 240],
            ].map(([num, paths, title, body, delay]) => (
              <div key={num} className="dl-why-row" data-reveal data-delay={delay} style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: '8px 22px', alignItems: 'start', padding: '26px 0', borderBottom: '1px solid var(--color-divider)', transition: 'padding-left .4s cubic-bezier(.2,.7,.2,1), background .4s ease' }}>
                <span className="dl-why-num" style={{ gridRow: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 34, lineHeight: 1, fontFeatureSettings: "'tnum' 1", color: 'var(--color-accent)' }}>{num}</span>
                  <span style={{ color: 'var(--color-accent-700)' }}><Icon paths={paths} size={22} width={1.6} /></span>
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 28, lineHeight: 1.15, margin: 0 }}>{title}</h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, maxWidth: '52ch', color: 'color-mix(in srgb, var(--color-text) 78%, transparent)' }}>{body}</p>
              </div>
            ))}
            <a className="dl-cta-link" href="#services" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 26, justifySelf: 'start', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)', paddingBottom: 4, borderBottom: '1px solid var(--color-accent-300)', transition: 'gap .3s ease, border-color .3s ease, color .3s ease' }}>
              Start your request
              <Icon paths={ARROW_PATH} size={15} width={2} />
            </a>
          </div>
        </div>
      </section>

      {/* ── contact ─────────────────────────────────────────────────────── */}
      <section id="contact" style={{ position: 'relative', overflow: 'hidden', background: '#171614', color: '#f6f3ee', scrollMarginTop: 84 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(55% 65% at 12% 20%, rgba(182,130,53,.26), transparent 70%), radial-gradient(45% 55% at 92% 90%, rgba(182,130,53,.18), transparent 72%)', animation: 'dlGlow 13s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: 'clamp(52px, 6vw, 96px) clamp(20px, 5vw, 72px) clamp(48px, 5vw, 84px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '48px clamp(40px, 6vw, 96px)', alignItems: 'start' }}>
          <div data-reveal>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e1ad66', marginBottom: 18 }}>
              Contact<span style={{ width: 54, height: 1, background: 'linear-gradient(90deg, #e1ad66, transparent)' }} />
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(36px, 4.4vw, 58px)', lineHeight: 1.04, margin: '0 0 20px' }}>
              Get in <span style={{ background: 'linear-gradient(100deg, #b68235, #ffe3bf 30%, #e1ad66 60%, #b68235)', backgroundSize: '220% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'dlShimmer 7s linear infinite' }}>touch</span>
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: 16.5, lineHeight: 1.8, maxWidth: '42ch', color: 'rgba(246,243,238,.78)' }}>Send us a message on WhatsApp, email the documents you already have, or walk into the office in Al Rigga — whichever is easiest for you.</p>
            <div className="dl-contact-cta" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a className="btn dl-btn-gold" href={waHref} target="_blank" rel="noopener" style={{ minHeight: 46, paddingInline: 24, fontSize: 15, color: '#171614', background: 'linear-gradient(100deg, #e1ad66, #ffe3bf 45%, #c28d41)', border: '1px solid #e1ad66', transition: 'transform .3s ease, box-shadow .3s ease, filter .3s ease' }}>
                <Icon paths={WA_PATH} size={16} width={1.9} />
                Message on WhatsApp
              </a>
              <a className="btn dl-btn-outline-light" href="#services" style={{ minHeight: 46, paddingInline: 22, fontSize: 15, color: '#f6f3ee', border: '1px solid rgba(246,243,238,.3)', transition: 'border-color .3s ease, background .3s ease, transform .3s ease' }}>Start a request</a>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 34, paddingTop: 26, borderTop: '1px solid rgba(246,243,238,.14)' }}>
              <a className="dl-social-dark" href="https://www.instagram.com/dragonlinkconsultravel2026" target="_blank" rel="noopener" aria-label="Instagram" style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: '50%', border: '1px solid rgba(246,243,238,.28)', color: '#f6f3ee', transition: 'border-color .3s ease, color .3s ease, transform .3s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              </a>
              <a className="dl-social-dark" href="https://www.facebook.com/p/Dragon-Link-Consultancy-LLC-Travel-and-Tours-61592467724898/" target="_blank" rel="noopener" aria-label="Facebook" style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: '50%', border: '1px solid rgba(246,243,238,.28)', color: '#f6f3ee', transition: 'border-color .3s ease, color .3s ease, transform .3s ease' }}>
                <Icon paths={['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z']} size={18} width={1.9} />
              </a>
            </div>
          </div>

          <div data-reveal data-delay="120" style={{ display: 'grid', gap: 0 }}>
            {[
              { href: waHref, external: true, paths: WA_PATH, kicker: 'Phone & WhatsApp', value: '+971 50 430 8516 · +971 54 385 6161' },
              { href: 'mailto:inquiry@dragonlinkconsultancy.com', paths: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'], kicker: 'Email', value: 'inquiry@dragonlinkconsultancy.com', wrap: true },
              { href: 'https://maps.google.com/?q=Al+Rigga+Deira+Dubai', external: true, paths: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'], kicker: 'Office', value: 'Al Rigga, Deira — Dubai, UAE' },
            ].map((row) => (
              <a key={row.kicker} className="dl-contact-row" href={row.href} {...(row.external ? { target: '_blank', rel: 'noopener' } : {})}
                style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: '6px 20px', alignItems: 'start', padding: '22px 0', textDecoration: 'none', color: '#f6f3ee', borderBottom: '1px solid rgba(246,243,238,.14)', transition: 'padding-left .35s ease, color .35s ease' }}>
                <span style={{ gridRow: 'span 2', color: '#e1ad66', paddingTop: 4 }}><Icon paths={row.paths} size={22} width={1.6} /></span>
                <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(246,243,238,.55)' }}>{row.kicker}</span>
                <span className="dl-contact-val" style={{ fontFamily: 'var(--font-heading)', fontSize: 23, lineHeight: 1.4, fontFeatureSettings: "'tnum' 1", ...(row.wrap ? { overflowWrap: 'anywhere' } : {}) }}>{row.value}</span>
              </a>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: '6px 20px', alignItems: 'start', padding: '22px 0' }}>
              <span style={{ gridRow: 'span 2', color: '#e1ad66', paddingTop: 4 }}><Icon paths={['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2']} size={22} width={1.6} /></span>
              <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(246,243,238,.55)' }}>Hours</span>
              <span className="dl-contact-val" style={{ fontFamily: 'var(--font-heading)', fontSize: 23, lineHeight: 1.4 }}>
                Sat – Thu, 9:00 – 19:00 <span style={{ color: 'rgba(246,243,238,.6)', fontSize: 18 }}>· WhatsApp every day</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── footer ──────────────────────────────────────────────────────── */}
      <footer style={{ position: 'relative', overflow: 'hidden', background: 'color-mix(in srgb, var(--color-accent-100) 40%, var(--color-bg))', borderTop: '2px solid var(--color-accent)' }}>
        <div className="dl-footer-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px, 5vw, 68px) clamp(20px, 5vw, 72px) 0', display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '34px clamp(28px, 4vw, 64px)' }}>
          <div className="dl-footer-brand" style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <img src={LOGO} alt="Dragon Link" width="58" height="58" style={{ width: 58, height: 58, mixBlendMode: 'multiply', objectFit: 'cover' }} />
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span className="dl-footer-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(30px, 3.4vw, 42px)', letterSpacing: '0.01em' }}>Dragon Link</span>
                <span style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>Stronger Together</span>
              </span>
            </div>
            <p style={{ margin: 0, maxWidth: '42ch', fontSize: 14.5, lineHeight: 1.75, color: 'color-mix(in srgb, var(--color-text) 76%, transparent)' }}>Consultancy &amp; Travel Tours L.L.C. — visas, business setup, PRO services and holidays, coordinated from one desk so you deal with one team from start to finish.</p>
            <div className="dl-footer-social" style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              {[
                ['https://www.instagram.com/dragonlinkconsultravel2026', 'Instagram', null],
                ['https://www.facebook.com/p/Dragon-Link-Consultancy-LLC-Travel-and-Tours-61592467724898/', 'Facebook', ['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z']],
                [waHref, 'WhatsApp', WA_PATH],
              ].map(([href, label, paths]) => (
                <a key={label} className="dl-social-light" href={href} target="_blank" rel="noopener" aria-label={label} style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: '50%', border: '1px solid var(--color-accent-300)', color: 'var(--color-accent-700)', transition: 'transform .3s ease, background .3s ease, border-color .3s ease' }}>
                  {paths
                    ? <Icon paths={paths} size={17} width={2} />
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>}
                </a>
              ))}
            </div>
          </div>
          {[
            ['Services', [['#services', 'Travel & Tours'], ['#services', 'Visa Assistance'], ['#services', 'Business Setup'], ['#services', 'Government & PRO']]],
            ['Quick links', [['#top', 'Home'], ['#services', 'Start a request'], ['#why', 'Why Dragon Link'], ['#contact', 'Contact']]],
          ].map(([heading, links]) => (
            <div key={heading} style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-accent-700)', paddingBottom: 12, borderBottom: '1px solid var(--color-divider)', marginBottom: 12 }}>{heading}</span>
              <div className="dl-footer-links" style={{ display: 'grid', gap: 9, fontSize: 14 }}>
                {links.map(([href, label]) => (
                  <a key={label} className="dl-flink" href={href} style={{ textDecoration: 'none', color: 'color-mix(in srgb, var(--color-text) 80%, transparent)', transition: 'color .3s ease, padding-left .3s ease' }}>{label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px clamp(20px, 5vw, 72px) 30px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--color-accent-300), transparent)', marginBottom: 18 }} />
          <div className="dl-footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}>
            <span>© 2026 Dragon Link Consultancy &amp; Travel Tours L.L.C.</span>
            <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>Licensed in Dubai, UAE</span>
          </div>
        </div>
      </footer>

      {floatingWhatsApp && (
        <a className="dl-float" href={waHref} target="_blank" rel="noopener" aria-label="Chat on WhatsApp"
          style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 40, width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(140deg, var(--color-accent-400), var(--color-accent-600))', color: '#171614', border: '1px solid var(--color-accent-600)', animation: 'dlPulse 3s ease-out infinite', transition: 'transform .3s ease, filter .3s ease' }}>
          <Icon size={25} width={1.8} paths={['M7.9 20A9 9 0 1 0 4 16.1L2 22Z', 'M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1']} />
        </a>
      )}
    </>
  )
}
