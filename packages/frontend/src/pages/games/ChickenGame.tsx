import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../stores/userStore'
import { useAppStore } from '../../stores/appStore'

type Phase = 'idle' | 'playing' | 'dead' | 'won'
type Difficulty = 'easy' | 'medium' | 'hard' | 'hardcore'

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; lanes: number; carSpeed: number; carFreq: number; maxMult: number; chance: number }> = {
  easy:     { label: 'Легко',   lanes: 20, carSpeed: 2.5, carFreq: 2000, maxMult: 5,   chance: 90 },
  medium:   { label: 'Средне',  lanes: 20, carSpeed: 3.5, carFreq: 1500, maxMult: 10,  chance: 70 },
  hard:     { label: 'Сложно',  lanes: 20, carSpeed: 5,   carFreq: 1000, maxMult: 20,  chance: 45 },
  hardcore: { label: 'Хардкор', lanes: 20, carSpeed: 7,   carFreq: 700,  maxMult: 50,  chance: 20 },
}

const LANE_HEIGHT = 54
const VISIBLE_LANES = 5
const CARS = ['🚗', '🚙', '🚕', '🛻', '🏎️']

interface Car { id: number; lane: number; x: number; speed: number; emoji: string }

export function ChickenGame() {
  const { user, fetchUser } = useUserStore()
  const { showNotification } = useAppStore()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [bet, setBet] = useState(100)
  const [phase, setPhase] = useState<Phase>('idle')
  const [lane, setLane] = useState(0) // 0 = safe zone left
  const [mult, setMult] = useState(1.0)
  const [cars, setCars] = useState<Car[]>([])
  const carIdRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const laneRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  phaseRef.current = phase
  laneRef.current = lane

  const cfg = DIFFICULTY_CONFIG[difficulty]

  // Multiplier per lane: grows with each crossed lane
  const getLaneMult = (l: number) => parseFloat(Math.max(1, 1 + l * (cfg.maxMult - 1) / cfg.lanes).toFixed(2))

  const startGame = () => {
    if ((user?.coins || 0) < bet) { showNotification('Недостаточно монет', 'error'); return }
    setPhase('playing')
    setLane(0)
    setMult(1.0)
    setCars([])
    startCars()
  }

  const startCars = () => {
    spawnRef.current = setInterval(() => {
      if (phaseRef.current !== 'playing') return
      const l = Math.floor(Math.random() * cfg.lanes)
      const fromLeft = Math.random() > 0.5
      const car: Car = {
        id: carIdRef.current++,
        lane: l,
        x: fromLeft ? -60 : 110,
        speed: (fromLeft ? cfg.carSpeed : -cfg.carSpeed) * (0.8 + Math.random() * 0.4),
        emoji: CARS[Math.floor(Math.random() * CARS.length)],
      }
      setCars(prev => [...prev.slice(-20), car])
    }, cfg.carFreq)

    const animate = () => {
      if (phaseRef.current !== 'playing') return
      setCars(prev => {
        const updated = prev.map(c => ({ ...c, x: c.x + c.speed * 0.5 })).filter(c => c.x > -15 && c.x < 115)
        // Collision check
        const currentLane = laneRef.current
        if (currentLane > 0) {
          const hit = updated.some(c => c.lane === currentLane - 1 && c.x > 25 && c.x < 75)
          if (hit) {
            setPhase('dead')
            showNotification(`💥 Сбили на полосе ${currentLane}!`, 'error')
            fetchUser()
            return prev
          }
        }
        return updated
      })
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  const stopGame = useCallback(() => {
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    if (phase === 'dead' || phase === 'idle') stopGame()
  }, [phase, stopGame])

  const advance = () => {
    if (phase !== 'playing') return
    const newLane = laneRef.current + 1
    if (newLane >= cfg.lanes) {
      setLane(newLane)
      setPhase('won')
      stopGame()
      showNotification(`🏆 Прошёл все ${cfg.lanes} полос! x${cfg.maxMult}`, 'success')
      fetchUser()
      return
    }
    setLane(newLane)
    const newMult = getLaneMult(newLane)
    setMult(newMult)
  }

  const cashOut = () => {
    if (phase !== 'playing' || lane === 0) return
    const payout = Math.round(bet * mult)
    setPhase('won')
    stopGame()
    showNotification(`✅ Вышел x${mult} = +${payout} 🪙`, 'success')
    fetchUser()
  }

  const reset = () => {
    setPhase('idle')
    setLane(0)
    setCars([])
  }

  // Which lanes to show (centered around current lane)
  const visibleStart = Math.max(0, lane - 1)
  const visibleLanes = Array.from({ length: VISIBLE_LANES }, (_, i) => visibleStart + i)

  return (
    <div className="px-4 pb-6">
      <div className="text-center pt-3 pb-3">
        <h2 className="text-2xl font-black text-white">🐥 Переход</h2>
        <p className="text-text-muted text-sm mt-0.5">Перейди дорогу · множитель растёт</p>
      </div>

      {/* Stats */}
      {phase === 'playing' && (
        <div className="flex gap-2 mb-3">
          {[
            { label: 'Множитель', val: `x${mult.toFixed(2)}`, color: '#F59E0B' },
            { label: 'Следующая', val: `x${getLaneMult(lane + 1).toFixed(2)}`, color: '#94A3B8' },
            { label: 'Выигрыш', val: `${Math.round(bet * mult)} ★`, color: '#10B981' },
          ].map(s => (
            <div key={s.label} className="flex-1 p-2 rounded-xl text-center"
              style={{ background: 'rgba(22,22,40,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[9px] text-text-muted">{s.label}</p>
              <p className="text-sm font-black" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Game field */}
      <div className="rounded-2xl overflow-hidden mb-4 relative"
        style={{ height: LANE_HEIGHT * VISIBLE_LANES, background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {visibleLanes.map((l, i) => {
          const isCurrentLane = l === lane
          const isSafeZone = l === 0
          const bg = isSafeZone ? 'rgba(5,150,105,0.25)' : (l % 2 === 0 ? 'rgba(55,65,81,0.6)' : 'rgba(75,85,99,0.5)')
          return (
            <div key={l} className="absolute w-full flex items-center"
              style={{ top: i * LANE_HEIGHT, height: LANE_HEIGHT, background: bg, borderBottom: '1px solid rgba(0,0,0,0.3)' }}>
              {/* Road markings */}
              {!isSafeZone && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-4">
                    {[1,2,3,4,5].map(j => (
                      <div key={j} className="w-8 h-1 rounded" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Cars on this lane */}
              {cars.filter(c => c.lane === l - 1).map(car => (
                <div key={car.id} className="absolute text-2xl" style={{ left: `${car.x}%`, top: '50%', transform: 'translateY(-50%)' }}>
                  {car.emoji}
                </div>
              ))}

              {/* Chicken */}
              {isCurrentLane && (
                <motion.div className="absolute text-3xl z-10" style={{ left: '10%', top: '50%', transform: 'translateY(-50%)' }}
                  animate={{ rotate: phase === 'playing' ? [0, 10, 0, -10, 0] : 0 }}
                  transition={{ duration: 0.5, repeat: phase === 'playing' ? Infinity : 0 }}>
                  {phase === 'dead' ? '💀' : '🐥'}
                </motion.div>
              )}

              {/* Lane number */}
              <span className="absolute right-2 text-xs text-text-muted opacity-50">
                {isSafeZone ? 'СТАРТ' : `${l}`}
              </span>
            </div>
          )
        })}

        {/* Result overlay */}
        <AnimatePresence>
          {(phase === 'dead' || phase === 'won') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center z-20"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div className="text-center">
                <div className="text-5xl mb-2">{phase === 'dead' ? '💀' : '🏆'}</div>
                <p className="font-black text-white text-xl">{phase === 'dead' ? 'Сбили!' : 'Прошёл!'}</p>
                {phase === 'won' && <p className="text-emerald-400 font-bold">+{Math.round(bet * mult)} 🪙</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Difficulty */}
      {phase === 'idle' && (
        <div className="flex gap-1.5 mb-3">
          {(['easy','medium','hard','hardcore'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={difficulty === d ? { background: '#7C3AED', color: '#fff' } : { background: 'rgba(255,255,255,0.07)', color: '#94A3B8' }}>
              {DIFFICULTY_CONFIG[d].label}
            </button>
          ))}
        </div>
      )}

      {/* Bet & action */}
      <div className="mb-3 p-3 rounded-2xl flex items-center gap-2"
        style={{ background: 'rgba(22,22,40,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-2xl">🎁</span>
        <span className="text-yellow-400 font-bold flex-1">★ {bet}</span>
        {[100, 500].map(v => (
          <button key={v} onClick={() => setBet(b => b + v)} disabled={phase === 'playing'}
            className="px-2.5 py-1 rounded-xl text-xs font-bold disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#94A3B8' }}>
            +{v}
          </button>
        ))}
        <button onClick={() => setBet(b => Math.max(10, Math.round(b / 2)))} disabled={phase === 'playing'}
          className="px-2.5 py-1 rounded-xl text-xs text-text-secondary disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.05)' }}>½</button>
      </div>

      {phase === 'idle' && (
        <motion.button onClick={startGame} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
          🐥 Играть за ★ {bet}
        </motion.button>
      )}

      {phase === 'playing' && (
        <div className="flex gap-2">
          <motion.button onClick={advance} whileTap={{ scale: 0.93 }}
            className="flex-1 py-4 rounded-2xl font-black text-white text-base"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
            ➡️ Вперёд
          </motion.button>
          {lane > 0 && (
            <motion.button onClick={cashOut} whileTap={{ scale: 0.93 }}
              className="flex-1 py-4 rounded-2xl font-black text-white text-base"
              style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
              💰 Забрать x{mult.toFixed(2)}
            </motion.button>
          )}
        </div>
      )}

      {(phase === 'dead' || phase === 'won') && (
        <motion.button onClick={reset} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
          🔄 Играть ещё
        </motion.button>
      )}

      <p className="text-center text-text-muted text-xs mt-3">
        Шанс пройти полосу {cfg.chance}% · полос {cfg.lanes} · максимум x{cfg.maxMult}
      </p>
    </div>
  )
}
