import { useCallback, useState } from 'react'

/* Sons dos jogos gerados na hora pelo WebAudio — nenhum arquivo para baixar.
   O contexto só nasce no clique de COMEÇAR, então nada toca sem o usuário pedir.
   Ligar/desligar vale para todos os jogos e fica lembrado no navegador. */

const CHAVE_SOM = 'sua-coxinha:jogo:som'

let ctx = null
let ligado = true

try {
  ligado = window.localStorage.getItem(CHAVE_SOM) !== 'off'
} catch {
  /* sem localStorage: começa ligado */
}

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
  try {
    window.localStorage.setItem(CHAVE_SOM, valor ? 'on' : 'off')
  } catch {
    /* segue sem lembrar */
  }
}

export function useSom() {
  const [somLigado, setSomLigado] = useState(ligado)
  const alternarSom = useCallback(() => {
    setSomLigado((valor) => {
      definirSom(!valor)
      return !valor
    })
  }, [])
  return { somLigado, alternarSom }
}

function tocar({ freq, para = freq, dur = 0.12, tipo = 'triangle', volume = 0.12, atraso = 0 }) {
  if (!ctx || !ligado) return

  const osc = ctx.createOscillator()
  const ganho = ctx.createGain()
  const agora = ctx.currentTime + atraso

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
  corte: () => tocar({ freq: 1400, para: 500, dur: 0.09, tipo: 'sawtooth', volume: 0.05 }),
  lancar: () => tocar({ freq: 200, para: 340, dur: 0.12, tipo: 'sine', volume: 0.05 }),
  explosao: () => {
    tocar({ freq: 140, para: 40, dur: 0.7, tipo: 'sawtooth', volume: 0.16 })
    tocar({ freq: 90, para: 30, dur: 0.9, tipo: 'square', volume: 0.08, atraso: 0.05 })
  },
  rebate: (forca = 0) => tocar({ freq: 380 + forca * 30, para: 300 + forca * 30, dur: 0.07, tipo: 'square', volume: 0.07 }),
  parede: () => tocar({ freq: 240, para: 200, dur: 0.05, tipo: 'triangle', volume: 0.05 }),
  multiplica: () => {
    tocar({ freq: 660, para: 990, dur: 0.12, volume: 0.09 })
    tocar({ freq: 880, para: 1320, dur: 0.14, volume: 0.09, atraso: 0.09 })
  },
  pontoMeu: () => {
    tocar({ freq: 523, dur: 0.1, volume: 0.1 })
    tocar({ freq: 784, dur: 0.16, volume: 0.1, atraso: 0.1 })
  },
  pontoDele: () => tocar({ freq: 330, para: 180, dur: 0.3, tipo: 'triangle', volume: 0.1 }),
  bip: (alto = false) => tocar({ freq: alto ? 1046 : 660, dur: alto ? 0.25 : 0.1, tipo: 'square', volume: 0.06 }),
  vitoria: () => [523, 659, 784, 1046].forEach((f, i) => tocar({ freq: f, dur: 0.18, volume: 0.1, atraso: i * 0.12 })),
}
