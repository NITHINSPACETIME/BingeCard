import { ArrowRight, Clock3, Link2, LoaderCircle, Search } from 'lucide-react'

const QUICK_SEARCHES = ['Solo Leveling', 'One Piece', 'Frieren', 'Omniscient Reader']

export default function SearchPanel({ query, setQuery, onSearch, isLoading, results, onSelect, error, recent = [] }) {
  function submit(event) {
    event.preventDefault()
    if (query.trim()) onSearch(query)
  }

  function quickSearch(title) {
    setQuery(title)
    onSearch(title)
  }

  return (
    <section className="search-shell" aria-label="Find anime or manga">
      <form className="search-form" onSubmit={submit}>
        <label className="search-input-wrap">
          <Search size={21} aria-hidden="true" />
          <span className="sr-only">Anime or manga title or URL</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search anime, manga, or paste a link"
            aria-label="Anime or manga title or URL"
            autoComplete="off"
          />
          {query && <kbd>Enter</kbd>}
        </label>
        <button className="button button-primary search-submit" disabled={isLoading || !query.trim()} type="submit">
          {isLoading ? <LoaderCircle className="spin" size={19} /> : <ArrowRight size={19} />}
          {isLoading ? 'Searching…' : 'Build my plan'}
        </button>
      </form>

      <div className="search-support-row">
        <div className="quick-searches">
          <span>Try:</span>
          {QUICK_SEARCHES.map((title) => (
            <button type="button" key={title} onClick={() => quickSearch(title)}>{title}</button>
          ))}
        </div>
        <div className="sources"><Link2 size={14} /> AniList + MAL links work</div>
      </div>

      {error && <div className="search-error" role="alert">{error}</div>}

      {results.length > 0 && (
        <div className="results-panel">
          <div className="results-heading">
            <span>Choose the right version</span>
            <small>{results.length} matches</small>
          </div>
          <div className="results-list">
            {results.map((media) => (
              <button className="result-item" type="button" key={media.id} onClick={() => onSelect(media)}>
                <img src={media.cover} alt="" />
                <span className="result-copy">
                  <strong>{media.title}</strong>
                  <small>{[media.type === 'ANIME' ? 'Anime' : media.country === 'KR' ? 'Manhwa' : 'Manga', media.format?.replaceAll('_', ' '), media.year].filter(Boolean).join(' · ')}</small>
                </span>
                <span className="result-score">{media.score ? `${(media.score / 10).toFixed(1)}` : '—'}</span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && results.length === 0 && !error && (
        <div className="recent-row">
          <Clock3 size={14} />
          <span>Recent:</span>
          {recent.slice(0, 3).map((item) => (
            <button type="button" key={item.id} onClick={() => onSelect(item)}>{item.title}</button>
          ))}
        </div>
      )}
    </section>
  )
}
