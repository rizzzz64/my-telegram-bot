import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../utils/api'
import { useUserStore } from '../stores/userStore'
import { useAppStore } from '../stores/appStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ItemCard } from '../components/game/ItemCard'
import { RarityBadge } from '../components/game/RarityBadge'

interface UserItem {
  id: number
  item: { id: number; name: string; emoji: string; rarity: string; color: string; gameValue: number }
}

interface Item {
  id: number; name: string; emoji: string; rarity: string; color: string; gameValue: number
}

// ─── Spinning Wheel ───────────────────────────────────────────────────────────

interface WheelProps {
  chance: number
  spinResult: { success: boolean } | null
  onSpinComplete: () => void
}

function UpgradeWheel({ chance, spinResult, onSpinComplete }: WheelProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const prevResult = useRef<typeof spinResult>(null)
  const callbackRef = useRef(onSpinComplete)
  callbackRef.current = onSpinComplete

  const greenDeg = Math.max(3, Math.min(357, (chance / 100) * 360))
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

  useEffect(() => {
    if (!spinResult || spinResult === prevResult.current) return
    prevResult.current = spinResult

    setIsSpinning(true)

    // Determine landing angle: green = [0, greenDeg], red = [greenDeg, 360]
    let targetAngle: number
    if (spinResult.success) {
      const margin = Math.max(4, greenDeg * 0.1)
      targetAngle = margin + Math.random() * Math.max(1, greenDeg - 2 * margin)
    } else {
      const redSize = 360 - greenDeg
      const margin = Math.max(4, redSize * 0.08)
      targetAngle = greenDeg + margin + Math.random() * Math.max(1, redSize - 2 * margin)
    }

    // 6–8 full rotations for drama, then land on target
    const extraSpins = (6 + Math.floor(Math.random() * 3)) * 360
    setRotation(prev => prev + extraSpins + targetAngle)

    const timer = setTimeout(() => {
      setIsSpinning(false)
      callbackRef.current()
    }, 4400)
    return () => clearTimeout(timer)
  }, [spinResult])

  // Green sector: 0° → greenDeg (12 o'clock going clockwise)
  // Red sector: greenDeg → 360°
  const greenPath = sectorPath(0, greenDeg)
  const redPath   = sectorPath(greenDeg, 360)

  // Border line at greenDeg
  const lineX = cx + r * Math.cos(toRad(greenDeg))
  const lineY = cy + r * Math.sin(toRad(greenDeg))

  // Glow color based on result
  const glowColor = spinResult?.success === true
    ? 'rgba(16,185,129,0.5)'
    : spinResult?.success === false
    ? 'rgba(239,68,68,0.45)'
    : 'rgba(139,92,246,0.3)'

  return (
    <div className="relative w-60 h-60 mx-auto select-none">
      {/* Fixed arrow pointer */}
      <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: '-14px' }}>
        <svg width="22" height="30" viewBox="0 0 22 30">
          <defs>
            <filter id="ptrGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <polygon points="11,2 1,28 21,28" fill="#F1F5F9" filter="url(#ptrGlow)" />
        </svg>
      </div>

      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"
        style={{ boxShadow: `0 0 48px ${glowColor}, 0 0 16px ${glowColor}` }}
      />

      {/* Spinning wheel wrapper */}
      <div
        className="w-full h-full rounded-full overflow-hidden"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <radialGradient id="gGreen" cx="60%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>
            <radialGradient id="gRed" cx="60%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#991B1B" />
            </radialGradient>
          </defs>

          {/* Background */}
          <circle cx="100" cy="100" r="90" fill="#0A0A14" />

          {/* Green sector */}
          <path d={greenPath} fill="url(#gGreen)" />

          {/* Red sector */}
          {greenDeg < 358 && <path d={redPath} fill="url(#gRed)" />}

          {/* Divider lines */}
          <line
            x1="100" y1="100"
            x2={(cx + r * Math.cos(toRad(0))).toFixed(3)} y2={(cy + r * Math.sin(toRad(0))).toFixed(3)}
            stroke="rgba(255,255,255,0.35)" strokeWidth="2"
          />
          {greenDeg < 358 && (
            <line
              x1="100" y1="100"
              x2={lineX.toFixed(3)} y2={lineY.toFixed(3)}
              stroke="rgba(255,255,255,0.35)" strokeWidth="2"
            />
          )}

          {/* Tick marks every 30° */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 - 90) * Math.PI / 180
            const ix = cx + 80 * Math.cos(a)
            const iy = cy + 80 * Math.sin(a)
            const ox = cx + 90 * Math.cos(a)
            const oy = cy + 90 * Math.sin(a)
            return (
              <line
                key={i}
                x1={ix.toFixed(2)} y1={iy.toFixed(2)}
                x2={ox.toFixed(2)} y2={oy.toFixed(2)}
                stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"
              />
            )
          })}

          {/* Outer ring */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

          {/* Inner circle hub */}
          <circle cx="100" cy="100" r="22" fill="#12121F" />
          <circle cx="100" cy="100" r="22" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <circle cx="100" cy="100" r="5"  fill="rgba(255,255,255,0.5)" />
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
  const [upgrading, setUpgrading]   = useState(false)
  const [spinResult, setSpinResult] = useState<{ success: boolean; item: Item | null } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [step, setStep]             = useState<'source' | 'target' | 'confirm'>('source')
  const { fetchUser }               = useUserStore()
  const { showNotification }        = useAppStore()

  // keep refs for use inside async callbacks
  const sourceItemRef = useRef(sourceItem)
  useEffect(() => { sourceItemRef.current = sourceItem }, [sourceItem])

  useEffect(() => {
    Promise.all([
      api.get<UserItem[]>('/inventory'),
      api.get<any[]>('/cases').then(cases =>
        cases.flatMap(c => c.drops.map((d: any) => d.item))
          .filter((item, i, arr) => arr.findIndex((x: any) => x.id === item.id) === i)
          .sort((a: any, b: any) => a.gameValue - b.gameValue)
      ),
    ]).then(([inv, items]) => {
      setInventory(inv)
      setAllItems(items)
    })
  }, [])

  useEffect(() => {
    if (sourceItem && targetItem) {
      setOdds(null)
      api.get<any>(`/upgrades/odds/${sourceItem.id}/${targetItem.id}`).then(setOdds)
    }
  }, [sourceItem, targetItem])

  const handleUpgrade = async () => {
    if (!sourceItem || !targetItem || upgrading) return
    setUpgrading(true)

    try {
      const res = await api.post<any>('/upgrades', {
        sourceItemId: sourceItem.id,
        targetItemId: targetItem.id,
      })
      // Wheel starts spinning to reflect actual result
      setSpinResult(res)
    } catch (err: any) {
      setUpgrading(false)
      showNotification(err.message, 'error')
    }
  }

  const handleSpinComplete = () => {
    setShowResult(true)
    fetchUser()
    setInventory(prev => prev.filter(i => i.id !== sourceItemRef.current?.id))
  }

  const reset = () => {
    setSourceItem(null)
    setTargetItem(null)
    setOdds(null)
    setSpinResult(null)
    setShowResult(false)
    setUpgrading(false)
    setStep('source')
    api.get<UserItem[]>('/inventory').then(setInventory)
  }

  const pageV = {
    initial:  { opacity: 0, x: 24 },
    animate:  { opacity: 1, x: 0, transition: { duration: 0.22 } },
    exit:     { opacity: 0, x: -24, transition: { duration: 0.15 } },
  }

  return (
    <div className="pb-nav min-h-screen">
      {/* Page header */}
      <div className="px-4 pt-3 pb-3">
        <h1 className="text-2xl font-bold text-text-primary">⚡ Апгрейд</h1>
        <p className="text-text-muted text-sm">Рискни — и улучши свой предмет</p>
      </div>

      {/* Step indicator */}
      {step !== 'confirm' && (
        <div className="flex items-center px-4 mb-5 gap-0">
          {(['source', 'target', 'confirm'] as const).map((s, i) => {
            const currentStep = step as string
            const done   = (s === 'source' && (currentStep === 'target' || currentStep === 'confirm')) ||
                           (s === 'target' && currentStep === 'confirm')
            const active = step === s
            return (
              <div key={s} className={`flex items-center ${i > 0 ? 'flex-1' : ''}`}>
                {i > 0 && (
                  <div className={`flex-1 h-px mx-1 transition-colors ${done ? 'bg-accent-purple/70' : 'bg-white/10'}`} />
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
                  done
                    ? 'bg-accent-purple/25 text-accent-purple border border-accent-purple/50'
                    : active
                    ? 'bg-accent-purple text-white'
                    : 'bg-white/5 text-text-muted border border-white/10'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Step 1: select source ── */}
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
                  <ItemCard
                    key={ui.id}
                    item={ui.item}
                    onClick={() => { setSourceItem(ui); setStep('target') }}
                    size="md"
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 2: select target ── */}
        {step === 'target' && sourceItem && (
          <motion.div key="target" {...pageV} className="px-4">
            <div className="glass-card rounded-2xl p-3 mb-4 flex items-center gap-3">
              <span className="text-3xl">{sourceItem.item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted">Улучшаем</p>
                <p className="font-bold text-text-primary text-sm truncate">{sourceItem.item.name}</p>
                <p className="text-xs text-yellow-400">🪙 {sourceItem.item.gameValue.toLocaleString('ru-RU')}</p>
              </div>
              <button
                onClick={() => setStep('source')}
                className="text-text-muted text-xs px-2.5 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 transition-colors"
              >
                Сменить
              </button>
            </div>

            <p className="text-sm text-text-secondary mb-4">Выбери желаемый предмет:</p>
            <div className="grid grid-cols-3 gap-3">
              {allItems.filter(i => i.id !== sourceItem.item.id).map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => { setTargetItem(item); setStep('confirm') }}
                  size="md"
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: confirm + wheel ── */}
        {step === 'confirm' && sourceItem && targetItem && (
          <motion.div key="confirm" {...pageV} className="px-4 space-y-4">

            {/* Items row */}
            <div className="flex items-stretch gap-3">
              {/* Source */}
              <div className="flex-1 premium-card rounded-2xl p-3 text-center">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl mx-auto mb-2"
                  style={{ background: `${sourceItem.item.color}22`, border: `1.5px solid ${sourceItem.item.color}55` }}
                >
                  {sourceItem.item.emoji}
                </div>
                <p className="text-[10px] text-text-muted mb-0.5">Ставишь</p>
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">{sourceItem.item.name}</p>
                <p className="text-[10px] text-yellow-400 mt-0.5">🪙 {sourceItem.item.gameValue.toLocaleString('ru-RU')}</p>
              </div>

              {/* Center info */}
              <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0 w-14">
                <motion.div
                  className="text-2xl"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ⚡
                </motion.div>
                {odds ? (
                  <div className={`text-sm font-bold px-2 py-0.5 rounded-full text-center ${
                    odds.chance >= 60 ? 'text-emerald-400 bg-emerald-500/12' :
                    odds.chance >= 35 ? 'text-yellow-400 bg-yellow-500/12' :
                    'text-red-400 bg-red-500/12'
                  }`}>
                    {odds.chance}%
                  </div>
                ) : (
                  <div className="w-8 h-5 bg-white/5 rounded animate-pulse" />
                )}
              </div>

              {/* Target */}
              <div className="flex-1 premium-card rounded-2xl p-3 text-center border border-accent-purple/15">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl mx-auto mb-2"
                  style={{ background: `${targetItem.color}22`, border: `1.5px solid ${targetItem.color}55` }}
                >
                  {targetItem.emoji}
                </div>
                <p className="text-[10px] text-text-muted mb-0.5">Получишь</p>
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">{targetItem.name}</p>
                <p className="text-[10px] text-yellow-400 mt-0.5">🪙 {targetItem.gameValue.toLocaleString('ru-RU')}</p>
              </div>
            </div>

            {/* Wheel section */}
            <div>
              <p className="text-center text-xs text-text-muted uppercase tracking-widest mb-4">Колесо удачи</p>

              <UpgradeWheel
                chance={odds?.chance ?? 50}
                spinResult={spinResult}
                onSpinComplete={handleSpinComplete}
              />

              {/* Legend */}
              {odds && (
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-text-secondary">Успех {odds.chance}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-text-secondary">Провал {100 - odds.chance}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="rounded-xl px-4 py-2.5 bg-red-500/7 border border-red-500/18">
              <p className="text-red-400/90 text-xs text-center">
                ⚠️ При провале «{sourceItem.item.name}» будет потерян
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pb-2">
              <motion.button
                onClick={() => setStep('target')}
                disabled={upgrading}
                whileTap={{ scale: 0.97 }}
                className="flex-[0.7] py-3.5 rounded-2xl border border-white/12 text-text-secondary font-medium text-sm disabled:opacity-40 transition-colors hover:bg-white/5"
              >
                ← Назад
              </motion.button>

              <motion.button
                onClick={handleUpgrade}
                disabled={upgrading || !!spinResult}
                whileTap={{ scale: upgrading ? 1 : 0.97 }}
                className="flex-[1.3] py-3.5 rounded-2xl font-bold text-white text-base relative overflow-hidden disabled:opacity-50 btn-neon"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}
              >
                {upgrading && !spinResult ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" /> Запрос...
                  </span>
                ) : spinResult ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                      🎰
                    </motion.span>
                    Крутится...
                  </span>
                ) : (
                  `⚡ АПГРЕЙД ${odds ? `(${odds.chance}%)` : ''}`
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8 modal-backdrop bg-black/65"
          >
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
                border: spinResult.success ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.18)',
              }}
            >
              <motion.div
                className="text-7xl mb-5"
                animate={
                  spinResult.success
                    ? { scale: [1, 1.25, 1], rotate: [0, -6, 6, 0] }
                    : { x: [-10, 10, -10, 10, 0] }
                }
                transition={{ duration: 0.5 }}
              >
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
                }}
              >
                {spinResult.success ? '🚀 Забрать предмет!' : '🔄 Попробовать снова'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
