import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../stores/userStore'
import { useAppStore } from '../../stores/appStore'
import { sounds } from '../../utils/sounds'

type OreType = 'empty' | 'copper' | 'iron' | 'redstone' | 'lapis' | 'gold' | 'diamond' | 'emerald' | 'tnt' | 'workbench'
type BlockState = 'hidden' | 'cracked' | 'revealed'
type Pickaxe = 'stone' | 'iron' | 'diamond'

interface Block { ore: OreType; hp: number; maxHp: number; state: BlockState }
interface Strike { id: number; row: number; col: number }
interface Impact { id: number; row: number; col: number }

const ORE_CONFIG: Record<OreType, { emoji: string; value: number; label: string; rarity: number }> = {
  empty:     { emoji: '🪨', value: 0,   label: 'Камень',   rarity: 0  },
  copper:    { emoji: '🟫', value: 8,   label: 'Медь',     rarity: 35 },
  iron:      { emoji: '⬜', value: 16,  label: 'Железо',   rarity: 25 },
  redstone:  { emoji: '🔴', value: 24,  label: 'Редстоун', rarity: 15 },
  lapis:     { emoji: '🔵', value: 32,  label: 'Лазурит',  rarity: 10 },
  gold:      { emoji: '🟡', value: 48,  label: 'Золото',   rarity: 7  },
  diamond:   { emoji: '💎', value: 150, label: 'Алмаз',    rarity: 3  },
  emerald:   { emoji: '💚', value: 400, label: 'Изумруд',  rarity: 1  },
  tnt:       { emoji: '💥', value: 0,   label: 'TNT',      rarity: 2  },
  workbench: { emoji: '🔧', value: 0,   label: 'Верстак',  rarity: 2  },
}

const PICKAXE_CONFIG: Record<Pickaxe, { emoji: string; label: string; hp: number; dmg: number }> = {
  stone:   { emoji: '⛏️', label: 'Каменная', hp: 100, dmg: 1 },
  iron:    { emoji: '🪛',  label: 'Железная', hp: 150, dmg: 2 },
  diamond: { emoji: '💎', label: 'Алмазная', hp: 250, dmg: 3 },
}

const COLS = 5; const ROWS = 8

function genOre(): OreType {
  const r = Math.random() * 100; let acc = 0
  const ores: OreType[] = ['tnt','workbench','emerald','diamond','gold','lapis','redstone','iron','copper','empty']
  for (const ore of ores) { acc += ORE_CONFIG[ore].rarity; if (r < acc) return ore }
  return 'empty'
}

function genPickaxe(): Pickaxe {
  const r = Math.random()
  return r < 0.1 ? 'diamond' : r < 0.35 ? 'iron' : 'stone'
}

function buildGrid(): Block[][] {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, () => ({
      ore: row < 2 ? 'empty' : genOre(), hp: 3, maxHp: 3, state: 'hidden' as BlockState,
    }))
  )
}

let strikeId = 0

