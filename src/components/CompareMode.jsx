import { useMemo, useRef, useState } from 'react'
import { ArrowRight, LoaderCircle, Swords, X } from 'lucide-react'
import { searchMedia, fetchMediaById, prefetchMediaById } from '../lib/anilist'
import { calculateStats, compareStats, formatDuration } from '../lib/calculator'

export default function CompareMode({ primaryMedia, primarySettings, onToast }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [second, setSecond] = useState(null)
  const [loading, setLoading] = useState(false)
  const requestRef = useRef(null)

  const primaryStats = useMemo(
    () => (primaryMedia ? calculateStats(primaryMedia, primarySettings) : null),
    [primaryMedia, primarySettings],
  )
  const secondStats = useMemo(() => (second ? calculateStats(second, primarySettings) : null), [second, primarySettings])
  const verdict = useMemo(
    () => (primaryStats && secondStats ? compareStats(primaryStats, secondStats) : null),
    [primaryStats, secondStats],
  )

  async function pickSecond(media) {
    setResults([])
    setQuery(media.title)
    if (!media?.isPartial) {
      setSecond(media)
      return
    }
    setLoading(true)
    try {
      setSecond(await fetchMediaById(media.id, media.type))
    } catch (error) {
      onToast?.(error.message || 'Could not load that title.', true)
    } finally {
      setLoading(false)
    }
  }

  async function searchSecond(event) {
    event?.preventDefault()
    if (!query.trim()) return
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    try {
      const matches = await searchMedia(query, controller.signal)
      if (!matches.length) onToast?.('No match for the second title.', true)
      else if (matches.length === 1) pickSecond(matches[0])
      else setResults(matches)
    } catch (error) {
      if (error.name !== 'AbortError') onToast?.(error.message || 'Second search failed.', true)
    } finally {
      setLoading(false)
    }
  }

  if (!primaryMedia) return null

  return (
    <section className="compare-block panel" aria-label="Compare two series">
      <div className="compare-head">
        <span><Swords size={17} /> Compare mode</span>
        <button type="button" className="button button-ghost button-sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Hide compare' : '⚔️ Compare two series'}
        </button>
      </div>
      {open && (
        <div className="compare-body">
          <p className="compare-sub">Same daily pace applied to both — perfect Reddit bait: which is the bigger commitment?</p>
          <form className="search-form search-form-slim" onSubmit={searchSecond}>
            <label className="search-input-wrap">
              <span className="sr-only">Second title</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Second title — e.g. Naruto" aria-label="Second title" />
            </label>
            <button className="button button-secondary" type="submit" disabled={loading || !query.trim()}>
              {loading ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />} Find
            </button>
          </form>
          {results.length > 0 && (
            <div className="compare-results">
              {results.map((media) => (
                <button key={`${media.type}-${media.id}`} type="button" onClick={() => pickSecond(media)} onMouseEnter={() => prefetchMediaById(media)} onFocus={() => prefetchMediaById(media)}>
                  <img src={media.cover} alt="" loading="lazy" />
                  <span><strong>{media.title}</strong><small>{media.type} · {media.score ? (media.score / 10).toFixed(1) : '—'}</small></span>
                </button>
              ))}
            </div>
          )}
          {second && secondStats && primaryStats?.isReady && secondStats.isReady && (
            <div className="compare-grid">
              <div><small>{primaryMedia.title}</small><strong>{formatDuration(primaryStats.remainingMinutes)}</strong><span>{primaryStats.remaining.toLocaleString()} left</span></div>
              <div className="vs">VS</div>
              <div><small>{second.title}</small><strong>{formatDuration(secondStats.remainingMinutes)}</strong><span>{secondStats.remaining.toLocaleString()} left</span></div>
              {verdict && (
                <p className="compare-verdict">
                  {(verdict.longerIsA ? primaryMedia.title : second.title)} takes <b>{verdict.ratioLabel} longer</b> ({verdict.deltaLabel} more).
                </p>
              )}
              <button type="button" className="compare-clear" onClick={() => { setSecond(null); setQuery(''); setResults([]) }}>
                <X size={14} /> Clear second title
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
