import { forwardRef } from 'react'
import { CalendarDays, Clock3, QrCode, Star } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { formatDuration } from '../lib/calculator'
import { buildShareProfile, getThemeAccent } from '../lib/shareProfile'

const BingeCard = forwardRef(function BingeCard({ media, stats, theme }, ref) {
  const unit = media.type === 'ANIME' ? 'episodes' : 'chapters'
  const accent = getThemeAccent(theme, media.coverColor)
  const shareProfile = buildShareProfile(media, stats)
  const creator = media.type === 'ANIME' ? media.studio : media.creator
  const cardUrl = typeof window === 'undefined' ? 'https://bingecard.app' : window.location.href

  return (
    <article className={`binge-card share-card theme-${theme} rarity-${shareProfile.rarity.toLowerCase()}`} style={{ '--accent': accent }} ref={ref} id="share-card">
      <div className="card-art" style={{ backgroundImage: `url(${media.banner || media.cover})` }} />
      <div className="card-grain" />

      <header className="card-header">
        <div className="card-brand"><span>B</span><strong>BingeCard</strong></div>
        <div className="rarity-badge"><i /> {shareProfile.rarity}</div>
      </header>

      <section className="card-hero">
        <div className="card-set-number">NO. {String(media.id).padStart(6, '0')} · {media.format?.replaceAll('_', ' ') || media.type} · {shareProfile.percentile.toUpperCase()}</div>
        <div className="card-title-row">
          <div>
            <h2>{media.title}</h2>
            <p>{creator && <b>{creator}</b>}{media.year && <span>{media.year}</span>}{media.score && <span><Star fill="currentColor" /> {(media.score / 10).toFixed(1)}</span>}</p>
          </div>
          <div className="index-gem"><small>BINGE</small><strong>{stats.profile.index}</strong><span>INDEX</span></div>
        </div>
      </section>

      {!stats.isReady ? (
        <section className="card-locked">
          <span>PLAN INCOMPLETE</span>
          <strong>Add the current {media.type === 'ANIME' ? 'episode' : 'chapter'} total</strong>
          <p>This ongoing title has no total on AniList yet.</p>
        </section>
      ) : (
        <section className="card-plan">
          <div className="card-finish">
            <span>{stats.remaining === 0 ? 'CURRENT STATUS' : 'PLANNED FINISH'}</span>
            <strong>{stats.finishLabel}</strong>
            <p>{stats.dailyUnits} {unit} · {stats.scheduleLabel} · {formatDuration(stats.dailyMinutes, true)} per session</p>
          </div>

          <div className="card-stats">
            <div><Clock3 /><span><small>TIME LEFT</small><strong>{formatDuration(stats.remainingMinutes)}</strong></span></div>
            <div><CalendarDays /><span><small>STORY LEFT</small><strong>{stats.remaining.toLocaleString()} {unit}</strong></span></div>
            <div><span><small>PACE</small><strong>{stats.profile.intensity}/100</strong></span></div>
          </div>

          <div className="card-fun" title="Fun equivalent">{shareProfile.funLine}</div>

          <div className="card-progress">
            <span>PROGRESS</span><i><b style={{ width: `${stats.completionPercent}%` }} /></i><strong>{stats.completionPercent}%</strong>
          </div>

          <div className="card-persona">
            <div><small>BINGE TYPE</small><strong>{shareProfile.zodiac.name}</strong><span>{shareProfile.popularityTier}</span></div>
            <div><small>COMMITMENT</small><strong>{stats.commitment.rank}</strong><span>{stats.commitment.archetype}</span></div>
          </div>
        </section>
      )}

      <section className="genre-dna">
        <div>{shareProfile.dna.map(({ genre, color }) => <i key={genre} style={{ '--genre': color }} title={genre} />)}</div>
        <span>{shareProfile.dna.map(({ genre }) => genre).join(' · ') || 'No genre data'}</span>
      </section>

      <footer className="card-footer">
        <div><b>bingecard.app</b><span>{shareProfile.pairing}</span></div>
        <div className="qr-wrap"><QRCodeSVG value={cardUrl} size={48} bgColor="transparent" fgColor="currentColor" level="M" /><QrCode /></div>
      </footer>
    </article>
  )
})

export default BingeCard
