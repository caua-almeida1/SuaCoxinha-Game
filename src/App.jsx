import { useCallback, useEffect, useRef, useState } from 'react'

import './jogos/comum/base.css'
import Catalogo from './Catalogo.jsx'
import PegarGame from './jogos/pegar/PegarGame.jsx'
import NinjaGame from './jogos/ninja/NinjaGame.jsx'
import PongGame from './jogos/pong/PongGame.jsx'

/* Navegação pelo hash (#/pegar, #/ninja, #/pong): dá para mandar o link de
   um jogo direto, e o botão "voltar" do celular volta ao catálogo. */

const JOGOS = { pegar: PegarGame, ninja: NinjaGame, pong: PongGame }

const lerHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '')
  return JOGOS[id] ? id : null
}

export default function App() {
  const [jogo, setJogo] = useState(lerHash)
  const veioDoCatalogo = useRef(false)

  useEffect(() => {
    const aoMudar = () => setJogo(lerHash())
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])

  /* com um jogo aberto a tela é toda dele */
  useEffect(() => {
    document.body.classList.toggle('jogo-aberto', Boolean(jogo))
    window.scrollTo(0, 0)
  }, [jogo])

  const abrir = useCallback((id) => {
    veioDoCatalogo.current = true
    window.location.hash = `/${id}`
  }, [])

  /* se viemos do catálogo, volta no histórico (assim o "voltar" do celular
     não fica preso no jogo); se o link abriu direto no jogo, troca o hash */
  const voltar = useCallback(() => {
    if (veioDoCatalogo.current) {
      veioDoCatalogo.current = false
      window.history.back()
    } else {
      window.location.hash = '/'
    }
  }, [])

  const Jogo = jogo ? JOGOS[jogo] : null
  return Jogo ? <Jogo key={jogo} aoVoltar={voltar} /> : <Catalogo abrir={abrir} />
}
