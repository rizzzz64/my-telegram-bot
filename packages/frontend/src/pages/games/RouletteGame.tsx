import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../stores/userStore'
import { useAppStore } from '../../stores/appStore'

type Color = 'red' | 'black' | 'green'
type Phase = 'betting' | 'spinning' | 'result'

interface BetEntry { color: Color; amount: number }

const MULTIPLIERS: Record<Color, number> = { red: 2, black: 2, green: 14 }
const COLOR_LABEL: Record<Color, string> = { red: 'Красное', black: 'Чёрное', green: '0 Зелёное' }

// Roulette wheel: 36 numbers + 0
const SECTORS: { n: number; color: Color }[] = ([
  { n: 0, color: 'green' as Color },
  ...Array.from({ length: 18 }, (_, i): { n: number; color: Color } => ({ n: i * 2 + 1, color: 'red' })),
  ...Array.from({ length: 18 }, (_, i): { n: number; color: Color } => ({ n: i * 2 + 2, color: 'black' })),
] as { n: number; color: Color }[]).sort(() => Math.random() - 0.5)

function spinAngle(result: { n: number; color: Color }, sectors: typeof SECTORS) {
  const idx = sectors.findIndex(s => s.n === result.n && s.color === result.color)
  const sectorAngle = 360 / sectors.length
  const targetAngle = idx * sectorAngle + sectorAngle / 2
  return 360 * 8 + (360 - targetAngle) // 8 full rotations + land on target
}

