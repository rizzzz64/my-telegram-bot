import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../utils/api'
import { useUserStore } from '../stores/userStore'
import { useAppStore } from '../stores/appStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ItemCard } from '../components/game/ItemCard'
import { RarityBadge } from '../components/game/RarityBadge'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE !== 'false'
const DEMO_CHANCES = [1, 20, 35, 50, 75]

interface UserItem {
  id: number
  item: { id: number; name: string; emoji: string; rarity: string; color: string; gameValue: number }
}

interface Item {
  id: number; name: string; emoji: string; rarity: string; color: string; gameValue: number
}

type Phase = 'idle' | 'requesting' | 'spinning' | 'result'

// ─── Upgrade Wheel ────────────────────────────────────────────────────────────
// Static circle with green/red sectors. Arrow rotates (clock-hand style).
// All animation via direct DOM manipulation + double-rAF to bypass React batching.
// This reliably fires CSS transitions on Android and Telegram WebView.

interface WheelProps {
  chance: number
  spinResult: { success: boolean; item: Item | null } | null
  onSpinComplete: () => void
}

function UpgradeWheel({ chance, spinResult, onSpinComplete }: WheelProps) {
  const arrowRef    = useRef<HTMLDivElement>(null)
  const rotAccRef   = useRef(0)          // accumulated total degrees (never resets while mounted)
  const prevResRef  = useRef<typeof spinResult>(null)
  const callbackRef = useRef(onSpinComplete)
  callbackRef.current = onSpinComplete
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef      = useRef<number | null>(null)
  const [glow, setGlow] = useState('rgba(139,92,246,0.3)')

  const greenDeg = Math.max(5, Math.min(355, (chance / 100) * 360))
  const cx = 100, cy = 100, r = 86
  const toRad = (d: number) => (d - 90) * Math.PI / 180

  const sectorPath = (startDeg: number, endDeg: number) => {
    const sx = cx + r * Math.cos(toRad(startDeg))
    const sy = cy + r * Math.sin(toRad(startDeg))
    const ex = cx + r * Math.cos(toRad(endDeg))
    const ey = cy + r * Math.sin(toRad(endDeg))
    const span = ((endDeg - startDeg) + 360) % 360
    const large = span > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${sx.toFixed(3)} ${sy.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(3)} ${ey.toFixed(3)} Z`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current)   cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Reset glow when no result
  useEffect(() => {
    if (!spinResult) setGlow('rgba(139,92,246,0.3)')
  }, [spinResult])

  useEffect(() => {
    if (!spinResult || spinResult === prevResRef.current) return
    prevResRef.current = spinResult

    const el = arrowRef.current
    if (!el) return

    // Cancel any in-flight animation
    if (timerRef.current) clearTimeout(timerRef.current)
    if (rafRef.current)   cancelAnimationFrame(rafRef.current)

    // ── Calculate landing angle ──────────────────────────────────────────────
    // Green sector: [0, greenDeg)   → success
    // Red sector:   [greenDeg, 360) → failure
    let targetAngle: number
    if (spinResult.success) {
      const margin = Math.max(6, greenDeg * 0.1)
      const range  = Math.max(2, greenDeg - 2 * margin)
      targetAngle  = margin + Math.random() * range
    } else {
      const redSize = 360 - greenDeg
      const margin  = Math.max(6, redSize * 0.08)
      const range   = Math.max(2, redSize - 2 * margin)
      targetAngle   = greenDeg + margin + Math.random() * range
    }

    // ── Compute new total rotation so arrow ends at exactly targetAngle ──────
    const oldTotal   = rotAccRef.current
    const currentNorm = ((oldTotal % 360) + 360) % 360
    // extra ∈ [0, 360) brings arrow from currentNorm to targetAngle
    const extra      = ((targetAngle - currentNorm) + 360) % 360
    const spins      = (5 + Math.floor(Math.random() * 3)) * 360
    const newTotal   = oldTotal + spins + extra
    rotAccRef.current = newTotal

    // ── Step 1: pin arrow at current position with no transition ─────────────
    // This ensures the browser "sees" the starting state before we animate.
    el.style.transition = 'none'
    el.style.transform  = `rotate(${oldTotal}deg)`

    // ── Step 2: double-rAF guarantees browser has painted step 1 ─────────────
    // Single rAF is not always sufficient on Android / Telegram WebView.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        if (!arrowRef.current) return
        arrowRef.current.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
        arrowRef.current.style.transform  = `rotate(${newTotal}deg)`
      })
    })

    // ── Step 3: fire callback after animation ends ───────────────────────────
    timerRef.current = setTimeout(() => {
      setGlow(spinResult.success ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.45)')
      callbackRef.current()
    }, 4200)
  }, [spinResult])  // greenDeg intentionally omitted — chance changes don't restart animation

  // SVG paths
  const greenPath = sectorPath(0, greenDeg)
  const redPath   = sectorPath(greenDeg, 360)
  const divLineX  = (cx + r * Math.cos(toRad(greenDeg))).toFixed(3)
  const divLineY  = (cy + r * Math.sin(toRad(greenDeg))).toFixed(3)

  return (
    <div className="relative w-56 h-56 mx-auto select-none" style={{ touchAction: 'none' }}>
      {/* Animated glow ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: `0 0 48px ${glow}, 0 0 20px ${glow}`, transition: 'box-shadow 0.8s ease' }}
      />

      {/* ── Static circle with sectors ──────────────────────────────────────── */}
      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
        <defs>
          <radialGradient id="ugGreen" cx="55%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
          <radialGradient id="ugRed" cx="55%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#991B1B" />
          </radialGradient>
        </defs>

        {/* Background disc */}
        <circle cx="100" cy="100" r="90" fill="#0D0D1A" />

        {/* Green success sector */}
        <path d={greenPath} fill="url(#ugGreen)" />

        {/* Red fail sector */}
        {greenDeg < 357 && <path d={redPath} fill="url(#ugRed)" />}

        {/* Sector boundary lines */}
        <line
          x1="100" y1="100"
          x2={(cx + r * Math.cos(toRad(0))).toFixed(3)} y2={(cy + r * Math.sin(toRad(0))).toFixed(3)}
          stroke="rgba(255,255,255,0.45)" strokeWidth="2.5"
        />
        {greenDeg < 357 && (
          <line x1="100" y1="100" x2={divLineX} y2={divLineY}
            stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
        )}

        {/* Tick marks every 15° */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * 15 - 90) * Math.PI / 180
          const inner = i % 2 === 0 ? 78 : 82
          return (
            <line key={i}
              x1={(cx + inner * Math.cos(a)).toFixed(2)} y1={(cy + inner * Math.sin(a)).toFixed(2)}
              x2={(cx + 86 * Math.cos(a)).toFixed(2)} y2={(cy + 86 * Math.sin(a)).toFixed(2)}
              stroke="rgba(255,255,255,0.18)" strokeWidth={i % 2 === 0 ? '1.5' : '1'}
            />
          )
        })}

        {/* Outer ring */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

        {/* Inner hub (covers arrow base, drawn last so it's on top) */}
        <circle cx="100" cy="100" r="16" fill="#12121F" />
        <circle cx="100" cy="100" r="16" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      </svg>

      {/* ── Rotating arrow ──────────────────────────────────────────────────── */}
      {/* Same size as wheel SVG, positioned absolutely on top.               */}
      {/* transform-origin defaults to 50% 50% = center of wheel = pivot.    */}
      <div
        ref={arrowRef}
        className="absolute inset-0 pointer-events-none z-20"
        style={{ transformOrigin: 'center center' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <filter id="ugArrowGlow">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Stem: center → near top of disc */}
          <line x1="100" y1="100" x2="100" y2="22"
            stroke="#F59E0B" strokeWidth="4" strokeLinecap="round"
            filter="url(#ugArrowGlow)" />
          {/* Arrowhead: tip at y=10, pointing toward 12 o'clock */}
          <polygon points="100,8 91,27 109,27"
            fill="#F59E0B" filter="url(#ugArrowGlow)" />
          {/* Center cap dot */}
          <circle cx="100" cy="100" r="5.5" fill="#F59E0B" />
        </svg>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function UpgradePage() {
  const [inventory, setInventory]   = useState<UserItem[]>([])
  const [allItems, setAllItems]     = useState<Item[]>([])
  const [sourceItem, setSourceItem] = useState<UserItem | null>(null)
  const [targetItem, setTargetItem] = useState<Item | null>(null)
  const [odds, setOdds]             = useState<{ chance: number; ratio: string } | null>(null)
  const [phase, setPhase]           = useState<Phase>('idle')
  const [spinResult, setSpinResult] = useState<{ success: boolean; item: Item | null } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [step, setStep]             = useState<'source' | 'target' | 'confirm'>('source')
  const [demoChance, setDemoChance] = useState<number | null>(null)
  const { fetchUser }               = useUserStore()
  const { showNotification }        = useAppStore()

  // effective chance used by wheel + upgrade logic
  const effectiveChance = demoChance ?? odds?.chance ?? 50

  useEffect(() => {
    Promise.all([
      api.get<UserItem[]>('/inventory'),
      api.get<any[]>('/cases').then(cases =>
        cases.flatMap((c: any) => c.drops.map((d: any) => d.item))
          .filter((item: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === item.id) === i)
          .sort((a: any, b: any) => a.gameValue - b.gameValue)
      ),
    ]).then(([inv, items]) => {
      setInventory(inv)
      setAllItems(items)
    })
  }, [])

  useEffect(() => {
    if (sourceItem && targetItem && demoChance === null) {
      setOdds(null)
      api.get<any>(`/upgrades/odds/${sourceItem.id}/${targetItem.id}`).then(setOdds)
    }
  }, [sourceItem, targetItem, demoChance])

  const handleUpgrade = async () => {
    if (phase !== 'idle' || !sourceItem || !targetItem) return
    // Guard: prevent double-click (phase check above, plus JS-level guard)
    setPhase('requesting')

    try {
      let result: { success: boolean; item: Item | null }

      if (IS_DEMO && demoChance !== null) {
        // Local simulation for demo percentage testing (no server call)
        await new Promise<void>(r => setTimeout(r, 350))
        const success = Math.random() * 100 < demoChance
        result = { success, item: success ? targetItem : null }
      } else {
        const res = await api.post<any>('/upgrades', {
          sourceItemId: sourceItem.id,
          targetItemId: targetItem.id,
        })
        result = { success: res.success, item: res.success ? res.item : null }
      }

      setSpinResult(result)
      setPhase('spinning')
    } catch (err: any) {
      setPhase('idle')
      showNotification(err.message || 'Ошибка апгрейда', 'error')
    }
  }

  const handleSpinComplete = () => {
    setPhase('result')
    setShowResult(true)
    fetchUser()
    if (sourceItem) setInventory(prev => prev.filter(i => i.id !== sourceItem.id))
  }

  const reset = () => {
    setSourceItem(null)
    setTargetItem(null)
    setOdds(null)
    setSpinResult(null)
    setShowResult(false)
    setPhase('idle')
    setStep('source')
    setDemoChance(null)
    api.get<UserItem[]>('/inventory').then(setInventory)
  }

  const pageV = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.22 } },
    exit:    { opacity: 0, x: -24, transition: { duration: 0.15 } },
  }

  return (
    <div className="pb-nav min-h-screen">
      {/* Page header */}
      <div className="px-4 pt-3 pb-3">
        <h1 className="text-2xl font-bold text-text-primary">⚡ Апгрейд</h1>
        <p className="text-text-muted text-sm">Рискни — и улучши свой предмет</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center px-4 mb-5 gap-0">
        {(['source', 'target', 'confirm'] as const).map((s, i) => {
          const stepOrder = { source: 0, target: 1, confirm: 2 }
          const currentOrder = stepOrder[step]
          const sOrder = stepOrder[s]
          const done   = sOrder < currentOrder
          const active = step === s
          return (
            <div key={s} className={`flex items-center ${i > 0 ? 'flex-1' : ''}`}>
              {i > 0 && (
                <div className={`flex-1 h-px mx-1 transition-colors ${done ? 'bg-accent-purple/70' : 'bg-white/10'}`} />
              )}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
                done   ? 'bg-accent-purple/25 text-accent-purple border border-accent-purple/50' :
                active ? 'bg-accent-purple text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]' :
                         'bg-white/5 text-text-muted border border-white/10'
              }`}>
                {done ? '✓' : i + 1}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: select source item ── */}
        {step === 'source' && (
          <motion.div key="source" {...pageV} className="px-4">
            <p className="text-sm text-text-secondary mb-4">Выбери предмет для апгрейда:</p>
            {inventory.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <p className="font-semibold text-text-secondary">Инвентарь пуст</p>
                <p className="text-text-muted text-sm mt-1">Открой кейс, чтобы получить предметы!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {inventory.map(ui => (
                  <ItemCard key={ui.id} item={ui.item} size="md"
                    onClick={() => { setSourceItem(ui); setStep('target') }} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 2: select target item ── */}
        {step === 'target' && sourceItem && (
          <motion.div key="target" {...pageV} className="px-4">
            <div className="glass-card rounded-2xl p-3 mb-4 flex items-center gap-3">
              <span className="text-3xl">{sourceItem.item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted">Улучшаем</p>
                <p className="font-bold text-text-primary text-sm truncate">{sourceItem.item.name}</p>
                <p className="text-xs text-yellow-400">🪙 {sourceItem.item.gameValue.toLocaleString('ru-RU')}</p>
              </div>
              <button onClick={() => setStep('source')}
                className="text-text-muted text-xs px-2.5 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 transition-colors">
                Сменить
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4">Выбери желаемый предмет:</p>
            <div className="grid grid-cols-3 gap-3">
              {allItems.filter(i => i.id !== sourceItem.item.id).map(item => (
                <ItemCard key={item.id} item={item} size="md"
                  onClick={() => { setTargetItem(item); setStep('confirm') }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: confirm + wheel ── */}
        {step === 'confirm' && sourceItem && targetItem && (
          <motion.div key="confirm" {...pageV} className="px-4 space-y-4">

            {/* Items comparison */}
            <div className="flex items-stretch gap-3">
              <div className="flex-1 premium-card rounded-2xl p-3 text-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl mx-auto mb-2"
                  style={{ background: `${sourceItem.item.color}22`, border: `1.5px solid ${sourceItem.item.color}55` }}>
                  {sourceItem.item.emoji}
                </div>
                <p className="text-[10px] text-text-muted mb-0.5">Ставишь</p>
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">{sourceItem.item.name}</p>
                <p className="text-[10px] text-yellow-400 mt-0.5">🪙 {sourceItem.item.gameValue.toLocaleString('ru-RU')}</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0 w-14">
                <motion.div className="text-2xl"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}>
                  ⚡
                </motion.div>
                {demoChance !== null ? (
                  <div className={`text-sm font-bold px-2 py-0.5 rounded-full text-center ${
                    demoChance >= 60 ? 'text-emerald-400 bg-emerald-500/12' :
                    demoChance >= 35 ? 'text-yellow-400 bg-yellow-500/12' :
                    'text-red-400 bg-red-500/12'
                  }`}>{demoChance}%</div>
                ) : odds ? (
                  <div className={`text-sm font-bold px-2 py-0.5 rounded-full text-center ${
                    odds.chance >= 60 ? 'text-emerald-400 bg-emerald-500/12' :
                    odds.chance >= 35 ? 'text-yellow-400 bg-yellow-500/12' :
                    'text-red-400 bg-red-500/12'
                  }`}>{odds.chance}%</div>
                ) : (
                  <div className="w-8 h-5 bg-white/5 rounded animate-pulse" />
                )}
              </div>

              <div className="flex-1 premium-card rounded-2xl p-3 text-center border border-accent-purple/15">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl mx-auto mb-2"
                  style={{ background: `${targetItem.color}22`, border: `1.5px solid ${targetItem.color}55` }}>
                  {targetItem.emoji}
                </div>
                <p className="text-[10px] text-text-muted mb-0.5">Получишь</p>
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">{targetItem.name}</p>
                <p className="text-[10px] text-yellow-400 mt-0.5">🪙 {targetItem.gameValue.toLocaleString('ru-RU')}</p>
              </div>
            </div>

            {/* Wheel */}
            <div>
              <p className="text-center text-xs text-text-muted uppercase tracking-widest mb-4">Колесо удачи</p>
              <UpgradeWheel
                chance={effectiveChance}
                spinResult={spinResult}
                onSpinComplete={handleSpinComplete}
              />

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-text-secondary">Успех {effectiveChance}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-text-secondary">Провал {100 - effectiveChance}%</span>
                </div>
              </div>
            </div>

            {/* Demo chance picker (visible only in DEMO_MODE) */}
            {IS_DEMO && (
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">🔧 Demo: выбор шанса</p>
                <div className="flex gap-2 flex-wrap">
                  {DEMO_CHANCES.map(p => (
                    <button key={p} onClick={() => setDemoChance(demoChance === p ? null : p)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                        demoChance === p
                          ? 'bg-accent-purple text-white shadow-[0_0_8px_rgba(139,92,246,0.4)]'
                          : 'bg-white/8 text-text-muted hover:bg-white/12'
                      }`}>
                      {p}%
                    </button>
                  ))}
                  {demoChance !== null && (
                    <button onClick={() => setDemoChance(null)}
                      className="text-xs text-text-muted px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                      ✕ авто
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="rounded-xl px-4 py-2.5 bg-red-500/7 border border-red-500/18">
              <p className="text-red-400/90 text-xs text-center">
                ⚠️ При провале «{sourceItem.item.name}» будет потерян
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pb-2">
              <motion.button
                onClick={() => { if (phase === 'idle') setStep('target') }}
                disabled={phase !== 'idle'}
                whileTap={{ scale: 0.97 }}
                className="flex-[0.7] py-3.5 rounded-2xl border border-white/12 text-text-secondary font-medium text-sm disabled:opacity-40 transition-colors hover:bg-white/5">
                ← Назад
              </motion.button>

              <motion.button
                onClick={handleUpgrade}
                disabled={phase !== 'idle'}
                whileTap={{ scale: phase === 'idle' ? 0.97 : 1 }}
                className="flex-[1.3] py-3.5 rounded-2xl font-bold text-white text-base relative overflow-hidden disabled:opacity-50 btn-neon"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
                {phase === 'requesting' ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" /> Запрос...
                  </span>
                ) : phase === 'spinning' ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                      🎰
                    </motion.span>
                    Крутится...
                  </span>
                ) : (
                  `⚡ АПГРЕЙД ${effectiveChance ? `(${effectiveChance}%)` : ''}`
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result modal ── */}
      <AnimatePresence>
        {showResult && spinResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8 modal-backdrop bg-black/65">
            <motion.div
              initial={{ opacity: 0, y: 90, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 90 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="w-full max-w-sm rounded-3xl p-7 text-center premium-card"
              style={{
                boxShadow: spinResult.success
                  ? '0 0 70px rgba(16,185,129,0.3), 0 0 140px rgba(16,185,129,0.1)'
                  : '0 0 50px rgba(239,68,68,0.2)',
                border: spinResult.success
                  ? '1px solid rgba(16,185,129,0.25)'
                  : '1px solid rgba(239,68,68,0.18)',
              }}>
              <motion.div
                className="text-7xl mb-5"
                animate={spinResult.success
                  ? { scale: [1, 1.25, 1], rotate: [0, -6, 6, 0] }
                  : { x: [-10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5 }}>
                {spinResult.success ? (spinResult.item?.emoji ?? '✨') : '💔'}
              </motion.div>

              <h2 className={`text-2xl font-bold mb-1 ${spinResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {spinResult.success ? '🎉 Успех!' : '😔 Не повезло...'}
              </h2>

              {spinResult.success && spinResult.item && (
                <>
                  <p className="text-text-muted text-sm mb-1">Вы получили:</p>
                  <p className="text-lg font-bold text-text-primary mb-3">{spinResult.item.name}</p>
                  <div className="flex justify-center mb-5">
                    <RarityBadge rarity={spinResult.item.rarity} />
                  </div>
                </>
              )}

              {!spinResult.success && (
                <p className="text-text-muted text-sm mt-1 mb-5">Предмет потерян. Попробуй ещё раз!</p>
              )}

              <motion.button
                onClick={reset}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-bold text-white text-base btn-neon"
                style={{
                  background: spinResult.success
                    ? 'linear-gradient(135deg, #059669, #10B981)'
                    : 'linear-gradient(135deg, #7C3AED, #2563EB)',
                  boxShadow: spinResult.success
                    ? '0 4px 20px rgba(16,185,129,0.35)'
                    : '0 4px 20px rgba(139,92,246,0.3)',
                }}>
                {spinResult.success ? '🚀 Забрать предмет!' : '🔄 Попробовать снова'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
