import { StrictMode, useEffect, useState, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'

const App = lazy(() => import('./App.jsx'))
const Landing = lazy(() => import('./Landing.jsx'))
const ShareKit = lazy(() => import('./ShareKit.jsx'))

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

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--surface)' }}>
      <div className="spinner"></div>
    </div>
  )
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
    <Suspense fallback={<LoadingFallback />}>
      {route === 'share' && <ShareKit />}
      {route === 'app' && <App />}
      {route === 'landing' && <Landing />}
    </Suspense>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
