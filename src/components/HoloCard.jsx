import { useRef } from 'react'

const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export default function HoloCard({ children, glow = '#e0402a' }) {
  const ref = useRef(null)

  function onMove(event) {
    const el = ref.current
    if (!el || reduceMotion()) return
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    el.style.setProperty('--rx', `${((0.5 - py) * 9).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((px - 0.5) * 11).toFixed(2)}deg`)
    el.style.setProperty('--o', '1')
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--o', '0')
  }

  return (
    <div className="holo-wrap" ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} style={{ '--glow': glow }}>
      <div className="holo-tilt">
        {children}
        <i className="holo-shine" aria-hidden="true" />
        <i className="holo-sweep" aria-hidden="true" />
      </div>
    </div>
  )
}
