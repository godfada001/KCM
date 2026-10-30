import { useCallback, useEffect, useMemo, useState } from 'react'
import BlurText from './component/BlurText.jsx'
import CardNav from './component/CardNav.jsx'
import MagnetLines from './component/MagnetLines.jsx'
import GlassIcons from './component/GlassIcons.jsx'
import './App.css'
import './Redesign.css'

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const savedToken = () => sessionStorage.getItem('church-access-token')

async function request(path, { token = savedToken(), retry = true, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (response.status === 401 && retry && token && !['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout'].includes(path)) {
    try {
      const refreshed = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' })
      const session = await refreshed.json()
      if (refreshed.ok && session.data?.accessToken) {
        sessionStorage.setItem('church-access-token', session.data.accessToken)
        return request(path, { ...options, token: session.data.accessToken, retry: false })
      }
    } catch { /* report the original endpoint error below */ }
  }
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`)
  return payload
}

const dateLabel = (date) => date ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(date)) : 'Recently'
const initials = (user) => `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
const pageFromHash = () => window.location.hash.replace(/^#\/?/, '').split('/')[0] || 'home'

function App() {
  const [sermons, setSermons] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [feedState, setFeedState] = useState('loading')
  const [feedError, setFeedError] = useState('')
  const [query, setQuery] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(pageFromHash)

  const loadFeed = useCallback(async (search = '') => {
    setFeedState('loading'); setFeedError('')
    try {
      const suffix = search ? `?search=${encodeURIComponent(search)}&limit=12` : '?limit=12'
      const [sermonPayload, announcementPayload] = await Promise.all([
        request(`/content/sermons${suffix}`), request(`/content/announcements${suffix}`),
      ])
      setSermons(sermonPayload.items || sermonPayload.data || [])
      setAnnouncements(announcementPayload.items || announcementPayload.data || [])
      setFeedState('ready')
    } catch (error) { setFeedError(error.message); setFeedState('error') }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadFeed(), 0)
    return () => window.clearTimeout(timer)
  }, [loadFeed])
  useEffect(() => {
    const token = savedToken()
    const currentUser = token ? request('/auth/me', { token }) : request('/auth/refresh', { method: 'POST' })
    currentUser.then((payload) => {
      if (payload.data?.accessToken) sessionStorage.setItem('church-access-token', payload.data.accessToken)
      setUser(payload.data?.user || null)
    }).catch(() => {
      sessionStorage.removeItem('church-access-token')
    })
  }, [])
  useEffect(() => {
    const syncPage = () => { setPage(pageFromHash()); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    window.addEventListener('hashchange', syncPage)
    return () => window.removeEventListener('hashchange', syncPage)
  }, [])
  useEffect(() => {
    if (!notice || authOpen) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3000)
    return () => window.clearTimeout(timer)
  }, [notice, authOpen])

  async function handleAuth(event) {
    event.preventDefault(); setBusy(true); setNotice('')
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(form.entries())
    try {
      if (authMode === 'register') {
        await request('/auth/register', { method: 'POST', body: JSON.stringify(body) })
        setAuthMode('login'); setNotice('Your account is ready. Sign in to continue.')
      } else {
        const payload = await request('/auth/login', { method: 'POST', body: JSON.stringify(body) })
        sessionStorage.setItem('church-access-token', payload.data.accessToken)
        setUser(payload.data.user); setAuthOpen(false); setNotice('Welcome back.')
        window.location.hash = '#/home'
        setPage('home')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) { setNotice(error.message) } finally { setBusy(false) }
  }

  async function logout() {
    try { await request('/auth/logout', { method: 'POST' }) } catch { /* local session still ends */ }
    sessionStorage.removeItem('church-access-token'); setUser(null); setNotice('You have been signed out.')
  }

  const isManager = ['admin', 'pastor'].includes(user?.role)
  const filteredSermons = useMemo(() => sermons, [sermons])

  return <div className="site-shell">
    <header className="topbar cardnav-header"><CardNav
      logo={<span className="cardnav-brand"><span className="brand-name">Kingdom Citizens Ministries Int'l<small>WHERE NO MAN IS A LIABILITY</small></span></span>}
      logoAlt="Kingdom Citizens Ministries Int'l home"
      logoHref="#/home"
      ariaLabel="Main navigation"
      theme="light"
      surface="solid"
      cardEffect="rise"
      maxWidth={1320}
      cardHeight={174}
      accentColor="#2867ad"
      items={[
        { label: 'Discover', description: 'Get to know our church and what we believe.', bgColor: '#edf5fd', textColor: '#183453', links: [{ label: 'Home', href: '#/home' }, { label: 'Our story', href: '#/about' }] },
        { label: 'Watch & connect', description: 'Find a message, gathering, or community update.', bgColor: '#e3effb', textColor: '#183453', links: [{ label: 'Live stream', href: '#/live' }, { label: 'Messages', href: '#/messages' }, { label: 'Events', href: '#/events' }] },
        { label: 'Stories of faith', description: 'Read how faith is making a difference in our community.', bgColor: '#edf5fd', textColor: '#183453', links: [{ label: 'Testimonies', href: '#/testimonies' }] },
        { label: 'Get in touch', description: 'Plan a visit or reach our ministry team.', bgColor: '#d8e9f8', textColor: '#183453', links: [{ label: 'Contact us', href: '#/contact' }, { label: 'Email the church', href: 'mailto:kingdomcitizensministries46@gmail.com' }] },
        ...(user ? [{ label: 'My account', description: 'Your personal space for messages, reflection, and giving.', bgColor: '#edf5fd', textColor: '#183453', links: [{ label: 'Member home', href: '#/home' }, { label: 'Recent messages', href: '#/member-messages' }, { label: 'Share a testimony', href: '#/member-testimony' }, { label: 'My notepad', href: '#/member-notes' }, { label: 'Give or donate', href: '#/member-giving' }, { label: 'Update my profile', href: '#/profile' }] }] : []),
        ...(isManager ? [{ label: 'Staff area', description: 'Manage ministry content and church records.', bgColor: '#c8def2', textColor: '#183453', links: [{ label: 'Admin dashboard', href: '#/dashboard' }] }] : [])
      ]}
      cta={user ? { label: 'Log out', onClick: logout } : { label: 'Sign in', onClick: () => { setAuthMode('login'); setAuthOpen(true) } }}
    /></header>

    <main>{page !== 'home' && !page.startsWith('member-') ? <SitePage page={page} user={user} setUser={setUser} sermons={sermons} announcements={announcements} feedState={feedState} feedError={feedError} loadFeed={loadFeed} openLogin={() => { setAuthMode('login'); setAuthOpen(true) }} notify={setNotice}/> : user ? <MemberHome view={page} user={user} sermons={sermons} feedState={feedState} feedError={feedError} loadFeed={loadFeed} notify={setNotice}/> : page.startsWith('member-') ? <MemberSignIn openLogin={() => { setAuthMode('login'); setAuthOpen(true) }}/> : <>
      <section id="home" className="hero-section">
        <div className="hero-copy"><BlurText text="Welcome to Kingdom Citizens Ministries Int'l" effect="blur" animateBy="words" direction="top" staggerFrom="start" trigger="view" delay={85} stepDuration={0.38} blur={8} distance={24} className="welcome-blur"/><div className="eyebrow"><span className="eyebrow-line"/> A PLACE TO BELONG</div><h1>Where no one<br/><em>is a liability.</em></h1><p className="hero-lede">Kingdom Citizens Ministries Int'l is a community of faith where every person is valued, equipped, and welcomed to grow in purpose.</p><div className="hero-buttons"><a className="button" href="#/contact">Join us this Sunday </a><a className="text-link" href="#/messages"><span className="play-icon">▶</span> Watch a message</a></div><div className="service-note"><span className="pulse"/> SUNDAYS 7:00 AM–11:30 AM <span className="note-divider">·</span> Aba, Nigeria</div></div>
        <img className="hero-art hero-logo" src="/kcm-logo.jpeg" alt="Kingdom Citizens Ministries International logo"/>
        <div className="hero-bottom"><span>ROOTED IN LOVE. GROWING TOGETHER.</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section id="about" className="welcome-section section-pad"><MagnetLines className="welcome-magnet-background" lineColor="#2867ad" accentColor="#2867ad" spacing={42} lineWidth={1.5} lineHeight={10} mode="orbit" shape="line" radius={230} fade={0.82} edgeFade={0.72} stretch={0.24} inertia={0.4} bounce={0.22} ripple={0.34}/><div className="section-kicker">OUR MOTTO · WHERE NO MAN IS A LIABILITY</div><div className="welcome-grid"><h2>Every life has worth.<br/><em>Everyone has a place.</em></h2><div><p>At Kingdom Citizens Ministries Int'l, every person is valued and has a meaningful place in the life of the church.</p><a href="#/about" className="arrow-link">Get to know us </a></div></div><div className="values-row"><article><span className="value-number">01</span><span className="value-icon">✳</span><h3>Faith that feels real</h3><p>Honest questions and a hope that holds up in everyday life.</p></article><article><span className="value-number">02</span><span className="value-icon">♡</span><h3>People who show up</h3><p>Small groups, open tables, and friends who become family.</p></article><article><span className="value-number">03</span><span className="value-icon">✦</span><h3>Purpose in community</h3><p>Every person is seen, equipped, and able to contribute.</p></article></div></section>

      <section id="messages" className="messages-section section-pad"><div className="section-heading"><div><div className="section-kicker">WORDS FOR THE WAY</div><h2>Take a little <em>hope with you.</em></h2></div><a href="#/messages" className="arrow-link">Explore all messages </a></div><form className="search-bar" onSubmit={(e) => { e.preventDefault(); loadFeed(query) }}><span>⌕</span><input id="message-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages and updates"/><button aria-label="Search">Search</button></form>
        {feedState === 'loading' && <div className="feed-message">Gathering the latest from Kingdom Citizens Ministries…</div>}{feedState === 'error' && <div className="feed-message error-message">{feedError}<button onClick={() => loadFeed(query)}>Try again</button></div>}
        {feedState === 'ready' && <><div className="content-grid">{filteredSermons.slice(0, 3).map((sermon, index) => <article className={`sermon-card sermon-${index + 1}`} key={sermon._id || sermon.slug}><a className="sermon-image" href={sermon.videoUrl || sermon.audioUrl || '#messages'} target={sermon.videoUrl || sermon.audioUrl ? '_blank' : undefined} rel="noreferrer" style={sermon.thumbnailUrl ? { backgroundImage: `linear-gradient(0deg, rgba(17,28,24,.65), transparent 75%), url("${sermon.thumbnailUrl}")` } : undefined}><span className="sermon-play">▶</span><span className="image-tag">{sermon.scriptureReference || 'SUNDAY MESSAGE'}</span></a><div className="sermon-meta">{dateLabel(sermon.preachedAt)} <span>·</span> {sermon.speaker}</div><h3>{sermon.title}</h3><p>{sermon.description || 'A message to encourage you in your walk of faith.'}</p><a className="card-link" href={sermon.videoUrl || sermon.audioUrl || '#messages'} target={sermon.videoUrl || sermon.audioUrl ? '_blank' : undefined} rel="noreferrer">Watch message </a></article>)}</div>{!sermons.length && <div className="feed-message">New messages are on the way. Join us this Sunday.</div>}
          <div className="updates-row" id="community"><div><div className="section-kicker">LIFE IN COMMUNITY</div><h2>What’s happening <em>this week.</em></h2><p>There’s always a next step, a new friend, or a way to lend a hand.</p><a href="#/events" className="arrow-link">Browse the calendar </a></div><div className="announcement-list">{announcements.slice(0, 3).map((item) => <article className="announcement" key={item._id || item.slug}><span className="announcement-date">{dateLabel(item.publishAt || item.publishedAt)}</span><div><span className="category-tag">{item.category || 'GENERAL'}</span><h3>{item.title}</h3><p>{item.body}</p></div></article>)}{!announcements.length && <div className="feed-message">No new announcements right now. Check back soon.</div>}</div></div>
        </>}
      </section>

      <HomeTestimonies/>

      <section id="visit" className="visit-section"><div className="visit-left"><div className="section-kicker">YOUR FIRST SUNDAY</div><h2>Come find out<br/>for <em>yourself.</em></h2><p>Come as you are. We’ll save you a seat, help you find the coffee, and make sure you know where to go.</p><a className="button button-light" href="mailto:kingdomcitizensministries46@gmail.com?subject=Planning%20a%20visit">Let us know you’re coming </a></div><div className="visit-details"><div><span className="detail-icon">◷</span><span className="detail-label">SUNDAY GATHERING</span><b>7:00 AM–11:30 AM every Sunday</b><small>Come a little early for coffee</small></div><div><span className="detail-icon">⌖</span><span className="detail-label">FIND US</span><b>286 Clifford Road</b><small>Aba, Nigeria, 450102</small></div><a className="map-link" href="https://maps.google.com/?q=286+Clifford+Road+Aba+Nigeria+450102" target="_blank" rel="noreferrer">Get directions </a></div></section>
    </> }</main>

    <footer className="footer"><div className="footer-main"><div className="footer-brand-column"><a href="#/home" className="brand"><span className="brand-mark">✳</span><span className="brand-name">Kingdom Citizens<br/>Ministries Int'l<small>WHERE NO MAN IS A LIABILITY</small></span></a><p>A community of faith where every person is valued, equipped, and welcomed to grow in purpose.</p></div><div className="footer-column"><b>Service times</b><span>Sunday gathering</span><strong>7:00 AM–11:30 AM · Aba</strong><span>Come a little early for coffee.</span></div><div className="footer-column"><b>Quick links</b><a href="#/about">Our story</a><a href="#/messages">Messages</a><a href="#/events">Events</a><a href="#/testimonies">Testimonies</a></div><div className="footer-column"><b>Visit & contact</b><a href="https://maps.google.com/?q=286+Clifford+Road+Aba+Nigeria+450102" target="_blank" rel="noreferrer">286 Clifford Road<br/>Aba, Nigeria, 450102 </a><a href="mailto:kingdomcitizensministries46@gmail.com">kingdomcitizensministries46@gmail.com</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Kingdom Citizens Ministries Int'l.</span><a href="#/contact">Get in touch </a></div></footer>

    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
    {authOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false) }}><section className="auth-modal"><button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close">×</button><div className="section-kicker">KINGDOM CITIZENS MINISTRIES INT’L</div><h2>{authMode === 'login' ? 'Welcome back.' : 'Find your community.'}</h2><p>{authMode === 'login' ? 'Sign in to your account.' : 'Create an account to join the community.'}</p><form onSubmit={handleAuth} className="auth-form">{authMode === 'register' && <div className="name-fields"><label>First name<input name="firstName" minLength="2" required/></label><label>Last name<input name="lastName" minLength="2" required/></label></div>}<label>Email address<input type="email" name="email" autoComplete="email" required/></label><label>Password<input type="password" name="password" minLength={authMode === 'register' ? 12 : 1} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} required/><small>{authMode === 'register' ? 'Use at least 12 characters.' : ''}</small></label><button className="button" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'} </button></form>{notice && <p className="auth-notice">{notice}</p>}<p className="auth-switch">{authMode === 'login' ? 'New here?' : 'Already have an account?'} <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setNotice('') }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></p></section></div>}
  </div>
}

function MemberHome({ view, user, sermons, feedState, feedError, loadFeed, notify }) {
  const notesKey = `kcmi-member-notes-${user.id || user._id || user.email}`
  const [notes, setNotes] = useState(() => {
    try { return window.localStorage.getItem(notesKey) || '' } catch { return '' }
  })
  const [anonymous, setAnonymous] = useState(true)
  const [sending, setSending] = useState(false)
  const [testimonyMessage, setTestimonyMessage] = useState('')
  const [testimonyError, setTestimonyError] = useState('')

  useEffect(() => {
    try { window.localStorage.setItem(notesKey, notes) } catch { /* Browser storage may be disabled or full. */ }
  }, [notes, notesKey])

  useEffect(() => {
    const sectionId = ({ 'member-messages': 'member-messages', 'member-testimony': 'member-testimony', 'member-notes': 'member-notes', 'member-giving': 'member-giving' })[view]
    if (!sectionId) return
    window.requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [view])

  async function submitTestimony(event) {
    event.preventDefault()
    setSending(true); setTestimonyMessage(''); setTestimonyError('')
    const form = event.currentTarget
    const values = new FormData(form)
    const body = {
      title: values.get('title'),
      testimony: values.get('testimony'),
      isAnonymous: anonymous,
      ...(!anonymous ? { displayName: values.get('displayName') } : {}),
    }
    try {
      await request('/testimonies', { method: 'POST', body: JSON.stringify(body) })
      form.reset()
      setAnonymous(true)
      setTestimonyMessage('Thank you for sharing. Your testimony is with the ministry team for review.')
      notify('Your testimony was submitted for review.')
    } catch (error) { setTestimonyError(error.message) } finally { setSending(false) }
  }

  return <section className="member-home">
    <div className="member-welcome"><div><span className="section-kicker">YOUR MEMBER HOME</span><h1>Welcome, {user.firstName}.</h1><p>Your space to stay encouraged, reflect, and keep connected with the church.</p></div><a className="button" href="#/live">Join the live stream </a></div>
    <div className="member-shortcuts"><a href="#/member-messages">Recent messages </a><a href="#/member-testimony">Share a testimony </a><a href="#/member-notes">My notepad </a><a href="#/member-giving">Give or donate </a></div>

    <section className="member-section" id="member-messages"><div className="member-section-heading"><div><span className="section-kicker">GROW IN THE WORD</span><h2>Recent messages</h2><p>Watch or listen again whenever you need encouragement.</p></div><a className="arrow-link" href="#/messages">All messages </a></div>
      {feedState === 'loading' && <p className="feed-message">Loading recent messages…</p>}
      {feedState === 'error' && <p className="feed-message error-message">{feedError}<button onClick={() => loadFeed()}>Try again</button></p>}
      {feedState === 'ready' && (sermons.length ? <div className="member-message-grid">{sermons.slice(0, 3).map((sermon) => <article className="member-message-card" key={sermon._id || sermon.slug}><a className="sermon-image" href={sermon.videoUrl || sermon.audioUrl || '#/messages'} target={sermon.videoUrl || sermon.audioUrl ? '_blank' : undefined} rel="noreferrer" style={sermon.thumbnailUrl ? { backgroundImage: `linear-gradient(0deg, rgba(17,28,24,.65), transparent 75%), url("${sermon.thumbnailUrl}")` } : undefined}><span className="sermon-play">▶</span><span className="image-tag">{sermon.scriptureReference || 'MESSAGE'}</span></a><span className="sermon-meta">{dateLabel(sermon.preachedAt)} · {sermon.speaker}</span><h3>{sermon.title}</h3><p>{sermon.description || 'A message to encourage you in your walk of faith.'}</p><a className="card-link" href={sermon.videoUrl || sermon.audioUrl || '#/messages'} target={sermon.videoUrl || sermon.audioUrl ? '_blank' : undefined} rel="noreferrer">Watch message </a></article>)}</div> : <div className="member-empty">No messages are posted yet. Please check back soon.</div>)}
    </section>

    <div className="member-tools-grid">
      <section className="member-panel" id="member-testimony"><span className="section-kicker">YOUR STORY MATTERS</span><h2>Share a testimony</h2><p className="member-panel-intro">Tell us how God has been moving in your life. The ministry team reviews stories before they are shared publicly.</p><form className="member-testimony-form" onSubmit={submitTestimony}><label>Story title<input name="title" minLength="3" maxLength="200" required placeholder="A short title for your story"/></label><label>Your testimony<textarea name="testimony" minLength="10" maxLength="10000" rows="5" required placeholder="Write what you would like to share…"/></label>{!anonymous && <label>Name to display<input name="displayName" minLength="1" maxLength="120" required defaultValue={`${user.firstName} ${user.lastName}`.trim()}/></label>}<label className="member-anonymous"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)}/> Share anonymously</label>{testimonyMessage && <p className="member-success" role="status">{testimonyMessage}</p>}{testimonyError && <p className="profile-error" role="alert">{testimonyError}</p>}<button className="button" disabled={sending}>{sending ? 'Submitting…' : 'Send testimony for review'} </button></form></section>

      <section className="member-panel member-notepad" id="member-notes"><span className="section-kicker">PERSONAL REFLECTION</span><h2>My notepad</h2><p className="member-panel-intro">Keep sermon notes, prayer reminders, or thoughts for yourself.</p><label className="sr-only" htmlFor="member-notes-input">Your personal notes</label><textarea id="member-notes-input" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={20000} placeholder="Start writing…"/><div className="member-notepad-footer"><span>Saved automatically on this device</span><span>{notes.length.toLocaleString()} / 20,000</span></div></section>
    </div>

    <section className="member-giving" id="member-giving"><div><span className="section-kicker">GIVE WITH PURPOSE</span><h2>Your generosity makes room for others.</h2><p>Thank you for helping support the ministry and the people we serve.</p></div><div className="member-giving-actions"><a className="button button-light" href="mailto:kingdomcitizensministries46@gmail.com?subject=Giving%20and%20donation%20details">Request giving details </a><span>Or give in person during our Sunday gathering · 7:00 AM–11:30 AM · Aba</span></div></section>
  </section>
}

function MemberSignIn({ openLogin }) {
  return <section className="route-page auth-gate"><div className="section-kicker">MEMBER HOME</div><h1>Your church life,<br/><em>all in one place.</em></h1><p>Sign in to see recent messages, share a testimony, keep personal notes, and find giving information.</p><button className="button" onClick={openLogin}>Sign in to continue </button></section>
}

function SitePage({ page, user, setUser, sermons, announcements, feedState, feedError, loadFeed, openLogin, notify }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedValue, setSelectedValue] = useState('belong')
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [section, setSection] = useState('overview')
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const isManager = ['admin', 'pastor'].includes(user?.role)

  useEffect(() => {
    if (page !== 'dashboard' || !isManager) return undefined
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setStatsError('')
      const endpoints = ['/content/sermons/manage/all?limit=100', '/content/announcements/manage/all?limit=100', '/ministries?limit=100', '/members?limit=100']
      const results = await Promise.allSettled(endpoints.map((path) => request(path)))
      if (cancelled) return
      const parsed = results.map((result) => result.status === 'fulfilled' ? (result.value.items || result.value.data || []) : null)
      setStats({ sermons: parsed[0]?.length ?? 0, announcements: parsed[1]?.length ?? 0, ministries: parsed[2]?.length ?? 0, members: parsed[3]?.length ?? 0 })
      const failed = results.find((result) => result.status === 'rejected')
      if (failed) setStatsError(failed.reason.message)
    }, 0)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [page, isManager])

  if (page === 'profile') return user
    ? <ProfilePage user={user} onUpdated={setUser} notify={notify}/>
    : <section className="route-page profile-page"><PageTitle kicker="YOUR ACCOUNT" title={<>Your details,<br/><em>all in one place.</em></>} description="Sign in to view and update your contact information."/><button className="button" onClick={openLogin}>Sign in to continue </button></section>

  if (page === 'dashboard') {
    if (!user) return <section className="route-page auth-gate"><div className="section-kicker">STAFF ACCESS</div><h1>Sign in to your<br/><em>dashboard.</em></h1><p>The admin dashboard is reserved for church staff.</p><button className="button" onClick={openLogin}>Sign in to continue </button></section>
    if (!isManager) return <section className="route-page auth-gate"><div className="section-kicker">STAFF ACCESS</div><h1>Admin access<br/><em>required.</em></h1><p>Your account does not have permission to access church management tools.</p></section>
    const tabs = [{ id: 'overview', label: 'Overview', icon: '◫' }, { id: 'sermons', label: 'Sermons', icon: '▷' }, { id: 'announcements', label: 'Announcements', icon: '◉' }, { id: 'ministries', label: 'Ministries', icon: '✳' }, { id: 'members', label: 'Members', icon: '♧' }, { id: 'testimonies', label: 'Testimonies', icon: '♡' }, { id: 'live', label: 'Live stream', icon: '●' }, ...(user.role === 'admin' ? [{ id: 'users', label: 'Users', icon: '♙' }] : [])]
    return <section className="admin-dashboard"><aside className={`admin-sidebar ${mobileSidebar ? 'sidebar-open' : ''}`}><div className="admin-sidebar-title"><span className="sidebar-logo">✳</span><span>Kingdom Citizens<small>MINISTRY ADMIN</small></span></div><div className="sidebar-label">WORKSPACE</div>{tabs.map((tab) => <button className={section === tab.id ? 'sidebar-active' : ''} key={tab.id} onClick={() => { setSection(tab.id); setMobileSidebar(false) }}><span>{tab.icon}</span>{tab.label}</button>)}<a className="sidebar-back" href="#/home">← Back to website</a><div className="sidebar-user"><span className="avatar">{initials(user)}</span><span>{user.firstName} {user.lastName}<small>{user.role?.replace('_', ' ')}</small></span></div></aside><div className="admin-main"><div className="admin-toolbar"><button className="sidebar-toggle" onClick={() => setMobileSidebar(!mobileSidebar)}>☰</button><div><span className="admin-crumb">Workspace / </span>{tabs.find((tab) => tab.id === section)?.label}</div><span className="admin-online"><i/> Live workspace</span></div>
      {section === 'overview' ? <div className="dashboard-content"><div className="dashboard-welcome"><div><span className="section-kicker">MINISTRY OVERVIEW</span><h1>Welcome back, {user.firstName}.</h1><p>Here’s what’s happening across your church this week.</p></div><span className="welcome-spark">✳</span></div>{statsError && <div className="workspace-error">Some totals could not be loaded: {statsError}</div>}<div className="stat-grid">{[['Published sermons', stats?.sermons, '▷'], ['Announcements', stats?.announcements, '◉'], ['Ministries', stats?.ministries, '✳'], ['Church members', stats?.members, '♧']].map(([label, value, icon]) => <article className="stat-card" key={label}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value ?? '—'}</strong><small>Current records</small></article>)}</div><div className="dashboard-lower"><section className="dashboard-panel"><div className="panel-heading"><div><span className="section-kicker">QUICK ACCESS</span><h2>Manage your ministry</h2></div></div><div className="quick-links">{tabs.filter((tab) => tab.id !== 'overview').map((tab) => <button key={tab.id} onClick={() => setSection(tab.id)}><span>{tab.icon}</span><b>{tab.label}</b><small>View and manage {tab.label.toLowerCase()}</small><i></i></button>)}</div></section><section className="dashboard-panel motto-panel"><span className="section-kicker">OUR MOTTO</span><blockquote>“Where no man<br/>is a liability.”</blockquote><p>Every person matters. Every gift has a place.</p><a href="#/about">Read our story </a></section></div></div> : <div className="dashboard-content"><div className="dashboard-welcome compact"><div><span className="section-kicker">MANAGEMENT</span><h1>{tabs.find((tab) => tab.id === section)?.label}</h1><p>Manage records and keep your church community up to date.</p></div></div>{section === 'live' ? <LiveStreamAdmin notify={notify}/> : <Management activeTab={section} setActiveTab={setSection} notify={notify} isAdmin={user.role === 'admin'} canReviewTestimonies currentUserId={user.id}/>}</div>}</div></section>
  }

  if (page === 'about') return <section className="route-page about-page"><div className="route-hero"><div className="section-kicker">WHO WE ARE</div><h1>A place where<br/><em>everyone belongs.</em></h1><p>Kingdom Citizens Ministries Int'l exists to help people discover their value, grow in faith, and live with purpose.</p><a className="button" href="#/contact">Come meet us </a><div className="route-hero-art"><span>KC</span><b>EVERY PERSON<br/>HAS A PLACE</b></div></div><div className="story-grid"><div><span className="section-kicker">OUR MOTTO</span><h2>Where no man<br/><em>is a liability.</em></h2></div><p>We believe a thriving church makes room for every person. No one is overlooked. Every story matters, every gift can serve, and every life can be strengthened through faith and community.</p></div><div className="interactive-values"><div className="value-picker">{[['belong','Belonging'],['grow','Growth'],['serve','Service']].map(([id,label], index) => <button className={selectedValue === id ? 'selected' : ''} key={id} onClick={() => setSelectedValue(id)}><span>0{index + 1}</span>{label}<b></b></button>)}</div><article className="value-detail"><span className="section-kicker">{selectedValue.toUpperCase()}</span><h2>{selectedValue === 'belong' ? 'You are welcome here.' : selectedValue === 'grow' ? 'There is room to grow.' : 'Your gifts have a place.'}</h2><p>{selectedValue === 'belong' ? 'Come as you are. Find people who will learn your name and walk alongside you.' : selectedValue === 'grow' ? 'Explore Scripture, ask honest questions, and discover a faith that shapes everyday life.' : 'Join a ministry team and put your gifts to work for people in our church and city.'}</p></article></div><div className="route-cta"><span>Ready to find your place?</span><a className="button" href="#/contact">Plan a visit </a></div></section>

  if (page === 'messages') return <section className="route-page listing-page"><PageTitle kicker="MESSAGES & SERMONS" title={<>Words for your<br/><em>everyday walk.</em></>} description="Listen, watch, and revisit messages from Kingdom Citizens Ministries Int'l."/><form className="search-bar route-search" onSubmit={(event) => { event.preventDefault(); loadFeed(search) }}><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, speaker, or scripture"/><button>Search </button></form>{feedState === 'loading' && <p className="feed-message">Loading messages…</p>}{feedState === 'error' && <p className="feed-message error-message">{feedError}<button onClick={() => loadFeed(search)}>Retry</button></p>}<div className="route-sermon-grid">{sermons.map((sermon) => <article className="route-sermon-card" key={sermon._id || sermon.slug}><a className="sermon-image" href={sermon.videoUrl || sermon.audioUrl || '#/messages'} target={sermon.videoUrl || sermon.audioUrl ? '_blank' : undefined} rel="noreferrer" style={sermon.thumbnailUrl ? { backgroundImage: `linear-gradient(0deg, rgba(17,28,24,.65), transparent 75%), url("${sermon.thumbnailUrl}")` } : undefined}><span className="sermon-play">▶</span><span className="image-tag">{sermon.scriptureReference || 'MESSAGE'}</span></a><span className="sermon-meta">{dateLabel(sermon.preachedAt)} · {sermon.speaker}</span><h2>{sermon.title}</h2><p>{sermon.description || 'A message from the ministry.'}</p><a className="card-link" href={sermon.videoUrl || sermon.audioUrl || '#/messages'} target={sermon.videoUrl || sermon.audioUrl ? '_blank' : undefined} rel="noreferrer">Watch or listen </a></article>)}</div>{feedState === 'ready' && !sermons.length && <div className="empty-state">No messages match that search. Try another word.</div>}</section>

  if (page === 'live') return <LiveStreamPage/>

  if (page === 'events') return <section className="route-page listing-page"><PageTitle kicker="WHAT'S HAPPENING" title={<>Life is better<br/><em>together.</em></>} description="Find a gathering, ministry meetup, or next step at Kingdom Citizens Ministries Int'l."/><div className="filter-row"><span>Explore updates</span><div>{['all','service','youth','children','prayer','ministry','general'].map((item) => <button className={category === item ? 'filter-active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></div>{feedState === 'loading' && <p className="feed-message">Loading events…</p>}{feedState === 'error' && <p className="feed-message error-message">{feedError}<button onClick={() => loadFeed()}>Retry</button></p>}<div className="event-grid">{announcements.filter((item) => category === 'all' || item.category === category).map((item, index) => { const eventDate = item.publishAt || item.publishedAt ? new Date(item.publishAt || item.publishedAt) : null; return <article className="event-card" key={item._id || item.slug}><div className={`event-date event-tone-${index % 3}`}><span>{eventDate?.toLocaleDateString('en', { month: 'short' }) || 'DATE'}</span><b>{eventDate?.getDate() || '—'}</b></div><span className="category-tag">{item.category || 'GENERAL'}</span><h2>{item.title}</h2><p>{item.body}</p><button onClick={() => notify(`For details about ${item.title}, contact the church team.`)}>Event details </button></article> })}</div>{feedState === 'ready' && !announcements.length && <div className="empty-state">No upcoming events are posted yet. Check back for updates.</div>}</section>

  if (page === 'testimonies') return <TestimoniesPage notify={notify}/>

  if (page === 'contact') return <section className="route-page contact-page"><div className="contact-intro"><span className="section-kicker">WE'D LOVE TO MEET YOU</span><h1>Say hello.<br/><em>There's a place for you.</em></h1><p>Ask a question, plan a visit, or tell us how we can pray with you. Our team would love to hear from you.</p><div className="contact-info"><a href="mailto:kingdomcitizensministries46@gmail.com"><span>EMAIL</span>kingdomcitizensministries46@gmail.com </a><div><span>ADDRESS</span>286 Clifford Road, Aba, Nigeria, 450102</div><div><span>GATHER WITH US</span>Sunday · 7:00 AM–11:30 AM · Aba</div></div></div><ContactForm/></section>

  return <section className="route-page"><PageTitle kicker="KINGDOM CITIZENS MINISTRIES INT'L" title={<>Every life has<br/><em>a place here.</em></>} description="Where no man is a liability."/><a className="button" href="#/home">Back to home </a></section>
}

function LiveStreamPage() {
  const [stream, setStream] = useState({ embedUrl: '', isLive: false, serviceTime: 'Sunday, 7:00 AM–11:30 AM' })

  useEffect(() => {
    request('/live-stream').then((payload) => setStream(payload.data || stream)).catch(() => {})
  }, [])

  return <section className="route-page live-page">
    <div className="live-intro">
      <span className="section-kicker">GATHER WITH US ONLINE</span>
      <h1>Worship with us,<br/><em>wherever you are.</em></h1>
      <p>Join Kingdom Citizens Ministries Int'l for worship, teaching, and a moment to grow together in faith.</p>
    </div>
    <div className="live-player-shell">
      {stream.embedUrl ? <iframe className="live-player" src={stream.embedUrl} title="Kingdom Citizens Ministries live stream" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/> : <div className="live-player-empty">
        <span className="live-play-icon">▶</span>
        <span className="section-kicker">LIVE STREAM</span>
        <h2>We’ll meet you here.</h2>
        <p>The stream player will appear here during our online service.</p>
        <a className="button button-light" href="#/contact">Ask about the next service </a>
      </div>}
    </div>
    <div className="live-details">
      <div><span className="section-kicker">{stream.isLive && stream.embedUrl ? 'NOW STREAMING' : 'NEXT GATHERING'}</span><h2>{stream.serviceTime}</h2><p>Join us online or in person in Aba, Nigeria.</p></div>
      <a className="text-link" href="#/messages">Watch recent messages </a>
    </div>
  </section>
}

function LiveStreamAdmin({ notify }) {
  const [settings, setSettings] = useState({ embedUrl: '', isLive: false, serviceTime: 'Sunday, 7:00 AM–11:30 AM' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    request('/live-stream').then((payload) => setSettings(payload.data || settings)).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [])

  async function save(event) {
    event.preventDefault()
    setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    const data = { embedUrl: form.get('embedUrl').trim(), serviceTime: form.get('serviceTime').trim(), isLive: form.get('isLive') === 'on' }
    try {
      const payload = await request('/live-stream', { method: 'PUT', body: JSON.stringify(data) })
      setSettings(payload.data || data)
      notify('Live stream settings saved.')
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  if (loading) return <div className="dashboard-content"><p className="feed-message">Loading stream settings…</p></div>
  return <form className="manage-form live-settings-form" onSubmit={save}>
    <h3>Live stream settings</h3>
    <p className="live-settings-help">Set the secure embed URL from your streaming provider. These settings control the public <a href="#/live">live stream page</a>.</p>
    <label>Stream embed URL<input type="url" name="embedUrl" placeholder="https://www.youtube-nocookie.com/embed/..." defaultValue={settings.embedUrl} /></label>
    <label>Service time<input type="text" name="serviceTime" maxLength="120" required defaultValue={settings.serviceTime} /></label>
    <label className="live-status-toggle"><input type="checkbox" name="isLive" defaultChecked={settings.isLive} /><span><b>Mark service as live</b><small>Displays a live status on the public stream page.</small></span></label>
    {error && <div className="workspace-error">{error}</div>}
    <div className="form-actions"><span className="live-settings-secure">HTTPS embed URLs only</span><button className="button button-small" disabled={saving}>{saving ? 'Saving…' : 'Save stream settings'}</button></div>
  </form>
}

function HomeTestimonies() {
  const [items, setItems] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    request('/testimonies?limit=5').then((payload) => {
      if (!cancelled) setItems(payload.data || [])
    }).catch(() => {
      if (!cancelled) setItems([])
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const current = items[activeIndex]
  const move = (direction) => setActiveIndex((index) => (index + direction + items.length) % items.length)

  return <section id="testimonies-preview" className="testimony-highlight section-pad"><div className="testimony-highlight-heading"><div><span className="section-kicker">TESTIMONIES</span><h2>What God is <em>doing.</em></h2><p>Real stories of faith and hope from our church community.</p></div><a href="#/testimonies" className="arrow-link">Read every story </a></div>{current ? <article className="testimony-highlight-card"><span className="testimony-highlight-quote">“</span><div className="testimony-highlight-copy"><span className="category-tag">COMMUNITY STORY</span><h3>{current.title}</h3><blockquote>{current.testimony}</blockquote><div className="testimony-highlight-meta"><span>{current.isAnonymous || !current.displayName ? 'A community member' : current.displayName}</span><i>·</i><span>{dateLabel(current.approvedAt || current.createdAt)}</span></div></div><div className="testimony-highlight-controls"><button aria-label="Previous testimony" onClick={() => move(-1)} disabled={items.length < 2}>←</button><span>{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span><GlassIcons className="testimony-glass-next" items={[{ icon: '→', color: '#2867ad', label: 'Next testimony', onClick: () => move(1) }]} size={32} gap={0} columns={1} roundness={1} refraction={0.65} bevel={0.7} dispersion={0} frost={0.2} shine={0.85} tint="#ffffff" tintOpacity={0.18} iconColor="#183453" plate="circle" spread={0.25} hover="press" parallax={0} labels="none" intro={false} theme="light"/></div></article> : <article className="testimony-highlight-empty"><span className="section-kicker">{loading ? 'COMMUNITY STORIES' : 'SHARE YOUR STORY'}</span><h3>{loading ? 'Gathering stories of hope…' : 'Your story can encourage someone.'}</h3><p>{loading ? 'Approved testimonies will appear here.' : 'We are looking forward to sharing stories from our community.'}</p></article>}<div className="testimony-highlight-footer"><span>Every story is shared with care.</span><a className="button" href="#/testimonies">Share your testimony </a></div></section>
}

function TestimoniesPage({ notify }) {
  const [testimonies, setTestimonies] = useState([])
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(true)

  useEffect(() => {
    let cancelled = false
    request(`/testimonies?page=${page}&limit=6`).then((payload) => {
      if (cancelled) return
      setTestimonies((current) => page === 1 ? (payload.data || []) : [...current, ...(payload.data || [])])
      setPagination(payload.pagination || null)
      setError('')
    }).catch((loadError) => { if (!cancelled) setError(loadError.message) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, reload])

  async function submit(event) {
    event.preventDefault()
    setSending(true)
    setError('')
    setMessage('')
    const form = event.currentTarget
    const values = new FormData(form)
    const body = {
      title: values.get('title'),
      testimony: values.get('testimony'),
      isAnonymous: anonymous,
      ...(anonymous ? {} : { displayName: values.get('displayName') }),
    }
    try {
      await request('/testimonies', { method: 'POST', body: JSON.stringify(body) })
      form.reset()
      setAnonymous(true)
      setMessage('Thank you for sharing. Your testimony has been sent for review.')
      notify('Your testimony was submitted for review.')
    } catch (submitError) { setError(submitError.message) } finally { setSending(false) }
  }

  return <section className="route-page testimony-page">
    <PageTitle kicker="STORIES OF FAITH" title={<>Real lives.<br/><em>Real hope.</em></>} description="Read stories of faith from our community, or share what God has done in your life."/>
    <div className="testimony-layout"><div className="testimony-list"><div className="testimony-list-heading"><span className="section-kicker">COMMUNITY STORIES</span><span>{pagination?.total ?? testimonies.length} shared</span></div>
      {loading && <p className="feed-message">Loading testimonies…</p>}{error && <p className="feed-message error-message">{error}<button onClick={() => { setLoading(true); setReload((current) => current + 1) }}>Retry</button></p>}
      <div className="testimony-cards">{testimonies.map((item) => <article className="testimony-card" key={item._id}><span className="testimony-mark">“</span><h2>{item.title}</h2><p>{item.testimony}</p><small>{item.isAnonymous || !item.displayName ? 'A community member' : item.displayName}<span> · </span>{dateLabel(item.approvedAt || item.createdAt)}</small></article>)}</div>
      {!loading && !error && !testimonies.length && <div className="empty-state">No public testimonies have been shared yet. You can be the first to share a story.</div>}
      {pagination && page < pagination.totalPages && <button className="testimony-load-more" onClick={() => { setLoading(true); setPage((current) => current + 1) }}>Load more stories </button>}
    </div>
    <form className="contact-form testimony-form" onSubmit={submit}><span className="section-kicker">SHARE YOUR STORY</span><h2>Your story can encourage someone.</h2><p className="testimony-form-copy">Submissions are reviewed by our ministry team before appearing publicly.</p><label>Story title<input name="title" minLength="3" maxLength="200" required placeholder="A short title for your testimony"/></label><label>Your testimony<textarea name="testimony" minLength="10" maxLength="10000" rows="7" required placeholder="Tell us what happened…"/></label><label className="anonymous-choice"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)}/> Share anonymously</label>{!anonymous && <label>Your display name<input name="displayName" maxLength="120" minLength="1" required placeholder="The name you'd like displayed"/></label>}{message && <p className="testimony-success" role="status">{message}</p>}{error && <p className="profile-error" role="alert">{error}</p>}<button className="button" disabled={sending}>{sending ? 'Submitting…' : 'Submit for review'} </button></form></div>
  </section>
}

function PageTitle({ kicker, title, description }) {
  return <div className="page-title"><span className="section-kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></div>
}

function ProfilePage({ user, onUpdated, notify }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(form.entries())
    body.phone = body.phone.trim() || null
    body.address = body.address.trim() || null
    try {
      const payload = await request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) })
      onUpdated(payload.data.user)
      notify('Your contact information has been updated.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return <section className="route-page profile-page">
    <PageTitle kicker="YOUR ACCOUNT" title={<>Your details,<br/><em>all in one place.</em></>} description="Keep your contact information current so our ministry team can stay connected with you."/>
    <form className="contact-form profile-form" onSubmit={saveProfile}>
      <span className="section-kicker">PERSONAL INFORMATION</span><h2>Update your profile</h2>
      <div className="name-fields"><label>First name<input name="firstName" defaultValue={user.firstName || ''} minLength="2" maxLength="80" required/></label><label>Last name<input name="lastName" defaultValue={user.lastName || ''} minLength="2" maxLength="80" required/></label></div>
      <label>Email address<input type="email" name="email" defaultValue={user.email || ''} maxLength="254" required/><small>Used to sign in to your account.</small></label>
      <label>Phone number<input type="tel" name="phone" defaultValue={user.phone || ''} maxLength="30" placeholder="Add a phone number"/></label>
      <label>Address<textarea name="address" defaultValue={user.address || ''} maxLength="300" rows="3" placeholder="Add your address"/></label>
      {error && <p className="profile-error" role="alert">{error}</p>}
      <button className="button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'} </button>
    </form>
  </section>
}

function ContactForm() {
  const [sent, setSent] = useState(false)
  function submit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const subject = encodeURIComponent(`Website message from ${data.name}`)
    const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`)
    window.location.href = `mailto:kingdomcitizensministries46@gmail.com?subject=${subject}&body=${body}`
    setSent(true)
  }
  return <form className="contact-form" onSubmit={submit}><span className="section-kicker">SEND A NOTE</span><h2>How can we help?</h2><label>Your name<input name="name" required placeholder="Your name"/></label><label>Email address<input type="email" name="email" required placeholder="you@example.com"/></label><label>Your message<textarea name="message" required rows="5" placeholder="Write your message here…"/></label><button className="button">{sent ? 'Open your email app' : 'Send your message'} </button><small>Your email app will open with your message ready to send.</small></form>
}

function Management({ activeTab, setActiveTab, notify, isAdmin = false, canReviewTestimonies = false, currentUserId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const config = {
    sermons: { list: '/content/sermons/manage/all', create: '/content/sermons', label: 'Sermons' },
    announcements: { list: '/content/announcements/manage/all', create: '/content/announcements', label: 'Announcements' },
    ministries: { list: '/ministries', create: '/ministries', label: 'Ministries' },
    members: { list: '/members', create: '/members', label: 'Members' },
    users: { list: '/users', label: 'Users' },
    testimonies: { list: '/testimonies/admin/pending', label: 'Pending testimonies' },
  }[activeTab]

  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try { const payload = await request(config.list + '?limit=50'); setItems(payload.items || payload.data || []) }
    catch (err) { setError(err.message); setItems([]) } finally { setLoading(false) }
  }, [config.list])
  useEffect(() => {
    const timer = window.setTimeout(() => refresh(), 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  async function save(event) {
    event.preventDefault(); setLoading(true)
    const form = new FormData(event.currentTarget)
    const data = Object.fromEntries([...form.entries()].filter(([, value]) => value !== ''))
    if (activeTab === 'sermons') { data.status ||= 'published'; if (data.preachedAt) data.preachedAt = new Date(data.preachedAt).toISOString() }
    if (activeTab === 'members' && data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth).toISOString()
    if (activeTab === 'announcements') { data.status ||= 'published'; data.category ||= 'general'; data.priority ||= 'normal' }
    try {
      await request(editing ? `${config.create}/${editing._id}` : config.create, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(data) })
      setShowForm(false); setEditing(null); await refresh(); notify(`${config.label.slice(0, -1)} saved successfully.`)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function archive(item) {
    if (!window.confirm(`Archive “${item.title || item.name || item.firstName}”?`)) return
    const base = activeTab === 'sermons' ? '/content/sermons' : activeTab === 'announcements' ? '/content/announcements' : activeTab === 'ministries' ? '/ministries' : '/members'
    try { await request(`${base}/${item._id}/archive`, { method: 'PATCH' }); await refresh(); notify('Record archived.') } catch (err) { setError(err.message) }
  }

  async function reviewTestimony(item, action) {
    try {
      await request(`/testimonies/${item._id}/review`, { method: 'PATCH', body: JSON.stringify({ action }) })
      await refresh()
      notify(`Testimony ${action === 'approve' ? 'approved' : 'rejected'}.`)
    } catch (err) { setError(err.message) }
  }

  return <div className="management"><div className="management-toolbar"><div className="workspace-tabs">{['sermons', 'announcements', 'ministries', 'members', ...(canReviewTestimonies ? ['testimonies'] : []), ...(isAdmin ? ['users'] : [])].map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => { setActiveTab(tab); setShowForm(false) }}>{tab}</button>)}</div>{config.create && <button className="button button-small" onClick={() => { setEditing(null); setShowForm(!showForm) }}>＋ Add {config.label.slice(0, -1)}</button>}</div>
    {showForm && <form className="manage-form" onSubmit={save}><h3>{editing ? `Edit ${config.label.slice(0, -1)}` : `New ${config.label.slice(0, -1)}`}</h3><ManagementFields tab={activeTab} item={editing}/><div className="form-actions"><button type="button" className="text-link" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button><button className="button button-small" disabled={loading}>{loading ? 'Saving…' : 'Save record'}</button></div></form>}
    {error && <div className="workspace-error">{error}<button onClick={refresh}>Retry</button></div>}{loading && !showForm && <div className="feed-message">Loading {config.label.toLowerCase()}…</div>}
    {!loading && !error && <>{activeTab === 'users' && <div className="user-management-intro"><b>Manage account access</b><span>Choose a role and account status, then select Save for that user.</span></div>}{activeTab === 'testimonies' && <div className="user-management-intro"><b>Review community testimonies</b><span>Approved testimonies appear publicly on the Stories of faith page.</span></div>}<div className="manage-list">{items.map((item) => activeTab === 'users' ? <UserManagerRow key={item.id || item._id} user={item} currentUserId={currentUserId} notify={notify}/> : activeTab === 'testimonies' ? <article className="manage-item testimony-review-card" key={item._id}><div><span className="category-tag">PENDING · {item.isAnonymous ? 'ANONYMOUS' : (item.displayName || 'NAMED')}</span><h3>{item.title}</h3><p>{item.testimony}</p><small>Submitted {dateLabel(item.createdAt)}{!item.isAnonymous && item.displayName ? ` · ${item.displayName}` : ''}</small></div><div className="manage-actions"><button onClick={() => reviewTestimony(item, 'approve')}>Approve</button><button onClick={() => reviewTestimony(item, 'reject')}>Reject</button></div></article> : <article className="manage-item" key={item._id}><div><span className="category-tag">{item.status || item.membershipStatus || 'ACTIVE'}</span><h3>{item.title || item.name || `${item.firstName} ${item.lastName}`}</h3><p>{item.speaker || item.description || item.email || item.body || item.meetingDay || item.membershipNumber || '—'}</p></div><div className="manage-actions">{['sermons', 'announcements', 'ministries'].includes(activeTab) && <button onClick={() => { setEditing(item); setShowForm(true) }}>Edit</button>}{activeTab !== 'users' && activeTab !== 'testimonies' && <button onClick={() => archive(item)}>Archive</button>}</div></article>)}{!items.length && <div className="feed-message">No {config.label.toLowerCase()} found yet.</div>}</div></>}</div>
}

function UserManagerRow({ user, currentUserId, notify }) {
  const userId = user.id || user._id
  const isCurrentUser = userId === currentUserId
  const [role, setRole] = useState(user.role)
  const [status, setStatus] = useState(user.status)
  const [savedRole, setSavedRole] = useState(user.role)
  const [savedStatus, setSavedStatus] = useState(user.status)
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    try {
      if (role !== savedRole) { await request(`/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }); setSavedRole(role) }
      if (status !== savedStatus) { await request(`/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); setSavedStatus(status) }
      notify(role === savedRole && status === savedStatus ? 'No changes to save.' : 'User access updated.')
    } catch (error) { notify(error.message) } finally { setBusy(false) }
  }
  return <article className="manage-item user-manage-item"><div><span className="category-tag">{user.status}</span><h3>{user.firstName} {user.lastName}</h3><p>{user.email}</p></div><div className="user-role-controls"><label>Role<select aria-label={`Role for ${user.email}`} value={role} onChange={(event) => setRole(event.target.value)} disabled={isCurrentUser}>{['member','pastor','ministry_leader','finance','admin'].map((value) => <option key={value} value={value}>{value.replace('_',' ')}</option>)}</select></label><label>Account status<select aria-label={`Status for ${user.email}`} value={status} onChange={(event) => setStatus(event.target.value)} disabled={isCurrentUser}><option value="active">active</option><option value="suspended">suspended</option><option value="disabled">disabled</option></select></label>{isCurrentUser ? <small className="own-account-note">Your own access cannot be changed here.</small> : <button className="button button-small" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>}</div></article>
}

function ManagementFields({ tab, item }) {
  const field = (label, name, type = 'text', required = false, value) => <label>{label}<input name={name} type={type} defaultValue={value ?? item?.[name] ?? ''} required={required}/></label>
  if (tab === 'sermons') return <><div className="form-grid">{field('Title', 'title', 'text', true)}{field('Speaker', 'speaker', 'text', true)}{field('Scripture reference', 'scriptureReference')}{field('Date preached', 'preachedAt', 'date', false, item?.preachedAt?.slice?.(0, 10))}{field('Video URL', 'videoUrl', 'url')}{field('Audio URL', 'audioUrl', 'url')}{field('Thumbnail URL', 'thumbnailUrl', 'url')}</div><label>Description<textarea name="description" rows="3" defaultValue={item?.description || ''}/></label><label>Status<select name="status" defaultValue={item?.status || 'published'}><option value="draft">Draft</option><option value="published">Published</option></select></label></>
  if (tab === 'announcements') return <><div className="form-grid">{field('Title', 'title', 'text', true)}<label>Category<select name="category" defaultValue={item?.category || 'general'}>{['general','service','youth','children','prayer','ministry','other'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Priority<select name="priority" defaultValue={item?.priority || 'normal'}>{['normal','important','urgent'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Status<select name="status" defaultValue={item?.status || 'published'}><option value="draft">Draft</option><option value="published">Published</option></select></label></div><label>Announcement<textarea name="body" rows="4" required defaultValue={item?.body || ''}/></label></>
  if (tab === 'ministries') return <><div className="form-grid">{field('Name', 'name', 'text', true)}{field('Meeting day', 'meetingDay')}{field('Meeting time (24h)', 'meetingTime', 'time')}{field('Meeting location', 'meetingLocation')}</div><label>Description<textarea name="description" rows="3" defaultValue={item?.description || ''}/></label>{item && <label>Status<select name="status" defaultValue={item.status}><option>active</option><option>inactive</option></select></label>}</>
  return <div className="form-grid">{field('First name', 'firstName', 'text', true)}{field('Last name', 'lastName', 'text', true)}{field('Email', 'email', 'email')}{field('Phone', 'phone', 'tel')}{field('Address', 'address')}{field('Date of birth', 'dateOfBirth', 'date')}</div>
}

export default App
