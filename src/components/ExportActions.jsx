import { useState } from 'react'
import { Check, Copy, Download, LoaderCircle, MessageSquareShare, Share2 } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { CARD_THEMES, getThemeAccent } from '../lib/shareProfile'
import { formatDuration } from '../lib/calculator'

function safeFilename(title) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'binge'}-bingecard.png`
}

const THEME_BG = { paper: '#eee9df', midnight: '#090b16', sakura: '#171019', shonen: '#140b08', ocean: '#07141c', source: '#0b0e14' }

export default function ExportActions({ cardRef, media, stats, theme, setTheme, onToast, canExport = true }) {
  const [working, setWorking] = useState('')

  async function renderCard() {
    if (!cardRef.current) throw new Error('Card is not ready')
    if (document.fonts?.ready) {
      try {
        await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
      } catch { /* fonts optional */ }
    }
    return toBlob(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: THEME_BG[theme] || '#0b0d12',
      style: { transform: 'none' },
    })
  }

  async function download() {
    setWorking('download')
    try {
      const blob = await renderCard()
      if (!blob) throw new Error('Image generation failed')
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.download = safeFilename(media.title)
      anchor.href = url
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      onToast('Your BingeCard has been downloaded.')
    } catch {
      onToast('Export was blocked by the cover image. Try again or choose another title.', true)
    } finally {
      setWorking('')
    }
  }

  async function copy() {
    setWorking('copy')
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem) throw new Error('Clipboard images unsupported')
      const blob = await renderCard()
      if (!blob) throw new Error('empty')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      onToast('Card copied. Paste it into any chat or post.')
    } catch {
      onToast('Image copy is not supported here — downloading it instead.')
      await download()
    } finally {
      setWorking('')
    }
  }

  function redditText() {
    if (!stats?.isReady) return `${media.title} — my BingeCard`
    const unit = media.type === 'ANIME' ? 'episode' : 'chapter'
    const left = `${stats.remaining.toLocaleString()} ${unit}${stats.remaining === 1 ? '' : 's'} left`
    return `It takes ${formatDuration(stats.remainingMinutes)} to finish ${media.title} (${left}, finishing ${stats.finishLabel}) — what's your pace?`
  }

  async function copyReddit() {
    const text = `${redditText()}\n${window.location.href}`
    try {
      await navigator.clipboard.writeText(text)
      onToast('Reddit-ready text copied.')
    } catch {
      onToast('Could not copy text in this browser.', true)
    }
  }

  function shareX() {
    const text = encodeURIComponent(redditText())
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,width=550,height=450')
  }

  function shareReddit() {
    const title = encodeURIComponent(redditText())
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.reddit.com/submit?title=${title}&url=${url}`, '_blank', 'noopener')
  }

  async function share() {
    const shareData = { title: `${media.title} — my BingeCard`, text: redditText(), url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(window.location.href)
        onToast('Share link copied.')
      }
    } catch (error) {
      if (error.name !== 'AbortError') onToast('Could not open sharing. Copy the page URL instead.', true)
    }
  }

  return (
    <div className="export-panel panel">
      <div className="theme-picker">
        <div><strong>Card style</strong><span>6 finishes · saved on this device</span></div>
        <div className="swatches swatches-grid" role="group" aria-label="Card style">
          {CARD_THEMES.map((option) => (
            <button type="button" aria-pressed={theme === option.id} className={theme === option.id ? 'active' : ''} key={option.id} onClick={() => setTheme(option.id)} title={option.hint}>
              <i style={{ background: option.id === 'source' ? getThemeAccent('source', media.coverColor) : option.swatch }} />
              <span>{option.label}</span>
              {theme === option.id && <Check size={13} />}
            </button>
          ))}
        </div>
      </div>
      <div className="export-buttons">
        <button className="button button-primary" type="button" onClick={download} disabled={Boolean(working) || !canExport}>
          {working === 'download' ? <LoaderCircle className="spin" size={19} /> : <Download size={19} />} Download PNG
        </button>
        <button className="button button-secondary" type="button" onClick={copy} disabled={Boolean(working) || !canExport}>
          {working === 'copy' ? <LoaderCircle className="spin" size={19} /> : <Copy size={19} />} Copy image
        </button>
        <button className="button button-secondary" type="button" onClick={copyReddit} disabled={!canExport}>
          <MessageSquareShare size={18} /> Copy Reddit text
        </button>
        <div className="share-row">
          <button className="button button-ghost" type="button" onClick={shareX}>Post to X</button>
          <button className="button button-ghost" type="button" onClick={shareReddit}>Post to Reddit</button>
          <button className="button button-ghost" type="button" onClick={share}><Share2 size={16} /> More</button>
        </div>
      </div>
      <small className="export-hint">{canExport ? 'High-resolution 4:5 PNG · bingecard.app watermark' : 'Add the current total to unlock export'}</small>
    </div>
  )
}
