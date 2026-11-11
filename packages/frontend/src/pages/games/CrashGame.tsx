import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../stores/userStore'
import { useAppStore } from '../../stores/appStore'

type Phase = 'waiting' | 'flying' | 'crashed' | 'cashedOut'

function genCrashPoint(): number {
  // House edge ~5%, exponential distribution
  const r = Math.random()
  if (r < 0.05) return 1.0
  return Math.max(1.0, parseFloat((1 / (1 - r * 0.95)).toFixed(2)))
}

const HISTORY_MAX = 10
const COUNTDOWN_S = 5

export function CrashGame() {
  const { user, fetchUser } = useUserStore()
  const { showNotification } = useAppStore()
  const [bet, setBet] = useState(100)
  const [phase, setPhase] = useState<Phase>('waiting')
  const [mult, setMult] = useState(1.0)
  const [countdown, setCountdown] = useState(COUNTDOWN_S)
  const [betPlaced, setBetPlaced] = useState(false)
  const [cashoutMult, setCashoutMult] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([3.21, 1.84, 12.5, 1.02, 7.3, 2.1, 1.0, 5.6, 1.5, 9.97])

  const crashPointRef = useRef(1.0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const phaseRef = useRef<Phase>('waiting')
  const betPlacedRef = useRef(false)

  phaseRef.current = phase
  betPlacedRef.current = betPlaced

  // Countdown then fly
  useEffect(() => {
    if (phase !== 'waiting') return
    setCountdown(COUNTDOWN_S)
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(t)
          startRound()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase])

  const startRound = () => {
    crashPointRef.current = genCrashPoint()
    startTimeRef.current = performance.now()
    setMult(1.0)
    setPhase('flying')
    setCashoutMult(null)
    animateMultiplier()
  }

  const animateMultiplier = () => {
    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000
      // multiplier grows exponentially
      const current = parseFloat(Math.pow(Math.E, elapsed * 0.6).toFixed(2))
      setMult(current)
      if (current >= crashPointRef.current) {
        crash()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const crash = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const finalMult = crashPointRef.current
    setMult(finalMult)
    setPhase('crashed')
    setHistory(h => [finalMult, ...h.slice(0, HISTORY_MAX - 1)])
    if (betPlacedRef.current) showNotification(`💥 Краш x${finalMult} — потеря ${bet} 🪙`, 'error')
    setBetPlaced(false)
    // Auto restart
    setTimeout(() => {
      setPhase('waiting')
    }, 3500)
  }, [bet])

  const cashOut = () => {
    if (phase !== 'flying' || !betPlaced) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const m = mult
    setCashoutMult(m)
    setPhase('cashedOut')
    setBetPlaced(false)
    const won = Math.round(bet * m)
    showNotification(`✅ Вышел x${m}! +${won} 🪙`, 'success')
    fetchUser()
    setTimeout(() => {
      setPhase('waiting')
    }, 2500)
  }

  const placeBet = () => {
    if (phase !== 'waiting' || betPlaced) return
    if ((user?.coins || 0) < bet) { showNotification('Недостаточно монет', 'error'); return }
    setBetPlaced(true)
    showNotification('✅ Ставка принята!', 'success')
  }

  const multColor = phase === 'crashed' ? '#EF4444'
    : phase === 'cashedOut' ? '#10B981'
    : mult >= 2 ? '#F59E0B' : '#E2E8F0'

  return (
    <div className="px-4 pb-6">
      <div className="text-center pt-3 pb-4">
        <h2 className="text-2xl font-black text-white">🚀 Краш</h2>
        <p className="text-text-muted text-sm mt-0.5">Общий раунд для всех игроков</p>
      </div>

      {/* Multiplier history */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {history.map((h, i) => (
          <div key={i} className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-black"
            style={{ background: h < 1.5 ? 'rgba(239,68,68,0.2)' : h >= 5 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)',
              color: h < 1.5 ? '#F87171' : h >= 5 ? '#F59E0B' : '#34D399', border: '1px solid currentColor' }}>
            x{h.toFixed(2)}
          </div>
        ))}
      </div>

      {/* Game screen */}
      <div className="rounded-2xl overflow-hidden mb-4 relative"
        style={{ background: 'linear-gradient(145deg, #0A0A1E, #12122A)', border: '1px solid rgba(255,255,255,0.08)', height: 200 }}>

        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" style={{ pointerEvents: 'none' }}>
          {[25, 50, 75].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />)}
          {[25, 50, 75].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />)}
        </svg>

        {/* Surfer emoji */}
        <motion.div
          className="absolute text-4xl"
          style={{ left: phase === 'crashed' ? '30%' : '15%', bottom: phase === 'crashed' ? '20%' : '30%' }}
          animate={phase === 'flying' ? { y: [-5, 5, -5] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          {phase === 'crashed' ? '💥' : '🏄'}
        </motion.div>

        {/* Multiplier big */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={phase}
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            className="text-5xl font-black tabular-nums"
            style={{ color: multColor, textShadow: `0 0 20px ${multColor}60` }}
          >
            {phase === 'crashed' ? `x${mult.toFixed(2)}` : `x${mult.toFixed(2)}`}
          </motion.div>
          <div className="text-sm mt-1 font-semibold" style={{ color: multColor }}>
            {phase === 'waiting' ? `⏳ Ставки через ${countdown}с` :
              phase === 'crashed' ? '💥 КРАШ!' :
              phase === 'cashedOut' ? `✅ Вышел x${cashoutMult?.toFixed(2)}` :
              'ЛЕТИМ! Нажми забрать'}
          </div>
        </div>

        {/* Recent multipliers labels */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {[{ label: 'Множитель', val: `x${mult.toFixed(2)}` }, { label: 'След.', val: phase === 'waiting' ? `~x${genCrashPoint().toFixed(2)}` : '?' }].map(s => (
            <div key={s.label} className="px-2 py-1 rounded-xl text-center"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[9px] text-text-muted">{s.label}</p>
              <p className="text-xs font-black text-white">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bet row */}
      <div className="mb-3 p-3.5 rounded-2xl flex items-center gap-3"
        style={{ background: 'rgba(22,22,40,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">🎁</span>
          <span className="font-bold text-yellow-400 text-lg">🪙 {bet}</span>
        </div>
        {[100, 500].map(v => (
          <button key={v} onClick={() => setBet(b => b + v)} disabled={phase !== 'waiting'}
            className="px-3 py-1.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
            +{v}
          </button>
        ))}
        <button onClick={() => setBet(b => Math.max(10, Math.round(b / 2)))} disabled={phase !== 'waiting'}
          className="px-3 py-1.5 rounded-xl text-sm font-bold disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>½</button>
      </div>

      {/* Action button */}
      {phase === 'waiting' && !betPlaced && (
        <motion.button onClick={placeBet} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
          Сделать ставку
        </motion.button>
      )}
      {phase === 'waiting' && betPlaced && (
        <div className="w-full py-4 rounded-2xl font-black text-center text-emerald-400 text-lg"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          ✅ Ставка {bet} 🪙 · ждём старта
        </div>
      )}
      {phase === 'flying' && (
        <motion.button onClick={cashOut} whileTap={{ scale: 0.97 }}
          animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: betPlaced ? 'linear-gradient(135deg,#059669,#10B981)' : 'rgba(255,255,255,0.1)', opacity: betPlaced ? 1 : 0.4 }}
          disabled={!betPlaced}>
          💰 Забрать x{mult.toFixed(2)} {betPlaced ? `= ${Math.round(bet * mult)} 🪙` : ''}
        </motion.button>
      )}
      {(phase === 'crashed' || phase === 'cashedOut') && (
        <div className="w-full py-4 rounded-2xl font-black text-center text-text-muted text-base"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          Следующий раунд через секунду...
        </div>
      )}

      <p className="text-center text-text-muted text-xs mt-3">Общий раунд · ставки за {COUNTDOWN_S}с до старта</p>
    </div>
  )
}
