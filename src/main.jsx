import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Landing from './Landing.jsx'

function isAboutHash() {
  return window.location.hash.replace(/^#\/?/, '') === 'about'
}

function Root() {
  const [landing, setLanding] = useState(isAboutHash())

  useEffect(() => {
    const onHashChange = () => setLanding(isAboutHash())
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
