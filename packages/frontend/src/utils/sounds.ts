let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return ctx
}

function tone(freq: number, type: OscillatorType, duration: number, volume = 0.3, freqEnd?: number) {
  try {
    const c = getCtx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g); g.connect(c.destination)
    o.type = type
    o.frequency.setValueAtTime(freq, c.currentTime)
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + duration)
    g.gain.setValueAtTime(volume, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    o.start(); o.stop(c.currentTime + duration)
  } catch {}
}

export const sounds = {
  mine: () => tone(200, 'sawtooth', 0.08, 0.2, 90),
  ore: () => { tone(600, 'sine', 0.15, 0.2, 1000); setTimeout(() => tone(900, 'sine', 0.2, 0.15), 80) },
  diamond: () => { tone(800, 'sine', 0.1, 0.25); setTimeout(() => tone(1200, 'sine', 0.15, 0.2), 60); setTimeout(() => tone(1600, 'sine', 0.2, 0.15), 130) },
  crash: () => { tone(300, 'sawtooth', 0.3, 0.4, 60); setTimeout(() => tone(150, 'square', 0.2, 0.3, 50), 80) },
  cashout: () => { tone(500, 'sine', 0.1, 0.2); setTimeout(() => tone(700, 'sine', 0.12, 0.2), 80); setTimeout(() => tone(900, 'sine', 0.15, 0.25), 160) },
  bet: () => tone(400, 'sine', 0.08, 0.15, 500),
  button: () => tone(350, 'sine', 0.06, 0.1, 400),
}
