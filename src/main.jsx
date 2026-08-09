import logger from './logger'
logger.init()

import { Component, StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import Landing from './Landing.jsx'
import ShareKit from './ShareKit.jsx'
import './index.css'

const CHUNK_RELOAD_KEY = 'fontwow_chunk_reload'

class StartupErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    logger.error('Startup', error?.message || 'Application failed to load', info?.componentStack || '')
  }

  retry = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="startup-error" role="alert" dir="rtl">
        <div className="startup-error__card">
          <div className="startup-error__icon" aria-hidden="true">!</div>
          <h1>بارگذاری فونت‌واو کامل نشد</h1>
          <p>اتصال اینترنت را بررسی کنید و دوباره تلاش کنید. طرح‌های ذخیره‌شده شما حذف نمی‌شوند.</p>
          <button type="button" onClick={this.retry}>تلاش دوباره</button>
          <details>
            <summary>جزئیات خطا</summary>
            <code dir="ltr">{this.state.error?.message || 'Unknown startup error'}</code>
          </details>
        </div>
      </main>
    )
  }
}

window.addEventListener('vite:preloadError', (event) => {
  if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    event.preventDefault()
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    window.location.reload()
  }
})

function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (hash === 'app') return 'app'
  if (hash === 'share') return 'share'
  return 'landing'
}

// The native app has no landing page to show — always boot straight into the editor.
if (Capacitor.isNativePlatform() && getRoute() !== 'app') {
  window.location.hash = '#/app'
}

function Root() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('landing-mode', route === 'landing')
  }, [route])

  return (
    <>
      {route === 'share' && <ShareKit />}
      {route === 'app' && <App />}
      {route === 'landing' && <Landing />}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StartupErrorBoundary>
      <Root />
    </StartupErrorBoundary>
  </StrictMode>,
)
