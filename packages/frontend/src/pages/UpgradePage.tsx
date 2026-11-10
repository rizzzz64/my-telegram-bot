import { useEffect, useState } from 'react'
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

export function UpgradePage() {
  const [inventory, setInventory] = useState<UserItem[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [sourceItem, setSourceItem] = useState<UserItem | null>(null)
  const [targetItem, setTargetItem] = useState<Item | null>(null)
  const [odds, setOdds] = useState<{ chance: number; ratio: string } | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; item: Item | null } | null>(null)
  const [step, setStep] = useState<'source' | 'target' | 'confirm'>('source')
  const [spinning, setSpinning] = useState(false)
  const { fetchUser } = useUserStore()
  const { showNotification } = useAppStore()

  useEffect(() => {
    Promise.all([
      api.get<UserItem[]>('/inventory'),
      api.get<any[]>('/cases').then(cases =>
        cases.flatMap(c => c.drops.map((d: any) => d.item))
          .filter((item, i, arr) => arr.findIndex(x => x.id === item.id) === i)
          .sort((a, b) => a.gameValue - b.gameValue)
      )
    ]).then(([inv, items]) => {
      setInventory(inv)
      setAllItems(items)
    })
  }, [])

  useEffect(() => {
    if (sourceItem && targetItem) {
      api.get<any>(`/upgrades/odds/${sourceItem.id}/${targetItem.id}`).then(setOdds)
    }
  }, [sourceItem, targetItem])

  const handleUpgrade = async () => {
    if (!sourceItem || !targetItem || upgrading) return
    setUpgrading(true)
    setSpinning(true)

    await new Promise(r => setTimeout(r, 2000))

    try {
      const res = await api.post<any>('/upgrades', {
        sourceItemId: sourceItem.id,
        targetItemId: targetItem.id,
      })
      setSpinning(false)
      setResult(res)
      fetchUser()
      setInventory(prev => prev.filter(i => i.id !== sourceItem.id))
    } catch (err: any) {
      setSpinning(false)
      setUpgrading(false)
      showNotification(err.message, 'error')
    }
  }

  const reset = () => {
    setSourceItem(null)
    setTargetItem(null)
    setOdds(null)
    setResult(null)
    setUpgrading(false)
    setStep('source')
    api.get<UserItem[]>('/inventory').then(setInventory)
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-nav">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className={`text-8xl mb-6 ${result.success ? 'animate-float' : ''}`}
            animate={result.success ? { scale: [1, 1.2, 1] } : { x: [-10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {result.success ? result.item?.emoji || '✨' : '💔'}
          </motion.div>
          <h2 className={`text-3xl font-bold mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
            {result.success ? '🎉 Успех!' : '😔 Не повезло...'}
          </h2>
          {result.success && result.item && (
            <>
              <p className="text-text-secondary mb-1">Вы получили:</p>
              <p className="text-xl font-bold text-text-primary mb-4">{result.item.name}</p>
              <RarityBadge rarity={result.item.rarity} />
            </>
          )}
          {!result.success && (
            <p className="text-text-muted mt-2">Предмет потерян. Попробуй ещё раз!</p>
          )}
          <motion.button
            onClick={reset}
            whileTap={{ scale: 0.97 }}
            className="mt-8 w-full max-w-xs bg-gradient-to-r from-accent-purple to-accent-blue py-4 rounded-2xl font-bold text-white text-lg"
          >
            Попробовать снова
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="pb-nav">
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">🚀 Апгрейд</h1>
        <p className="text-text-muted text-sm">Улучши предмет с шансом на успех</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center px-4 mb-6 gap-2">
        {[
          { id: 'source', label: '1. Выбери предмет' },
          { id: 'target', label: '2. Выбери цель' },
          { id: 'confirm', label: '3. Апгрейд' },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.id ? 'bg-accent-purple text-white' :
              (step === 'target' && i === 0) || (step === 'confirm' && i < 2)
                ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-bg-card text-text-muted'
            }`}>
              {(step === 'target' && i === 0) || (step === 'confirm' && i < 2) ? '✓' : i + 1}
            </div>
            {i < 2 && <div className="flex-1 h-0.5 bg-bg-card min-w-4" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select source */}
      {step === 'source' && (
        <div className="px-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">
            Выбери предмет для апгрейда ({inventory.length} доступно):
          </h3>
          {inventory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-text-muted">Инвентарь пуст</p>
              <p className="text-text-muted text-sm">Открой кейс, чтобы получить предметы!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {inventory.map((ui) => (
                <ItemCard
                  key={ui.id}
                  item={ui.item}
                  onClick={() => { setSourceItem(ui); setStep('target') }}
                  size="md"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select target */}
      {step === 'target' && sourceItem && (
        <div className="px-4">
          <div className="bg-bg-card rounded-2xl p-4 border border-white/10 mb-4 flex items-center gap-3">
            <span className="text-3xl">{sourceItem.item.emoji}</span>
            <div>
              <p className="text-xs text-text-muted">Выбранный предмет</p>
              <p className="font-bold text-text-primary">{sourceItem.item.name}</p>
              <p className="text-xs text-yellow-400">🪙 {sourceItem.item.gameValue}</p>
            </div>
            <button onClick={() => setStep('source')} className="ml-auto text-text-muted text-xs">✕ Сменить</button>
          </div>

          <h3 className="text-sm font-semibold text-text-secondary mb-3">
            Выбери желаемый предмет:
          </h3>
          <div className="flex flex-wrap gap-3">
            {allItems.filter(i => i.id !== sourceItem.item.id).map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => { setTargetItem(item); setStep('confirm') }}
                size="md"
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && sourceItem && targetItem && (
        <div className="px-4">
          <AnimatePresence>
            {spinning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-bg-primary flex flex-col items-center justify-center gap-6"
              >
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-7xl"
                >
                  ⚡
                </motion.div>
                <h2 className="text-2xl font-bold text-text-primary">Апгрейд...</h2>
                <div className="flex gap-3 items-center">
                  <span className="text-3xl">{sourceItem.item.emoji}</span>
                  <motion.span
                    animate={{ x: [-5, 5, -5] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                    className="text-accent-purple text-2xl"
                  >
                    →
                  </motion.span>
                  <span className="text-3xl">{targetItem.emoji}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual representation */}
          <div className="flex items-center justify-center gap-6 my-6">
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-2"
                style={{ background: `${sourceItem.item.color}20`, border: `2px solid ${sourceItem.item.color}50` }}
              >
                {sourceItem.item.emoji}
              </div>
              <p className="text-xs text-text-muted">{sourceItem.item.name}</p>
              <p className="text-xs text-yellow-400">🪙 {sourceItem.item.gameValue}</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <motion.div
                className="text-3xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ⚡
              </motion.div>
              {odds && (
                <div className="bg-bg-card border border-white/10 rounded-xl px-3 py-1 text-center">
                  <p className="text-xs text-text-muted">Шанс</p>
                  <p className="font-bold text-accent-purple">{odds.chance}%</p>
                  <p className="text-xs text-text-muted">x{odds.ratio}</p>
                </div>
              )}
            </div>

            <div className="text-center">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-2"
                style={{ background: `${targetItem.color}20`, border: `2px solid ${targetItem.color}50` }}
              >
                {targetItem.emoji}
              </div>
              <p className="text-xs text-text-muted">{targetItem.name}</p>
              <p className="text-xs text-yellow-400">🪙 {targetItem.gameValue}</p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-xs text-center">
              ⚠️ При неудаче предмет «{sourceItem.item.name}» будет потерян!
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('target')}
              className="flex-1 py-3.5 rounded-2xl border border-white/20 text-text-secondary font-medium"
            >
              ← Назад
            </button>
            <motion.button
              onClick={handleUpgrade}
              disabled={upgrading}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 btn-neon"
            >
              {upgrading ? <LoadingSpinner size="sm" /> : `⚡ Апгрейд (${odds?.chance || '?'}%)`}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
