import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Landing from './Landing.jsx'

function isAppHash() {
  return window.location.hash.replace(/^#\/?/, '') === 'app'
}

function Root() {
  const [landing, setLanding] = useState(!isAppHash())

  useEffect(() => {
    const onHashChange = () => setLanding(!isAppHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('landing-mode', landing)
  }, [landing])

  return landing ? <Landing /> : <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
