import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng, toBlob } from 'html-to-image'
import { FONTS, BACKGROUNDS, TEXT_COLORS } from './fonts'
import './App.css'

const STORAGE_KEY = 'fontwow_saved_v1'
const TABS = [
  { id: 'font', label: 'فونت' },
  { id: 'style', label: 'استایل' },
  { id: 'color', label: 'رنگ متن' },
  { id: 'bg', label: 'پس‌زمینه' },
  { id: 'layout', label: 'چیدمان' },
]

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

const defaultState = {
  text: '',
  fontId: 'vazirmatn',
  fontSize: 42,
  bold: false,
  italic: false,
  underline: false,
  shadow: false,
  stroke: false,
  color: '#ffffff',
  bgId: 'grad-1',
  align: 'center',
  letterSpacing: 0,
  lineHeight: 1.4,
  direction: 'rtl',
}

export default function App() {
  const [state, setState] = useState(defaultState)
  const [tab, setTab] = useState('font')
  const [showSave, setShowSave] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [saved, setSaved] = useState(loadSaved)
  const [toast, setToast] = useState('')
  const previewRef = useRef(null)
  const textRef = useRef(null)

  const font = useMemo(() => FONTS.find(f => f.id === state.fontId) ?? FONTS[0], [state.fontId])
  const bg = useMemo(() => BACKGROUNDS.find(b => b.id === state.bgId) ?? BACKGROUNDS[0], [state.bgId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  function update(patch) {
    setState(s => ({ ...s, ...patch }))
  }

  function onTextInput(e) {
    update({ text: e.currentTarget.innerText })
  }

  const textStyle = {
    fontFamily: font.family,
    fontSize: `${state.fontSize}px`,
    fontWeight: state.bold ? 700 : 400,
    fontStyle: state.italic ? 'italic' : 'normal',
    textDecoration: state.underline ? 'underline' : 'none',
    color: state.color,
    textAlign: state.align,
    letterSpacing: `${state.letterSpacing}px`,
    lineHeight: state.lineHeight,
    direction: state.direction,
    textShadow: state.shadow ? '0 4px 18px rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.3)' : 'none',
    WebkitTextStroke: state.stroke ? `1.5px ${state.color === '#111111' ? '#fff' : '#111'}` : 'none',
  }

  const previewStyle = { background: bg.css }

  async function exportPng() {
    if (!previewRef.current) return
    try {
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 3, cacheBust: true })
      const link = document.createElement('a')
      link.download = `fontwow-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      setToast('عکس ذخیره شد')
    } catch {
      setToast('خطا در ساخت عکس')
    }
    setShowSave(false)
  }

  async function copyImage() {
    if (!previewRef.current) return
    try {
      const blob = await toBlob(previewRef.current, { pixelRatio: 3, cacheBust: true })
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setToast('عکس در کلیپ‌بورد کپی شد')
    } catch {
      try {
        await navigator.clipboard.writeText(state.text)
        setToast('کپی عکس پشتیبانی نشد؛ متن کپی شد')
      } catch {
        setToast('کپی ناموفق بود')
      }
    }
    setShowSave(false)
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(state.text)
      setToast('متن کپی شد')
    } catch {
      setToast('کپی ناموفق بود')
    }
    setShowSave(false)
  }

  function saveToGallery() {
    if (!state.text.trim()) {
      setToast('اول یک متن بنویس')
      return
    }
    const entry = { ...state, id: `${Date.now()}` }
    const next = [entry, ...saved].slice(0, 40)
    setSaved(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setToast('در گالری ذخیره شد')
    setShowSave(false)
  }

  function loadEntry(entry) {
    setState({ ...defaultState, ...entry })
    if (textRef.current) textRef.current.innerText = entry.text
    setShowGallery(false)
  }

  function deleteEntry(id, e) {
    e.stopPropagation()
    const next = saved.filter(s => s.id !== id)
    setSaved(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function clearAll() {
    update({ text: '' })
    if (textRef.current) textRef.current.innerText = ''
    textRef.current?.focus()
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="pill-btn" onClick={() => setShowSave(true)}>ذخیره</button>
        <div className="brand">FontWoW</div>
        <button className="pill-btn" onClick={() => setShowGallery(true)}>گالری</button>
      </header>

      <main className="stage">
        <div className="stage-inner" ref={previewRef} style={previewStyle}>
          <div
            className="text-canvas"
            ref={textRef}
            style={textStyle}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="اینجا بنویسید…"
            onInput={onTextInput}
          />
        </div>
        {state.text && (
          <button className="clear-btn" onClick={clearAll} aria-label="پاک کردن">✕</button>
        )}
      </main>

      <section className="controls">
        <div className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="panel">
          {tab === 'font' && (
            <div className="chip-row">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  className={`chip font-chip ${state.fontId === f.id ? 'selected' : ''}`}
                  onClick={() => update({ fontId: f.id, direction: f.rtl ? 'rtl' : 'ltr' })}
                >
                  <span style={{ fontFamily: f.family }}>{f.rtl ? 'ابر' : 'Aa'}</span>
                  <span className="chip-label">{f.label}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'style' && (
            <div className="style-grid">
              <button className={`toggle ${state.bold ? 'on' : ''}`} onClick={() => update({ bold: !state.bold })}><b>B</b> بولد</button>
              <button className={`toggle ${state.italic ? 'on' : ''}`} onClick={() => update({ italic: !state.italic })}><i>I</i> ایتالیک</button>
              <button className={`toggle ${state.underline ? 'on' : ''}`} onClick={() => update({ underline: !state.underline })}><u>U</u> زیرخط</button>
              <button className={`toggle ${state.shadow ? 'on' : ''}`} onClick={() => update({ shadow: !state.shadow })}>🌫 سایه</button>
              <button className={`toggle ${state.stroke ? 'on' : ''}`} onClick={() => update({ stroke: !state.stroke })}>◯ دورخط</button>
              <button className={`toggle ${state.direction === 'ltr' ? 'on' : ''}`} onClick={() => update({ direction: state.direction === 'rtl' ? 'ltr' : 'rtl' })}>↔ {state.direction === 'rtl' ? 'RTL' : 'LTR'}</button>
            </div>
          )}

          {tab === 'color' && (
            <div className="chip-row">
              {TEXT_COLORS.map(c => (
                <button
                  key={c}
                  className={`swatch ${state.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => update({ color: c })}
                />
              ))}
              <label className="swatch custom-swatch">
                <input type="color" value={state.color} onChange={e => update({ color: e.target.value })} />
              </label>
            </div>
          )}

          {tab === 'bg' && (
            <div className="chip-row">
              {BACKGROUNDS.map(b => (
                <button
                  key={b.id}
                  className={`swatch bg-swatch ${state.bgId === b.id ? 'selected' : ''}`}
                  style={{ background: b.css === 'transparent' ? 'repeating-conic-gradient(#3a3a3a 0% 25%, #2a2a2a 0% 50%) 50% / 10px 10px' : b.css }}
                  onClick={() => update({ bgId: b.id })}
                  title={b.label}
                />
              ))}
            </div>
          )}

          {tab === 'layout' && (
            <div className="layout-panel">
              <div className="row">
                <span>اندازه</span>
                <input type="range" min="16" max="120" value={state.fontSize} onChange={e => update({ fontSize: +e.target.value })} />
                <span className="val">{state.fontSize}</span>
              </div>
              <div className="row">
                <span>فاصله حروف</span>
                <input type="range" min="-4" max="20" value={state.letterSpacing} onChange={e => update({ letterSpacing: +e.target.value })} />
                <span className="val">{state.letterSpacing}</span>
              </div>
              <div className="row">
                <span>فاصله خطوط</span>
                <input type="range" min="0.8" max="2.4" step="0.1" value={state.lineHeight} onChange={e => update({ lineHeight: +e.target.value })} />
                <span className="val">{state.lineHeight}</span>
              </div>
              <div className="align-row">
                {['right', 'center', 'left'].map(a => (
                  <button key={a} className={`toggle ${state.align === a ? 'on' : ''}`} onClick={() => update({ align: a })}>
                    {a === 'right' ? 'راست' : a === 'center' ? 'وسط' : 'چپ'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {showSave && (
        <div className="sheet-overlay" onClick={() => setShowSave(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <button className="icon-btn" onClick={() => setShowSave(false)}>✕</button>
              <span>ذخیره</span>
              <span />
            </div>
            <button className="sheet-item recommended" onClick={exportPng}>⬇ ذخیره در گالری دستگاه (PNG)</button>
            <button className="sheet-item" onClick={copyImage}>📋 کپی عکس در کلیپ‌بورد</button>
            <button className="sheet-item" onClick={copyText}>🔤 کپی متن</button>
            <button className="sheet-item" onClick={saveToGallery}>⭐ ذخیره در گالری برنامه</button>
          </div>
        </div>
      )}

      {showGallery && (
        <div className="sheet-overlay" onClick={() => setShowGallery(false)}>
          <div className="sheet tall" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <button className="icon-btn" onClick={() => setShowGallery(false)}>✕</button>
              <span>گالری من</span>
              <span />
            </div>
            {saved.length === 0 && <p className="empty">چیزی ذخیره نشده. یک متن بساز و ذخیره کن.</p>}
            <div className="gallery-grid">
              {saved.map(entry => {
                const f = FONTS.find(x => x.id === entry.fontId) ?? FONTS[0]
                const b = BACKGROUNDS.find(x => x.id === entry.bgId) ?? BACKGROUNDS[0]
                return (
                  <div key={entry.id} className="gallery-card" style={{ background: b.css }} onClick={() => loadEntry(entry)}>
                    <span
                      className="gallery-text"
                      style={{
                        fontFamily: f.family,
                        color: entry.color,
                        direction: entry.direction,
                        fontWeight: entry.bold ? 700 : 400,
                        fontStyle: entry.italic ? 'italic' : 'normal',
                      }}
                    >
                      {entry.text}
                    </span>
                    <button className="delete-btn" onClick={e => deleteEntry(entry.id, e)}>✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <footer className="footer">
        <a href="https://github.com/m4tinbeigi-official/fontwow" target="_blank" rel="noreferrer">متن‌باز روی گیت‌هاب ↗</a>
      </footer>
    </div>
  )
}