export function MineGame() {
  const { user, fetchUser } = useUserStore()
  const { showNotification } = useAppStore()
  const [multiplier, setMultiplier] = useState(1)
  const [bet, setBet] = useState(50)
  const [playing, setPlaying] = useState(false)
  const [grid, setGrid] = useState<Block[][]>(buildGrid)
  const [pickaxe, setPickaxe] = useState<Pickaxe>('stone')
  const [pickHp, setPickHp] = useState(100)
  const [pickMaxHp, setPickMaxHp] = useState(100)
  const [earned, setEarned] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [strikes, setStrikes] = useState<Strike[]>([])
  const [impacts, setImpacts] = useState<Impact[]>([])
  const earnedRef = useRef(0)

  earnedRef.current = earned

  const startGame = () => {
    if ((user?.coins || 0) < bet) { showNotification('Недостаточно монет', 'error'); return }
    sounds.button()
    const pk = genPickaxe()
    setPickaxe(pk); setPickHp(PICKAXE_CONFIG[pk].hp); setPickMaxHp(PICKAXE_CONFIG[pk].hp)
    setGrid(buildGrid()); setEarned(0); setMultiplier(1); setPlaying(true)
    showNotification(`⛏️ Кирка: ${PICKAXE_CONFIG[pk].label}`, 'info')
  }

  const mine = useCallback((row: number, col: number) => {
    if (!playing) return

    // Show swinging pickaxe
    const id = ++strikeId
    setStrikes(s => [...s, { id, row, col }])
    setTimeout(() => setStrikes(s => s.filter(x => x.id !== id)), 320)
    // Show impact burst on block break or crack
    const impId = id + 10000
    setImpacts(s => [...s, { id: impId, row, col }])
    setTimeout(() => setImpacts(s => s.filter(x => x.id !== impId)), 500)

    sounds.mine()

    setGrid(prev => {
      const g = prev.map(r => r.map(b => ({ ...b })))
      const block = g[row][col]
      if (block.state === 'revealed') return prev

      const dmg = PICKAXE_CONFIG[pickaxe].dmg * speed
      block.hp = Math.max(0, block.hp - dmg)

      if (block.hp <= 0) {
        block.state = 'revealed'
        const ore = block.ore
        if (ore === 'tnt') {
          for (let dr = -1; dr <= 2; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              const r2 = row+dr, c2 = col+dc
              if (r2>=0 && r2<ROWS && c2>=0 && c2<COLS) { g[r2][c2].state='revealed'; g[r2][c2].hp=0 }
            }
          sounds.crash()
          showNotification('💥 TNT взорвал 3x4 блока!', 'info')
        } else if (ore === 'workbench') {
          setPickaxe(prev => {
            const next = prev==='stone'?'iron':prev==='iron'?'diamond':'diamond'
            setPickHp(PICKAXE_CONFIG[next].hp); setPickMaxHp(PICKAXE_CONFIG[next].hp)
            sounds.cashout()
            showNotification(`🔧 Кирка улучшена до ${PICKAXE_CONFIG[next].label}!`, 'success')
            return next
          })
        } else if (ore !== 'empty') {
          const val = Math.round(ORE_CONFIG[ore].value * bet / 50 * multiplier)
          setEarned(e => e + val)
          setMultiplier(m => parseFloat((m + 0.1).toFixed(1)))
          if (ore === 'diamond' || ore === 'emerald') sounds.diamond()
          else sounds.ore()
          showNotification(`+${val} 🪙 ${ORE_CONFIG[ore].label}`, 'success')
        }
      } else if (block.hp <= block.maxHp / 2) {
        block.state = 'cracked'
      }
      return g
    })

    setPickHp(hp => {
      const newHp = hp - 1
      if (newHp <= 0) {
        setPlaying(false)
        sounds.crash()
        showNotification(`⛏️ Кирка сломалась! Выиграно: ${earnedRef.current} 🪙`, 'info')
        fetchUser()
      }
      return Math.max(0, newHp)
    })
  }, [playing, pickaxe, speed, multiplier, bet])

  const collect = () => {
    setPlaying(false)
    if (earned > 0) { sounds.cashout(); showNotification(`✅ Собрано: +${earned} 🪙`, 'success') }
    fetchUser()
  }

  const getBlockColor = (row: number) => {
    if (row < 2) return '#4A7A2E'
    if (row < 4) return '#7A5C38'
    if (row < 6) return '#5A6170'
    return '#3D4451'
  }

  const pickHpPct = (pickHp / pickMaxHp) * 100

  return (
    <div className="px-3 pb-6">
      <div className="text-center pt-3 pb-3">
        <h2 className="text-2xl font-black text-white">⛏️ Майнинг</h2>
        <p className="text-text-muted text-sm mt-0.5">Копай руду и зарабатывай монеты</p>
      </div>

      {playing && (
        <div className="flex gap-2 mb-3">
          <div className="flex-1 p-2 rounded-xl" style={{ background:'rgba(22,22,40,0.9)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white">{PICKAXE_CONFIG[pickaxe].emoji} {PICKAXE_CONFIG[pickaxe].label}</span>
              <span className="text-xs font-black"
                style={{ color: pickHpPct > 60 ? '#4ADE80' : pickHpPct > 25 ? '#FACC15' : '#F87171' }}>
                {pickHp}/{pickMaxHp}
              </span>
            </div>
            {/* Minecraft-style segmented HP bar */}
            <div className="flex gap-0.5 h-3">
              {Array.from({ length: 20 }, (_, i) => {
                const filled = (i / 20) * 100 < pickHpPct
                return (
                  <div key={i} className="flex-1 rounded-sm"
                    style={{
                      background: filled
                        ? (pickHpPct > 60 ? '#4ADE80' : pickHpPct > 25 ? '#FACC15' : '#F87171')
                        : 'rgba(255,255,255,0.08)',
                      boxShadow: filled && pickHpPct > 60 ? '0 0 4px #4ADE8080' : undefined,
                    }}
                  />
                )
              })}
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl flex flex-col items-center justify-center"
            style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-xs text-text-muted">Добыто</span>
            <span className="text-sm font-black text-yellow-400">🪙 {earned}</span>
          </div>
          <div className="px-3 py-2 rounded-xl flex flex-col items-center justify-center"
            style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)' }}>
            <span className="text-xs text-text-muted">Множ.</span>
            <span className="text-sm font-black text-purple-400">x{multiplier.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="rounded-2xl overflow-hidden mb-3 relative" style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
        {/* Sky */}
        <div style={{ height:40, background:'linear-gradient(180deg,#1a3a6e,#2a5298)' }}
          className="flex items-center justify-center gap-4">
          {playing && <>
            <motion.span className="text-xl" animate={{ x:[-30,30] }} transition={{ duration:6, repeat:Infinity, repeatType:'reverse' }}>☁️</motion.span>
            <motion.span className="text-lg" animate={{ x:[30,-30] }} transition={{ duration:9, repeat:Infinity, repeatType:'reverse' }}>⭐</motion.span>
          </>}
          {!playing && <span className="text-sm text-blue-200 opacity-60">Нажми копать чтобы начать</span>}
        </div>

        {/* Blocks grid (relative container for pickaxe overlays) */}
        <div className="relative" style={{ display:'grid', gridTemplateColumns:`repeat(${COLS}, 1fr)` }}>
          {grid.map((row, ri) =>
            row.map((block, ci) => {
              const isRevealed = block.state === 'revealed'
              const isCracked  = block.state === 'cracked'
              return (
                <motion.button
                  key={`${ri}-${ci}`}
                  onClick={() => mine(ri, ci)}
                  whileTap={!isRevealed && playing ? { scale: 0.80 } : {}}
                  className="relative flex items-center justify-center"
                  style={{
                    height:44, fontSize:20,
                    background: isRevealed ? 'rgba(0,0,0,0.6)' : getBlockColor(ri),
                    border: '1px solid rgba(0,0,0,0.4)',
                    cursor: playing && !isRevealed ? 'pointer' : 'default',
                  }}
                >
                  {isRevealed
                    ? <motion.span initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',damping:10}}>
                        {ORE_CONFIG[block.ore].emoji}
                      </motion.span>
                    : isCracked
                      ? <span style={{ opacity:0.8, fontSize:18 }}>🪨</span>
                      : <span style={{ opacity:0.2, fontSize:9 }}>▪</span>
                  }
                  {/* Crack overlay stages */}
                  {isCracked && (
                    <>
                      <div className="absolute inset-0" style={{
                        background:'repeating-linear-gradient(40deg,transparent,transparent 4px,rgba(0,0,0,0.6) 4px,rgba(0,0,0,0.6) 5px)'
                      }}/>
                      <div className="absolute inset-0" style={{
                        background:'repeating-linear-gradient(-55deg,transparent,transparent 5px,rgba(0,0,0,0.3) 5px,rgba(0,0,0,0.3) 6px)'
                      }}/>
                    </>
                  )}
                </motion.button>
              )
            })
          )}

          {/* Minecraft-style pickaxe swing overlays */}
          <AnimatePresence>
            {strikes.map(s => {
              const cellW = 100 / COLS
              const cellH = 44
              return (
                <motion.div
                  key={s.id}
                  className="absolute pointer-events-none z-20 select-none"
                  style={{
                    left: `${s.col * cellW + cellW / 2}%`,
                    top: s.row * cellH - 10,
                    translateX: '-30%',
                    transformOrigin: '30% 15%',
                    fontSize: '36px',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 0 8px rgba(255,255,200,0.9))',
                  }}
                  initial={{ rotate: -70, opacity: 1, scale: 1.4 }}
                  animate={{ rotate: 30, opacity: [1, 1, 0.3, 0], scale: [1.4, 1.2, 1.0, 0.7] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.2, 0, 0.8, 1] }}
                >
                  ⛏️
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Impact particles on block hit */}
          <AnimatePresence>
            {impacts.map(s => {
              const cellW = 100 / COLS
              const cellH = 44
              const cx = s.col * cellW + cellW / 2
              const cy = s.row * cellH + cellH / 2
              return (
                <React.Fragment key={s.id}>
                  {[0,1,2,3,4,5].map(i => {
                    const angle = (i / 6) * Math.PI * 2
                    const dx = Math.cos(angle) * 18
                    const dy = Math.sin(angle) * 14
                    return (
                      <motion.div key={i}
                        className="absolute pointer-events-none z-30 rounded-full"
                        style={{ left: `${cx}%`, top: cy, width: 5, height: 5,
                          background: i % 2 === 0 ? '#78350F' : '#D97706',
                          marginLeft: -2.5, marginTop: -2.5 }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: dx, y: dy, opacity: 0, scale: 0.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    )
                  })}
                </React.Fragment>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      {!playing ? (
        <>
          <div className="mb-3 p-3 rounded-2xl" style={{ background:'rgba(22,22,40,0.8)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex gap-2">
              {[{v:1,label:'x1'},{v:2,label:'x2'},{v:5,label:'x5'},{v:10,label:'x10'}].map(({v,label}) => (
                <button key={v} onClick={() => setSpeed(v)} className="flex-1 py-2 rounded-xl text-sm font-bold"
                  style={speed===v?{background:'#059669',color:'#fff'}:{background:'rgba(255,255,255,0.07)',color:'#94A3B8'}}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">Множ. скорости: выше = реже руда, но дороже</p>
          </div>
          <div className="mb-3 p-3 rounded-2xl flex items-center gap-3"
            style={{ background:'rgba(22,22,40,0.8)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-yellow-400 font-bold flex-1">★ {bet}</span>
            {[50,100,250].map(v => (
              <button key={v} onClick={() => setBet(v)} className="px-3 py-1 rounded-xl text-xs font-bold"
                style={bet===v?{background:'#7C3AED',color:'#fff'}:{background:'rgba(255,255,255,0.07)',color:'#94A3B8'}}>
                {v}
              </button>
            ))}
            <button onClick={() => setBet(b => Math.max(10, Math.round(b/2)))} className="px-3 py-1 rounded-xl text-xs text-text-secondary" style={{background:'rgba(255,255,255,0.05)'}}>½</button>
            <button onClick={() => setBet(b => b*2)} className="px-3 py-1 rounded-xl text-xs text-text-secondary" style={{background:'rgba(255,255,255,0.05)'}}>x2</button>
          </div>
          <motion.button onClick={startGame} whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-black text-white text-lg"
            style={{ background:'linear-gradient(135deg,#7C3AED,#2563EB)' }}>
            ⛏️ Копать за ★ {bet}
          </motion.button>
        </>
      ) : (
        <motion.button onClick={collect} whileTap={{ scale: 0.97 }}
          animate={{ scale:[1,1.02,1], boxShadow:['0 0 0px #10B981','0 0 16px #10B981','0 0 0px #10B981'] }}
          transition={{ duration:1.2, repeat:Infinity }}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: earned>0?'linear-gradient(135deg,#059669,#10B981)':'rgba(255,255,255,0.1)' }}>
          💰 Собрать {earned} 🪙 и выйти
        </motion.button>
      )}

      {/* Ore reference */}
      <div className="mt-4 p-3 rounded-2xl" style={{ background:'rgba(22,22,40,0.6)', border:'1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs font-bold text-text-secondary mb-2">Призы при ставке {bet}★</p>
        <div className="grid grid-cols-2 gap-1">
          {(['copper','iron','redstone','lapis','gold','diamond','emerald','tnt'] as OreType[]).map(ore => (
            <div key={ore} className="flex items-center gap-2 text-xs">
              <span>{ORE_CONFIG[ore].emoji}</span>
              <span className="text-text-secondary">{ORE_CONFIG[ore].label}</span>
              <span className="text-yellow-400 ml-auto font-bold">
                {ore==='tnt'?'взрыв 3x4':`${Math.round(ORE_CONFIG[ore].value*bet/50)} ★`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
