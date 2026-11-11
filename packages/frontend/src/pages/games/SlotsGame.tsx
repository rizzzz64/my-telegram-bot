import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../stores/userStore'
import { useAppStore } from '../../stores/appStore'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const SYMBOLS = ['🍋', '🍊', '🍇', '🍓', '🍉', '🍒', '⭐', '💎', '7️⃣']
const REEL_SIZE = 30 // virtual items per reel
const ITEM_H = 72  // px per symbol

function buildReel(): string[] {
  const reel: string[] = []
  for (let i = 0; i < REEL_SIZE; i++) reel.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  return reel
}

function checkWin(res: string[]): { mult: number; label: string } {
  if (res[0] === res[1] && res[1] === res[2]) {
    if (res[0] === '💎') return { mult: 50, label: '💎 ДЖЕКПОТ x50!' }
    if (res[0] === '7️⃣') return { mult: 20, label: '7️⃣ СЕМЁРКИ x20!' }
    if (res[0] === '⭐') return { mult: 10, label: '⭐ ЗВЁЗДЫ x10!' }
    return { mult: 8.1, label: '3 одинаковых x8.1!' }
  }
  if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) return { mult: 1.6, label: '2 одинаковых x1.6' }
  return { mult: 0, label: '' }
}

export function SlotsGame() {
  const { user, fetchUser } = useUserStore()
  const { showNotification } = useAppStore()
  const [bet, setBet] = useState(100)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string[] | null>(null)
  const [win, setWin] = useState<{ mult: number; label: string } | null>(null)
  const [reels] = useState(() => [buildReel(), buildReel(), buildReel()])
  const reelRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]
  const posRefs = [useRef(0), useRef(0), useRef(0)]
  const history = useRef<{ mult: number }[]>([])

  const spin = async () => {
    if (spinning || (user?.coins || 0) < bet) return
    setSpinning(true)
    setResult(null)
    setWin(null)

    // Determine result
    const finalSyms: string[] = [0, 1, 2].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
    const winInfo = checkWin(finalSyms)

    // Animate each reel with stagger
    const reelIndices: number[] = [0, 1, 2]
    reelIndices.forEach((i: number) => {
      const el = reelRefs[i].current
      if (!el) return
      const targetIdx = reels[i].indexOf(finalSyms[i]) !== -1
        ? reels[i].lastIndexOf(finalSyms[i])
        : Math.floor(Math.random() * REEL_SIZE)
      reels[i][targetIdx] = finalSyms[i]
      const spins = (5 + i) * REEL_SIZE + targetIdx
      const totalPx = spins * ITEM_H
      const start = posRefs[i].current
      const duration = 2.0 + i * 0.4
      const startTime = performance.now()

      const ease = (t: number) => 1 - Math.pow(1 - t, 4)
      const animate = (now: number) => {
        const elapsed = (now - startTime) / 1000
        const t = Math.min(elapsed / duration, 1)
        const delta = ease(t) * totalPx
        el.style.transform = `translateY(${-(start + delta) % (REEL_SIZE * ITEM_H)}px)`
        if (t < 1) requestAnimationFrame(animate)
        else {
          posRefs[i].current = (start + totalPx) % (REEL_SIZE * ITEM_H)
          if (i === 2) {
            setResult(finalSyms)
            setWin(winInfo)
            history.current = [{ mult: winInfo.mult }, ...history.current.slice(0, 9)]
            setSpinning(false)
            fetchUser()
          }
        }
      }
      requestAnimationFrame(animate)
    })
  }

  const canSpin = !spinning && (user?.coins || 0) >= bet

  return (
    <div className="px-4 pb-6">
      {/* Title */}
      <div className="text-center pt-3 pb-5">
        <h2 className="text-2xl font-black text-white">🎰 Слоты</h2>
        <p className="text-text-muted text-sm mt-1">3 одинаковых — x8.1 · 2 одинаковых — x1.6</p>
      </div>

      {/* Win alert */}
      <AnimatePresence>
        {win && win.mult > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            className="mb-4 py-2.5 px-4 rounded-2xl text-center font-black text-lg"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.15))', border: '1px solid rgba(16,185,129,0.4)' }}
          >
            <span className="text-emerald-400">{win.label}</span>
            <p className="text-sm text-text-muted font-normal mt-0.5">+{(bet * win.mult).toFixed(0)} 🪙</p>
          </motion.div>
        )}
        {win && win.mult === 0 && result && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mb-4 py-2 px-4 rounded-2xl text-center text-sm text-text-muted"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Не повезло — попробуй ещё!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot machine */}
      <div
        className="rounded-2xl overflow-hidden mb-5 mx-auto"
        style={{ background: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 320 }}
      >
        {/* Reels */}
        <div className="flex justify-center gap-2 p-4 relative">
          {/* Highlight strip */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[72px] rounded-xl pointer-events-none z-10"
            style={{ background: 'rgba(124,58,237,0.08)', border: '2px solid rgba(124,58,237,0.3)' }} />

          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl" style={{ width: 80, height: 216 }}>
              <div ref={reelRefs[i]} style={{ willChange: 'transform' }}>
                {reels[i].concat(reels[i]).map((sym, j) => (
                  <div key={j}
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 80, height: ITEM_H, fontSize: 40 }}>
                    {sym}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* History row */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {history.current.map((h, i) => (
            <div key={i} className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: h.mult > 1 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)', color: h.mult > 1 ? '#10B981' : '#F87171' }}>
              {h.mult > 0 ? `x${h.mult}` : 'miss'}
            </div>
          ))}
        </div>
      </div>

      {/* Bet controls */}
      <div className="mb-4 p-4 rounded-2xl" style={{ background: 'rgba(22,22,40,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-text-muted text-sm">Ставка</span>
          <span className="font-bold text-yellow-400">🪙 {bet.toLocaleString('ru-RU')}</span>
        </div>
        <div className="flex gap-2">
          {[50, 100, 500, 1000].map(v => (
            <button key={v} onClick={() => setBet(v)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={bet === v
                ? { background: 'linear-gradient(135deg,#7C3AED,#2563EB)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setBet(b => Math.max(10, Math.round(b / 2)))}
            className="flex-1 py-1.5 rounded-xl text-sm text-text-secondary" style={{ background: 'rgba(255,255,255,0.05)' }}>½</button>
          <button onClick={() => setBet(b => b * 2)}
            className="flex-1 py-1.5 rounded-xl text-sm text-text-secondary" style={{ background: 'rgba(255,255,255,0.05)' }}>x2</button>
          <button onClick={() => setBet(b => b + 100)}
            className="flex-1 py-1.5 rounded-xl text-sm text-text-secondary" style={{ background: 'rgba(255,255,255,0.05)' }}>+100</button>
        </div>
      </div>

      {/* Spin button */}
      <motion.button
        onClick={spin} whileTap={{ scale: 0.97 }}
        disabled={!canSpin}
        className="w-full py-4 rounded-2xl font-black text-white text-lg disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}
      >
        {spinning ? <LoadingSpinner size="sm" /> : `🎰 Крутить за 🪙 ${bet}`}
      </motion.button>

      <p className="text-center text-text-muted text-xs mt-3">
        3 одинаковых — x8.1 · 2 одинаковых — x1.6
      </p>
    </div>
  )
}
