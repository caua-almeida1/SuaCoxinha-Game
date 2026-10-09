import { useCallback, useEffect, useRef, useState } from 'react'

/* Recorde de cada jogo, guardado no navegador. `registrar(valor)` grava se
   for maior e devolve true quando bateu o recorde. */
export function useRecorde(chave) {
  const [recorde, setRecorde] = useState(() => lerRecorde(chave))
  const atual = useRef(recorde)

  useEffect(() => {
    const valor = lerRecorde(chave)
    atual.current = valor
    setRecorde(valor)
  }, [chave])

  const registrar = useCallback(
    (valor) => {
      if (valor <= atual.current) return false
      atual.current = valor
      setRecorde(valor)
      try {
        window.localStorage.setItem(chave, String(valor))
      } catch {
        /* sem localStorage: o jogo roda igual, só não lembra */
      }
      return true
    },
    [chave],
  )

  return [recorde, registrar]
}

export function lerRecorde(chave) {
  try {
    const salvo = Number(window.localStorage.getItem(chave))
    return Number.isFinite(salvo) && salvo > 0 ? salvo : 0
  } catch {
    return 0
  }
}

export const RECORDES = {
  pegar: 'sua-coxinha:jogo:recorde',
  ninja: 'sua-coxinha:ninja:recorde',
  pong: 'sua-coxinha:pong:vitorias',
}
