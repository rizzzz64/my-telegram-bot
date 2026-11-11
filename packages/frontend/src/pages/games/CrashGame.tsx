import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../stores/userStore'
import { useAppStore } from '../../stores/appStore'
import { sounds } from '../../utils/sounds'
import { api } from '../../utils/api'

type Phase = 'waiting' | 'flying' | 'crashed' | 'cashedOut'

function genCrashPoint(): number {
  const r = Math.random()
  if (r < 0.05) return 1.0
  return Math.max(1.0, parseFloat((1 / (1 - r * 0.95)).toFixed(2)))
}

const HISTORY_MAX = 10
const COUNTDOWN_S = 5
const W = 300; const H = 180

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
  const [shake, setShake] = useState(false)
  const [pathPoints, setPathPoints] = useState<{x:number;y:number}[]>([])
  const [apiPending, setApiPending] = useState(false)

  const crashPointRef = useRef(1.0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const phaseRef = useRef<Phase>('waiting')
  const betPlacedRef = useRef(false)

  phaseRef.current = phase
  betPlacedRef.current = betPlaced

  // Rocket position from multiplier
  const getRocketPos = (m: number) => {
    const progress = Math.min(1, (m - 1) / 8)
    const x = 20 + progress * (W - 60)
    const y = H - 30 - progress * (H - 50)
    return { x, y }
  }

  useEffect(() => {
    if (phase !== 'waiting') return
    setCountdown(COUNTDOWN_S)
    setPathPoints([])
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); startRound(); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase])

  const startRound = () => {
    crashPointRef.current = genCrashPoint()
    startTimeRef.current = performance.now()
    setMult(1.0)
    setPathPoints([{ x: 20, y: H - 30 }])
    setPhase('flying')
    setCashoutMult(null)
    animateMultiplier()
  }

  const animateMultiplier = () => {
    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000
      const current = parseFloat(Math.pow(Math.E, elapsed * 0.6).toFixed(2))
      setMult(current)
      const pos = getRocketPos(current)
      setPathPoints(pts => {
        const last = pts[pts.length - 1]
        if (!last || Math.abs(pos.x - last.x) > 4) return [...pts.slice(-40), pos]
        return pts
      })
      if (current >= crashPointRef.current) { crash(); return }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const crash = useCallback(async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const finalMult = crashPointRef.current
    setMult(finalMult)
    setPhase('crashed')
    setShake(true)
    setTimeout(() => setShake(false), 600)
    setHistory(h => [finalMult, ...h.slice(0, HISTORY_MAX - 1)])
    sounds.crash()
    if (betPlacedRef.current) {
      showNotification(`💥 Краш x${finalMult} — потеря ${bet} 🪙`, 'error')
      // Record loss via API (bet already deducted optimistically)
      try {
        await api.post('/games/crash', { bet, won: false, multiplier: finalMult })
      } catch {
        await fetchUser()
      }
    }
    setBetPlaced(false)
    setTimeout(() => setPhase('waiting'), 3500)
  }, [bet, fetchUser])

  const cashOut = async () => {
    if (phase !== 'flying' || !betPlaced || apiPending) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const m = mult
    setCashoutMult(m)
    setPhase('cashedOut')
    setBetPlaced(false)
    const won = Math.round(bet * m)
    sounds.cashout()
    showNotification(`✅ Вышел x${m}! +${won} 🪙`, 'success')
    // Credit winnings via API
    setApiPending(true)
    try {
      const res = await api.post<{ coins: number; tickets: number }>('/games/crash', { bet, won: true, multiplier: m })
      useUserStore.getState().updateBalance(res.coins, res.tickets)
    } catch {
      // If API fails, still refresh user balance
      await fetchUser()
    } finally {
      setApiPending(false)
    }
    setTimeout(() => setPhase('waiting'), 2500)
  }

  const placeBet = async () => {
    if (phase !== 'waiting' || betPlaced || apiPending) return
    if ((user?.coins || 0) < bet) { showNotification('Недостаточно монет', 'error'); return }
    sounds.bet()
    // Optimistic UI update — deduct bet from display balance
    const currentCoins = useUserStore.getState().user?.coins || 0
    const currentTickets = useUserStore.getState().user?.tickets || 0
    useUserStore.getState().updateBalance(currentCoins - bet, currentTickets)
    setBetPlaced(true)
    showNotification('✅ Ставка принята!', 'success')
  }

  const multColor = phase === 'crashed' ? '#EF4444'
    : phase === 'cashedOut' ? '#10B981'
    : mult >= 2 ? '#F59E0B' : '#E2E8F0'

  const rocketPos = getRocketPos(mult)
  const rocketAngle = pathPoints.length >= 2
    ? Math.atan2(
        -(pathPoints[pathPoints.length-1].y - pathPoints[pathPoints.length-2].y),
        pathPoints[pathPoints.length-1].x - pathPoints[pathPoints.length-2].x
      ) * 180 / Math.PI
    : 45

  const svgPath = pathPoints.length > 1
    ? 'M ' + pathPoints.map(p => `${p.x} ${p.y}`).join(' L ')
    : ''

  return (
    <div className="px-4 pb-6">
      <div className="text-center pt-3 pb-4">
        <h2 className="text-2xl font-black text-white">🚀 Краш</h2>
        <p className="text-text-muted text-sm mt-0.5">Общий раунд для всех игроков</p>
      </div>

      {/* History */}
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
      <motion.div
        animate={shake ? { x: [-6,6,-4,4,-2,2,0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden mb-4 relative"
        style={{ background: 'linear-gradient(145deg, #050510, #0A0A20)', border: '1px solid rgba(255,255,255,0.08)', height: H + 20 }}
      >
        {/* Stars background */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ width: i%3===0?2:1, height: i%3===0?2:1, background:'white', opacity: 0.3+Math.random()*0.4,
              left:`${5+i*4.5}%`, top:`${10+((i*37)%70)}%` }} />
        ))}

        {/* SVG trajectory line */}
        <svg className="absolute inset-0" width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {/* Grid lines */}
          {[25,50,75].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#4B5563" strokeWidth="0.5" strokeDasharray="4 4" />)}
          {/* Trajectory */}
          {svgPath && (
            <path d={svgPath} fill="none"
              stroke={phase === 'crashed' ? '#EF4444' : phase === 'cashedOut' ? '#10B981' : '#8B5CF6'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 4px ${phase === 'crashed' ? '#EF4444' : '#8B5CF6'})` }}
            />
          )}
          {/* Exhaust trail */}
          {phase === 'flying' && pathPoints.slice(-5).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3-i*0.5} fill="#F97316" opacity={(5-i)*0.12}/>
          ))}
        </svg>

        {/* Rocket */}
        <AnimatePresence>
          {phase !== 'waiting' && (
            <motion.div
              className="absolute text-3xl select-none"
              style={{
                left: phase === 'crashed' ? rocketPos.x : rocketPos.x,
                top: phase === 'crashed' ? rocketPos.y : rocketPos.y,
                transform: `translate(-50%, -50%) rotate(${phase === 'crashed' ? 90 : -rocketAngle}deg)`,
                filter: phase === 'crashed' ? 'none' : 'drop-shadow(0 0 8px rgba(139,92,246,0.8))',
                transformOrigin: 'center',
                transition: 'transform 0.1s ease',
              }}
              animate={phase === 'crashed' ? { scale: [1, 2, 0], opacity: [1, 0.5, 0] } : {}}
              transition={phase === 'crashed' ? { duration: 0.4 } : {}}
            >
              {phase === 'crashed' ? '💥' : '🚀'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting launch pad */}
        {phase === 'waiting' && (
          <div className="absolute bottom-3 left-6 flex flex-col items-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-3xl">🚀</motion.div>
            <div className="w-8 h-1 rounded-full mt-1" style={{ background: 'rgba(139,92,246,0.4)' }} />
          </div>
        )}

        {/* Multiplier center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div key={`${phase}-${Math.floor(mult*10)}`}
            className="text-5xl font-black tabular-nums"
            style={{ color: multColor, textShadow: `0 0 24px ${multColor}80` }}
          >
            x{mult.toFixed(2)}
          </motion.div>
          <div className="text-sm mt-1 font-semibold" style={{ color: multColor }}>
            {phase === 'waiting' ? `⏳ Старт через ${countdown}с`
              : phase === 'crashed' ? '💥 КРАШ!'
              : phase === 'cashedOut' ? `✅ Вышел x${cashoutMult?.toFixed(2)}`
              : '🚀 ЛЕТИМ! Нажми забрать'}
          </div>
        </div>
      </motion.div>

      {/* Bet row */}
      <div className="mb-3 p-3.5 rounded-2xl flex items-center gap-3"
        style={{ background: 'rgba(22,22,40,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="font-bold text-yellow-400 text-lg flex-1">🪙 {bet}</span>
        {[100, 500].map(v => (
          <button key={v} onClick={() => setBet(b => b + v)} disabled={phase !== 'waiting'}
            className="px-3 py-1.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>+{v}</button>
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
          🚀 Сделать ставку
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
          animate={{ scale: [1, 1.03, 1], boxShadow: ['0 0 0px #10B981', '0 0 20px #10B981', '0 0 0px #10B981'] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: betPlaced ? 'linear-gradient(135deg,#059669,#10B981)' : 'rgba(255,255,255,0.1)', opacity: betPlaced ? 1 : 0.4 }}
          disabled={!betPlaced}>
          💰 Забрать x{mult.toFixed(2)} {betPlaced ? `= ${Math.round(bet * mult)} 🪙` : ''}
        </motion.button>
      )}
      {(phase === 'crashed' || phase === 'cashedOut') && (
        <div className="w-full py-4 rounded-2xl font-black text-center text-text-muted"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          Следующий раунд через секунду...
        </div>
      )}

      <p className="text-center text-text-muted text-xs mt-3">Общий раунд · ставки за {COUNTDOWN_S}с до старта</p>
    </div>
  )
}
