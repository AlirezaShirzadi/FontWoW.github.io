import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng, toBlob } from 'html-to-image'
import {
  FONTS, FONT_CATEGORIES, BACKGROUNDS, BG_CATEGORIES, BG_TEMPLATES, ALL_BACKGROUNDS,
  TEXT_BOX_STYLES, TEXT_COLORS, THEME_COLORS, googleFontsUrlFor,
  TEXT_EFFECTS, TEXT_GRADIENTS, ASPECT_RATIOS, TEMPLATES,
} from './fonts'
import { STRINGS } from './strings'
import './App.css'

const STORAGE_KEY = 'fontwow_saved_v1'
const SETTINGS_KEY = 'fontwow_settings_v1'
const CUSTOM_FONTS_KEY = 'fontwow_custom_fonts_v1'
const APP_SETTINGS_KEY = 'fontwow_app_settings_v1'
const DONATE_URL = '' // لینک درگاه پرداخت زیبال رو اینجا قرار بده

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function boxStyleFor(styleId, color) {
  switch (styleId) {
    case 'box':
      return { background: 'rgba(0,0,0,0.35)', padding: '10px 20px', borderRadius: '10px' }
    case 'underline':
      return { borderBottom: `4px solid ${color}`, paddingBottom: '8px' }
    case 'frame':
      return { border: `2px solid ${color}`, padding: '10px 20px', borderRadius: '8px' }
    case 'glass':
      return { background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', padding: '10px 20px', borderRadius: '14px' }
    default:
      return {}
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
  strokeWidth: 1.5,
  opacity: 100,
  margin: 24,
  textBoxStyle: 'none',
  color: '#ffffff',
  bgId: 'none',
  customBgUrl: null,
  align: 'center',
  letterSpacing: 0,
  lineHeight: 1.4,
  direction: 'rtl',
  effect: 'none',
  textGradient: 'g1',
  aspectRatio: 'free',
  bgFilter: { brightness: 100, contrast: 100, blur: 0, grayscale: 0 },
  layers: [],
  activeLayerId: null,
}

const defaultAppSettings = {
  lang: 'fa',
  themeColor: '#ff5c5c',
}

export default function App() {
  const [state, setState] = useState(() => ({ ...defaultState, ...loadJSON(SETTINGS_KEY, {}) }))
  const [appSettings, setAppSettings] = useState(() => ({ ...defaultAppSettings, ...loadJSON(APP_SETTINGS_KEY, {}) }))
  const [tab, setTab] = useState('font')
  const [fontLang, setFontLang] = useState('fa')
  const [bgCategory, setBgCategory] = useState('colors')
  const [showSave, setShowSave] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [saved, setSaved] = useState(() => loadJSON(STORAGE_KEY, []))
  const [customFonts, setCustomFonts] = useState(() => loadJSON(CUSTOM_FONTS_KEY, []))
  const [toast, setToast] = useState('')
  const [activeCanvasTool, setActiveCanvasTool] = useState(null)
  const previewRef = useRef(null)
  const textRef = useRef(null)

  const t = key => STRINGS[appSettings.lang]?.[key] ?? STRINGS.fa[key] ?? key

  const allFonts = useMemo(() => [...FONTS, ...customFonts], [customFonts])
  const visibleFonts = useMemo(
    () => allFonts.filter(f => f.dataUrl || f.lang === fontLang),
    [allFonts, fontLang],
  )
  const font = useMemo(() => allFonts.find(f => f.id === state.fontId) ?? allFonts[0], [allFonts, state.fontId])
  const bg = useMemo(() => ALL_BACKGROUNDS.find(b => b.id === state.bgId) ?? ALL_BACKGROUNDS[0], [state.bgId])

  useEffect(() => {
    if (!toast) return
    const tm = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(tm)
  }, [toast])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings))
  }, [appSettings])

  useEffect(() => {
    document.documentElement.dir = appSettings.lang === 'en' ? 'ltr' : 'rtl'
    document.documentElement.lang = appSettings.lang
  }, [appSettings.lang])

  useEffect(() => {
    customFonts.forEach(f => {
      const face = new FontFace(f.family.replace(/'/g, ''), `url(${f.dataUrl})`)
      face.load().then(loaded => document.fonts.add(loaded)).catch(() => {})
    })
  }, [customFonts])

  useEffect(() => {
    const cats = new Set([fontLang, font?.lang].filter(Boolean))
    cats.forEach(cat => {
      const linkId = `google-fonts-${cat}`
      if (document.getElementById(linkId)) return
      const url = googleFontsUrlFor(cat)
      if (!url) return
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
    })
  }, [fontLang, font])

  async function onUploadFont(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      const name = file.name.replace(/\.[^.]+$/, '')
      const id = `custom-${Date.now()}`
      const entry = { id, label: name, family: `'${name}-${id}'`, rtl: true, dataUrl }
      const next = [...customFonts, entry]
      setCustomFonts(next)
      localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next))
      update({ fontId: id })
      setToast(t('fontAdded'))
    } catch {
      setToast(t('fontError'))
    }
  }

  function deleteCustomFont(id, e) {
    e.stopPropagation()
    const next = customFonts.filter(f => f.id !== id)
    setCustomFonts(next)
    localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next))
    if (state.fontId === id) update({ fontId: 'vazirmatn' })
  }

  async function onUploadBgImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      update({ bgId: 'custom-image', customBgUrl: dataUrl })
      setToast(t('bgAdded'))
    } catch {
      setToast(t('bgError'))
    }
  }

  function removeBgImage(e) {
    e.stopPropagation()
    update({ customBgUrl: null, bgId: 'grad-1' })
  }

  function update(patch) {
    setState(s => ({ ...s, ...patch }))
  }

  function onTextInput(e) {
    update({ text: e.currentTarget.innerText })
  }

  function addLayer() {
    const id = `layer-${Date.now()}`
    const newLayer = { id, text: t('newLayerText'), x: 50, y: 50, rotation: 0, fontId: state.fontId, color: state.color, fontSize: 28 }
    update({ layers: [...state.layers, newLayer], activeLayerId: id })
  }

  function updateLayer(id, patch) {
    setState(s => ({ ...s, layers: s.layers.map(l => (l.id === id ? { ...l, ...patch } : l)) }))
  }

  function deleteLayer(id) {
    update({ layers: state.layers.filter(l => l.id !== id), activeLayerId: null })
  }

  function handleLayerDrag(e, layer) {
    e.stopPropagation()
    update({ activeLayerId: layer.id })
    if (!previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const origX = layer.x
    const origY = layer.y
    function onMove(ev) {
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      updateLayer(layer.id, {
        x: Math.min(95, Math.max(5, origX + dx)),
        y: Math.min(95, Math.max(5, origY + dy)),
      })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function handleLayerRotate(e, layer) {
    e.stopPropagation()
    const layerEl = e.currentTarget.closest('.text-layer')
    if (!layerEl) return
    const rect = layerEl.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    function onMove(ev) {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI)
      updateLayer(layer.id, { rotation: Math.round(angle + 90) })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function applyTemplate(tpl) {
    update({
      fontId: tpl.fontId,
      color: tpl.color,
      textBoxStyle: tpl.textBoxStyle,
      bgId: tpl.bgId,
      effect: tpl.effect,
      ...(tpl.textGradient ? { textGradient: tpl.textGradient } : {}),
    })
  }

  const strokeColor = state.color === '#111111' ? '#fff' : '#111'

  let effectStyle = {}
  if (state.effect === 'gradient') {
    const grad = TEXT_GRADIENTS.find(g => g.id === state.textGradient) ?? TEXT_GRADIENTS[0]
    effectStyle = {
      backgroundImage: grad.css,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
    }
  } else if (state.effect === 'neon') {
    effectStyle = {
      textShadow: `0 0 6px ${state.color}, 0 0 14px ${state.color}, 0 0 28px ${state.color}, 0 0 48px ${state.color}`,
    }
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
    opacity: state.opacity / 100,
    textShadow: state.shadow ? '0 4px 18px rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.3)' : 'none',
    WebkitTextStroke: state.stroke ? `${state.strokeWidth}px ${strokeColor}` : 'none',
    position: 'relative',
    zIndex: 1,
    ...effectStyle,
    ...boxStyleFor(state.textBoxStyle, state.color),
    ...(state.textBoxStyle !== 'none'
      ? {
        width: 'fit-content',
        maxWidth: '100%',
        marginInlineStart: state.align !== 'left' ? 'auto' : 0,
        marginInlineEnd: state.align !== 'right' ? 'auto' : 0,
      }
      : {}),
  }

  const ratio = ASPECT_RATIOS.find(r => r.id === state.aspectRatio)?.value ?? null

  const previewStyle = {
    padding: `${state.margin}px`,
    position: 'relative',
    ...(ratio ? { flex: '0 0 auto', width: 'auto', height: '100%', aspectRatio: ratio } : {}),
  }

  const bgLayerStyle = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    filter: `brightness(${state.bgFilter.brightness}%) contrast(${state.bgFilter.contrast}%) blur(${state.bgFilter.blur}px) grayscale(${state.bgFilter.grayscale}%)`,
    ...(state.bgId === 'custom-image' && state.customBgUrl
      ? { backgroundImage: `url(${state.customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: bg.css }),
  }

  async function exportPng() {
    if (!previewRef.current) return
    try {
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 3, cacheBust: true })
      const link = document.createElement('a')
      link.download = `fontwow-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      setToast(t('imageSaved'))
    } catch {
      setToast(t('imageError'))
    }
    setShowSave(false)
  }

  async function copyImage() {
    if (!previewRef.current) return
    try {
      const blob = await toBlob(previewRef.current, { pixelRatio: 3, cacheBust: true })
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setToast(t('imageCopied'))
    } catch {
      try {
        await navigator.clipboard.writeText(state.text)
        setToast(t('imageCopyFallback'))
      } catch {
        setToast(t('copyFailed'))
      }
    }
    setShowSave(false)
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(state.text)
      setToast(t('textCopied'))
    } catch {
      setToast(t('copyFailed'))
    }
    setShowSave(false)
  }

  function saveToGallery() {
    if (!state.text.trim()) {
      setToast(t('writeFirst'))
      return
    }
    const entry = { ...state, id: `${Date.now()}` }
    const next = [entry, ...saved].slice(0, 40)
    setSaved(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setToast(t('savedToGallery'))
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

  const ALIGN_ORDER = ['right', 'center', 'left']
  function cycleAlign() {
    const next = ALIGN_ORDER[(ALIGN_ORDER.indexOf(state.align) + 1) % ALIGN_ORDER.length]
    update({ align: next })
  }

  function toggleCanvasTool(tool) {
    setActiveCanvasTool(cur => (cur === tool ? null : tool))
  }

  function resetAppSettings() {
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem(APP_SETTINGS_KEY)
    localStorage.removeItem(CUSTOM_FONTS_KEY)
    window.location.reload()
  }

  const TABS = [
    { id: 'font', label: t('tabFont') },
    { id: 'style', label: t('tabStyle') },
    { id: 'box', label: t('tabBox') },
    { id: 'color', label: t('tabColor') },
    { id: 'bg', label: t('tabBg') },
    { id: 'layout', label: t('tabLayout') },
    { id: 'templates', label: t('tabTemplates') },
  ]

  const bgSwatches = bgCategory === 'colors'
    ? BACKGROUNDS
    : (BG_TEMPLATES[bgCategory] ?? [])

  return (
    <div className="app" style={{ '--accent': appSettings.themeColor }}>
      <header className="topbar">
        <button className="pill-btn" onClick={() => setShowSave(true)}>{t('save')}</button>
        <div className="brand">FontWoW</div>
        <div className="header-actions">
          <button className="pill-btn ghost icon-only" onClick={() => setShowSettings(true)} aria-label={t('settings')}>⚙</button>
          <button className="pill-btn ghost" onClick={() => setShowDonate(true)}>{t('donate')}</button>
          <button className="pill-btn" onClick={() => setShowGallery(true)}>{t('gallery')}</button>
        </div>
      </header>

      <main className="stage">
        <div
          className="stage-inner"
          ref={previewRef}
          style={previewStyle}
          onClick={() => state.activeLayerId && update({ activeLayerId: null })}
        >
          <div className="bg-layer" style={bgLayerStyle} />
          <div
            className="text-canvas"
            ref={textRef}
            style={textStyle}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={t('placeholder')}
            onInput={onTextInput}
          />
          {state.layers.map(layer => {
            const layerFont = allFonts.find(f => f.id === layer.fontId) ?? font
            return (
              <div
                key={layer.id}
                className={`text-layer ${state.activeLayerId === layer.id ? 'active' : ''}`}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                  fontFamily: layerFont.family,
                  fontSize: `${layer.fontSize}px`,
                  color: layer.color,
                  direction: layerFont.rtl ? 'rtl' : 'ltr',
                }}
                onPointerDown={e => handleLayerDrag(e, layer)}
                onClick={e => e.stopPropagation()}
                onDoubleClick={() => {
                  const val = window.prompt(t('editLayerText'), layer.text)
                  if (val != null) updateLayer(layer.id, { text: val })
                }}
              >
                {layer.text}
                {state.activeLayerId === layer.id && (
                  <>
                    <span className="layer-del" onPointerDown={e => e.stopPropagation()} onClick={() => deleteLayer(layer.id)}>✕</span>
                    <span className="layer-rotate-handle" onPointerDown={e => handleLayerRotate(e, layer)}>↻</span>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <button className="add-layer-btn" onClick={addLayer} aria-label={t('addLayer')}>＋ Aa</button>
        {state.text && (
          <>
            <div className="canvas-rail">
              <button
                className={`rail-btn ${activeCanvasTool === 'size' ? 'on' : ''}`}
                onClick={() => toggleCanvasTool('size')}
                aria-label={t('size')}
              >⇕</button>
              <button className="rail-btn" onClick={cycleAlign} aria-label={t(`align_${state.align}`)}>
                {state.align === 'right' ? '⇥' : state.align === 'left' ? '⇤' : '⇹'}
              </button>
              <button
                className={`rail-btn ${state.underline ? 'on' : ''}`}
                onClick={() => update({ underline: !state.underline })}
                aria-label={t('underline')}
              ><u>A</u></button>
              <button
                className={`rail-btn ${state.direction === 'rtl' ? 'on' : ''}`}
                onClick={() => update({ direction: state.direction === 'rtl' ? 'ltr' : 'rtl' })}
                aria-label="RTL"
              >RTL</button>
              <button className="rail-btn danger" onClick={clearAll} aria-label={t('clear')}>🗑</button>
            </div>
            {activeCanvasTool === 'size' && (
              <div className="canvas-size-slider">
                <span className="val">{state.fontSize}</span>
                <input
                  type="range"
                  min="16"
                  max="120"
                  value={state.fontSize}
                  onChange={e => update({ fontSize: +e.target.value })}
                  orient="vertical"
                />
              </div>
            )}
          </>
        )}
      </main>

      <section className="controls">
        <div className="tabs">
          {TABS.map(tb => (
            <button
              key={tb.id}
              className={`tab ${tab === tb.id ? 'active' : ''}`}
              onClick={() => setTab(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="panel">
          {tab === 'font' && (
            <>
              <div className="chip-row sub-row">
                {FONT_CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    className={`pill-tab ${fontLang === c.id ? 'active' : ''}`}
                    onClick={() => setFontLang(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="chip-row">
                {visibleFonts.map(f => (
                  <button
                    key={f.id}
                    className={`chip font-chip ${state.fontId === f.id ? 'selected' : ''}`}
                    onClick={() => update({ fontId: f.id, direction: f.rtl ? 'rtl' : 'ltr' })}
                  >
                    {f.dataUrl && (
                      <span className="del-font" onClick={e => deleteCustomFont(f.id, e)}>✕</span>
                    )}
                    <span style={{ fontFamily: f.family }}>{f.rtl ? 'ابر' : 'Aa'}</span>
                    <span className="chip-label">{f.label}</span>
                  </button>
                ))}
                <label className="chip font-chip upload-chip">
                  <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={onUploadFont} hidden />
                  <span>＋</span>
                  <span className="chip-label">{t('yourFont')}</span>
                </label>
              </div>
            </>
          )}

          {tab === 'style' && (
            <div className="style-grid">
              <button className={`toggle ${state.bold ? 'on' : ''}`} onClick={() => update({ bold: !state.bold })}><b>B</b> {t('bold')}</button>
              <button className={`toggle ${state.italic ? 'on' : ''}`} onClick={() => update({ italic: !state.italic })}><i>I</i> {t('italic')}</button>
              <button className={`toggle ${state.underline ? 'on' : ''}`} onClick={() => update({ underline: !state.underline })}><u>U</u> {t('underline')}</button>
              <button className={`toggle ${state.shadow ? 'on' : ''}`} onClick={() => update({ shadow: !state.shadow })}>🌫 {t('shadow')}</button>
              <button className={`toggle ${state.stroke ? 'on' : ''}`} onClick={() => update({ stroke: !state.stroke })}>◯ {t('stroke')}</button>
              <button className={`toggle ${state.direction === 'ltr' ? 'on' : ''}`} onClick={() => update({ direction: state.direction === 'rtl' ? 'ltr' : 'rtl' })}>↔ {state.direction === 'rtl' ? 'RTL' : 'LTR'}</button>
            </div>
          )}

          {tab === 'style' && (
            <>
              <p className="settings-label">{t('effect')}</p>
              <div className="chip-row">
                {TEXT_EFFECTS.map(fx => (
                  <button
                    key={fx.id}
                    className={`chip ${state.effect === fx.id ? 'selected' : ''}`}
                    onClick={() => update({ effect: fx.id })}
                  >
                    <span className="chip-label">{fx.label}</span>
                  </button>
                ))}
              </div>
              {state.effect === 'gradient' && (
                <div className="chip-row">
                  {TEXT_GRADIENTS.map(g => (
                    <button
                      key={g.id}
                      className={`swatch ${state.textGradient === g.id ? 'selected' : ''}`}
                      style={{ background: g.css }}
                      onClick={() => update({ textGradient: g.id })}
                      title={g.label}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'box' && (
            <div className="chip-row">
              {TEXT_BOX_STYLES.map(s => (
                <button
                  key={s.id}
                  className={`chip ${state.textBoxStyle === s.id ? 'selected' : ''}`}
                  onClick={() => update({ textBoxStyle: s.id })}
                >
                  <span className="chip-label">{s.label}</span>
                </button>
              ))}
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
            <>
              <div className="chip-row sub-row">
                {BG_CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    className={`pill-tab ${bgCategory === c.id ? 'active' : ''}`}
                    onClick={() => setBgCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="chip-row">
                {bgCategory === 'colors' && state.customBgUrl && (
                  <button
                    className={`swatch bg-swatch image-swatch ${state.bgId === 'custom-image' ? 'selected' : ''}`}
                    style={{ backgroundImage: `url(${state.customBgUrl})` }}
                    onClick={() => update({ bgId: 'custom-image' })}
                    title={t('myImage')}
                  >
                    <span className="del-font" onClick={removeBgImage}>✕</span>
                  </button>
                )}
                {bgSwatches.map(b => (
                  <button
                    key={b.id}
                    className={`swatch bg-swatch ${state.bgId === b.id ? 'selected' : ''}`}
                    style={{ background: b.css === 'transparent' ? 'repeating-conic-gradient(#3a3a3a 0% 25%, #2a2a2a 0% 50%) 50% / 10px 10px' : b.css }}
                    onClick={() => update({ bgId: b.id })}
                    title={b.label}
                  />
                ))}
                {bgCategory === 'colors' && (
                  <label className="swatch bg-swatch upload-chip" title={t('uploadImage')}>
                    <input type="file" accept="image/*" onChange={onUploadBgImage} hidden />
                    <span>＋</span>
                  </label>
                )}
              </div>
              <div className="layout-panel">
                <div className="row">
                  <span>{t('brightness')}</span>
                  <input type="range" min="50" max="150" value={state.bgFilter.brightness} onChange={e => update({ bgFilter: { ...state.bgFilter, brightness: +e.target.value } })} />
                  <span className="val">{state.bgFilter.brightness}%</span>
                </div>
                <div className="row">
                  <span>{t('contrast')}</span>
                  <input type="range" min="50" max="150" value={state.bgFilter.contrast} onChange={e => update({ bgFilter: { ...state.bgFilter, contrast: +e.target.value } })} />
                  <span className="val">{state.bgFilter.contrast}%</span>
                </div>
                <div className="row">
                  <span>{t('blur')}</span>
                  <input type="range" min="0" max="20" value={state.bgFilter.blur} onChange={e => update({ bgFilter: { ...state.bgFilter, blur: +e.target.value } })} />
                  <span className="val">{state.bgFilter.blur}</span>
                </div>
                <div className="row">
                  <span>{t('grayscale')}</span>
                  <input type="range" min="0" max="100" value={state.bgFilter.grayscale} onChange={e => update({ bgFilter: { ...state.bgFilter, grayscale: +e.target.value } })} />
                  <span className="val">{state.bgFilter.grayscale}%</span>
                </div>
              </div>
            </>
          )}

          {tab === 'templates' && (
            <div className="chip-row">
              {TEMPLATES.map(tpl => (
                <button key={tpl.id} className="chip" onClick={() => applyTemplate(tpl)}>
                  <span className="chip-label">{tpl.label}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'layout' && (
            <div className="layout-panel">
              <div className="row">
                <span>{t('size')}</span>
                <input type="range" min="16" max="120" value={state.fontSize} onChange={e => update({ fontSize: +e.target.value })} />
                <span className="val">{state.fontSize}</span>
              </div>
              <div className="row">
                <span>{t('letterSpacing')}</span>
                <input type="range" min="-4" max="20" value={state.letterSpacing} onChange={e => update({ letterSpacing: +e.target.value })} />
                <span className="val">{state.letterSpacing}</span>
              </div>
              <div className="row">
                <span>{t('lineHeight')}</span>
                <input type="range" min="0.8" max="2.4" step="0.1" value={state.lineHeight} onChange={e => update({ lineHeight: +e.target.value })} />
                <span className="val">{state.lineHeight}</span>
              </div>
              <div className="row">
                <span>{t('strokeWidth')}</span>
                <input type="range" min="0.5" max="6" step="0.5" value={state.strokeWidth} onChange={e => update({ strokeWidth: +e.target.value })} />
                <span className="val">{state.strokeWidth}</span>
              </div>
              <div className="row">
                <span>{t('opacity')}</span>
                <input type="range" min="10" max="100" value={state.opacity} onChange={e => update({ opacity: +e.target.value })} />
                <span className="val">{state.opacity}%</span>
              </div>
              <div className="row">
                <span>{t('margin')}</span>
                <input type="range" min="0" max="60" value={state.margin} onChange={e => update({ margin: +e.target.value })} />
                <span className="val">{state.margin}</span>
              </div>
              <div className="align-row">
                {['right', 'center', 'left'].map(a => (
                  <button key={a} className={`toggle ${state.align === a ? 'on' : ''}`} onClick={() => update({ align: a })}>
                    {t(`align_${a}`)}
                  </button>
                ))}
              </div>
              <p className="settings-label">{t('aspectRatio')}</p>
              <div className="chip-row">
                {ASPECT_RATIOS.map(r => (
                  <button
                    key={r.id}
                    className={`chip ${state.aspectRatio === r.id ? 'selected' : ''}`}
                    onClick={() => update({ aspectRatio: r.id })}
                  >
                    <span className="chip-label">{r.label}</span>
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
              <span>{t('save')}</span>
              <span />
            </div>
            <button className="sheet-item recommended" onClick={exportPng}>⬇ {t('saveToDevice')}</button>
            <button className="sheet-item" onClick={copyImage}>📋 {t('copyImageBtn')}</button>
            <button className="sheet-item" onClick={copyText}>🔤 {t('copyTextBtn')}</button>
            <button className="sheet-item" onClick={saveToGallery}>⭐ {t('saveToAppGallery')}</button>
          </div>
        </div>
      )}

      {showGallery && (
        <div className="sheet-overlay" onClick={() => setShowGallery(false)}>
          <div className="sheet tall" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <button className="icon-btn" onClick={() => setShowGallery(false)}>✕</button>
              <span>{t('myGallery')}</span>
              <span />
            </div>
            {saved.length === 0 && <p className="empty">{t('emptyGallery')}</p>}
            <div className="gallery-grid">
              {saved.map(entry => {
                const f = allFonts.find(x => x.id === entry.fontId) ?? allFonts[0]
                const b = ALL_BACKGROUNDS.find(x => x.id === entry.bgId) ?? ALL_BACKGROUNDS[0]
                const cardStyle = entry.bgId === 'custom-image' && entry.customBgUrl
                  ? { backgroundImage: `url(${entry.customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: b.css }
                return (
                  <div key={entry.id} className="gallery-card" style={cardStyle} onClick={() => loadEntry(entry)}>
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

      {showDonate && (
        <div className="sheet-overlay" onClick={() => setShowDonate(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <button className="icon-btn" onClick={() => setShowDonate(false)}>✕</button>
              <span>{t('donate')}</span>
              <span />
            </div>
            <p className="donate-text">{t('donateText')}</p>
            {DONATE_URL ? (
              <a className="sheet-item recommended" href={DONATE_URL} target="_blank" rel="noreferrer">
                💳 {t('payViaZibal')}
              </a>
            ) : (
              <p className="empty">{t('donateNotSet')}</p>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="sheet-overlay" onClick={() => setShowSettings(false)}>
          <div className="sheet tall" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <button className="icon-btn" onClick={() => setShowSettings(false)}>✕</button>
              <span>{t('settings')}</span>
              <span />
            </div>

            <p className="settings-label">{t('themeColor')}</p>
            <div className="chip-row">
              {THEME_COLORS.map(c => (
                <button
                  key={c}
                  className={`swatch ${appSettings.themeColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setAppSettings(s => ({ ...s, themeColor: c }))}
                />
              ))}
            </div>

            <p className="settings-label">{t('language')}</p>
            <div className="align-row">
              <button className={`toggle ${appSettings.lang === 'fa' ? 'on' : ''}`} onClick={() => setAppSettings(s => ({ ...s, lang: 'fa' }))}>فارسی</button>
              <button className={`toggle ${appSettings.lang === 'en' ? 'on' : ''}`} onClick={() => setAppSettings(s => ({ ...s, lang: 'en' }))}>English</button>
            </div>

            <p className="settings-label">{t('contact')}</p>
            <a className="sheet-item" href="https://github.com/FontWoW/FontWoW.github.io" target="_blank" rel="noreferrer">🐙 GitHub</a>
            <a className="sheet-item" href="mailto:m4tinbeigi@gmail.com">✉️ m4tinbeigi@gmail.com</a>

            <p className="settings-label">{t('version')}: 1.0.0</p>
            <button className="sheet-item" onClick={resetAppSettings}>♻ {t('resetSettings')}</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <footer className="footer">
        <a href="https://github.com/FontWoW/FontWoW.github.io" target="_blank" rel="noreferrer">{t('openSource')} ↗</a>
      </footer>
    </div>
  )
}