export function RouletteGame() {
  const { user, fetchUser } = useUserStore()
  const { showNotification } = useAppStore()
  const [phase, setPhase] = useState<Phase>('betting')
  const [bet, setBet] = useState(100)
  const [bets, setBets] = useState<BetEntry[]>([])
  const [result, setResult] = useState<{ n: number; color: Color } | null>(null)
  const [wheelRot, setWheelRot] = useState(0)
  const accumRef = useRef(0)
  const history = useRef<{ color: Color; n: number }[]>([
    { color: 'red', n: 7 }, { color: 'black', n: 22 }, { color: 'green', n: 0 },
    { color: 'red', n: 5 }, { color: 'black', n: 18 },
  ])

  const addBet = (color: Color) => {
    if ((user?.coins || 0) < bet) { showNotification('Недостаточно монет', 'error'); return }
    setBets(b => {
      const existing = b.find(x => x.color === color)
      if (existing) return b.map(x => x.color === color ? { ...x, amount: x.amount + bet } : x)
      return [...b, { color, amount: bet }]
    })
  }

  const totalBet = bets.reduce((s, b) => s + b.amount, 0)

  const spin = () => {
    if (bets.length === 0 || phase !== 'betting') return
    if ((user?.coins || 0) < totalBet) { showNotification('Недостаточно монет', 'error'); return }

    setPhase('spinning')
    // Determine result
    const r = Math.random()
    const color: Color = r < 1 / 37 ? 'green' : r < 19 / 37 ? 'red' : 'black'
    const nums = SECTORS.filter(s => s.color === color)
    const res = nums[Math.floor(Math.random() * nums.length)]

    const targetAngle = spinAngle(res, SECTORS)
    const newAccum = accumRef.current + targetAngle
    accumRef.current = newAccum

    setWheelRot(newAccum)
    setResult(res)

    setTimeout(() => {
      setPhase('result')
      history.current = [res, ...history.current.slice(0, 9)]
      const wonBet = bets.find(b => b.color === res.color)
      if (wonBet) {
        const payout = Math.round(wonBet.amount * MULTIPLIERS[res.color])
        showNotification(`🎉 ${res.color === 'green' ? '0!' : `Выпало ${res.n}`} +${payout} 🪙`, 'success')
      } else {
        showNotification(`💥 Выпало ${res.n} — не угадал`, 'error')
      }
      fetchUser()
    }, 4500)
  }

  const reset = () => {
    setBets([])
    setResult(null)
    setPhase('betting')
  }

  return (
    <div className="px-4 pb-6">
      <div className="text-center pt-3 pb-4">
        <h2 className="text-2xl font-black text-white">🎡 Рулетка</h2>
        <p className="text-text-muted text-sm mt-0.5">Только живые игроки · Шанс = доля в банке</p>
      </div>

      {/* History */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {history.current.map((h, i) => (
          <div key={i} className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: h.color === 'green' ? '#059669' : h.color === 'red' ? '#EF4444' : '#1E293B',
              color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
            {h.n}
          </div>
        ))}
      </div>

      {/* Wheel */}
      <div className="flex justify-center mb-5 relative">
        {/* Fixed arrow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: -4 }}>
          <div className="w-0 h-0" style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '20px solid #F59E0B' }} />
        </div>

        <motion.div
          className="relative rounded-full overflow-hidden"
          style={{ width: 220, height: 220, border: '4px solid rgba(255,255,255,0.15)' }}
          animate={{ rotate: wheelRot }}
          transition={phase === 'spinning' ? { duration: 4, ease: [0.17, 0.67, 0.12, 0.99] } : { duration: 0 }}
        >
          <svg viewBox="0 0 200 200" width="220" height="220">
            {SECTORS.map((s, i) => {
              const angle = 360 / SECTORS.length
              const startA = (i * angle - 90) * Math.PI / 180
              const endA = ((i + 1) * angle - 90) * Math.PI / 180
              const x1 = 100 + 100 * Math.cos(startA)
              const y1 = 100 + 100 * Math.sin(startA)
              const x2 = 100 + 100 * Math.cos(endA)
              const y2 = 100 + 100 * Math.sin(endA)
              const fill = s.color === 'green' ? '#059669' : s.color === 'red' ? '#EF4444' : '#1E293B'
              return (
                <path key={i}
                  d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                  fill={fill} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              )
            })}
            {/* Center circle */}
            <circle cx="100" cy="100" r="30" fill="#0A0A1E" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <text x="100" y="106" textAnchor="middle" fill="#8B5CF6" fontSize="12" fontWeight="bold">GIFT</text>
          </svg>
        </motion.div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {phase === 'result' && result && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mb-4 py-3 px-4 rounded-2xl text-center font-black text-lg"
            style={{ background: result.color === 'green' ? 'rgba(5,150,105,0.2)' : result.color === 'red' ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.6)',
              border: `1px solid ${result.color === 'green' ? 'rgba(5,150,105,0.4)' : result.color === 'red' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
            <span style={{ color: result.color === 'green' ? '#10B981' : result.color === 'red' ? '#F87171' : '#94A3B8' }}>
              {result.n === 0 ? '0 — Зелёное!' : `${result.n} — ${result.color === 'red' ? 'Красное' : 'Чёрное'}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet buttons */}
      {phase !== 'result' && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['red', 'black', 'green'] as Color[]).map(color => (
            <motion.button key={color} onClick={() => addBet(color)} whileTap={{ scale: 0.93 }}
              disabled={phase === 'spinning'}
              className="rounded-2xl py-3 font-bold text-white text-sm disabled:opacity-40 relative overflow-hidden"
              style={{ background: color === 'green' ? 'rgba(5,150,105,0.4)' : color === 'red' ? 'rgba(239,68,68,0.4)' : 'rgba(30,41,59,0.8)',
                border: `1px solid ${color === 'green' ? 'rgba(5,150,105,0.5)' : color === 'red' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}` }}>
              <div>{COLOR_LABEL[color]}</div>
              <div className="text-xs opacity-70">x{MULTIPLIERS[color]}</div>
              {bets.find(b => b.color === color) && (
                <div className="absolute top-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-400 text-black">
                  {bets.find(b => b.color === color)!.amount}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Bet amount */}
      <div className="mb-3 p-3 rounded-2xl flex items-center gap-2"
        style={{ background: 'rgba(22,22,40,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-yellow-400 font-bold flex-1">🪙 {bet}</span>
        {[100, 500, 1000].map(v => (
          <button key={v} onClick={() => setBet(v)} disabled={phase === 'spinning'}
            className="px-3 py-1 rounded-xl text-xs font-bold disabled:opacity-40"
            style={bet === v ? { background: '#7C3AED', color: '#fff' } : { background: 'rgba(255,255,255,0.07)', color: '#94A3B8' }}>
            {v}
          </button>
        ))}
      </div>

      {/* Action */}
      {phase === 'betting' && (
        <motion.button onClick={spin} whileTap={{ scale: 0.97 }}
          disabled={bets.length === 0}
          className="w-full py-4 rounded-2xl font-black text-white text-lg disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
          🎡 Крутить · Ставок: 🪙 {totalBet}
        </motion.button>
      )}
      {phase === 'spinning' && (
        <div className="w-full py-4 rounded-2xl font-black text-center text-text-muted"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          🎡 Крутим...
        </div>
      )}
      {phase === 'result' && (
        <motion.button onClick={reset} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
          🔄 Сыграть ещё
        </motion.button>
      )}

      <p className="text-center text-text-muted text-xs mt-3">Банк: 🪙 {totalBet || 0} · Игроков: 1</p>
    </div>
  )
}
