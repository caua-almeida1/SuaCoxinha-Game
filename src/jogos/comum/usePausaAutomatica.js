import { useEffect } from 'react'

/* Pausa a partida quando a aba some ou a janela perde o foco
   (por exemplo, quando a pessoa toca em "Pedir" e o iFood abre). */
export function usePausaAutomatica(jogando, pausar) {
  useEffect(() => {
    if (!jogando) return undefined
    const aoSair = () => pausar()
    const aoTrocarDeAba = () => {
      if (document.hidden) pausar()
    }
    window.addEventListener('blur', aoSair)
    document.addEventListener('visibilitychange', aoTrocarDeAba)
    return () => {
      window.removeEventListener('blur', aoSair)
      document.removeEventListener('visibilitychange', aoTrocarDeAba)
    }
  }, [jogando, pausar])
}
