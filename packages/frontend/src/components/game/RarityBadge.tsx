const rarityConfig: Record<string, { label: string; className: string }> = {
  common:    { label: 'Обычный',    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  uncommon:  { label: 'Необычный',  className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rare:      { label: 'Редкий',     className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  epic:      { label: 'Эпический',  className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  legendary: { label: 'Легендарный', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
}

export function RarityBadge({ rarity }: { rarity: string }) {
  const config = rarityConfig[rarity] || rarityConfig.common
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.className} uppercase tracking-wider`}>
      {config.label}
    </span>
  )
}

export function getRarityGlow(rarity: string): string {
  const glows: Record<string, string> = {
    common: 'glow-common',
    uncommon: 'glow-uncommon',
    rare: 'glow-rare',
    epic: 'glow-epic',
    legendary: 'glow-legendary',
  }
  return glows[rarity] || 'glow-common'
}

export function getRarityBg(rarity: string): string {
  const bgs: Record<string, string> = {
    common: 'rarity-common',
    uncommon: 'rarity-uncommon',
    rare: 'rarity-rare',
    epic: 'rarity-epic',
    legendary: 'rarity-legendary',
  }
  return bgs[rarity] || 'rarity-common'
}
