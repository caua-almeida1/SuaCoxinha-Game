/* Sons do jogo gerados na hora pelo WebAudio — nenhum arquivo para baixar.
   O contexto só nasce no clique de COMEÇAR, então nada toca sem o usuário pedir. */

let ctx = null
let ligado = true

export function iniciarAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return
  }
  const Audio = window.AudioContext || window.webkitAudioContext
  if (!Audio) return
  try {
    ctx = new Audio()
  } catch {
    ctx = null
  }
}

export function definirSom(valor) {
  ligado = valor
}

function tocar({ freq, para = freq, dur = 0.12, tipo = 'triangle', volume = 0.12 }) {
  if (!ctx || !ligado) return

  const osc = ctx.createOscillator()
  const ganho = ctx.createGain()
  const agora = ctx.currentTime

  osc.type = tipo
  osc.frequency.setValueAtTime(freq, agora)
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, para), agora + dur)

  ganho.gain.setValueAtTime(0.0001, agora)
  ganho.gain.exponentialRampToValueAtTime(volume, agora + 0.012)
  ganho.gain.exponentialRampToValueAtTime(0.0001, agora + dur)

  osc.connect(ganho).connect(ctx.destination)
  osc.start(agora)
  osc.stop(agora + dur + 0.02)
}

export const sons = {
  pega: (combo = 0) => tocar({ freq: 520 + Math.min(combo, 8) * 45, para: 880, dur: 0.1 }),
  dano: () => tocar({ freq: 180, para: 60, dur: 0.3, tipo: 'sawtooth', volume: 0.1 }),
  pulo: () => tocar({ freq: 320, para: 560, dur: 0.1, tipo: 'square', volume: 0.06 }),
  perdeu: () => tocar({ freq: 300, para: 70, dur: 0.6, tipo: 'triangle', volume: 0.12 }),
  nivel: () => tocar({ freq: 660, para: 1320, dur: 0.22, volume: 0.1 }),
}
