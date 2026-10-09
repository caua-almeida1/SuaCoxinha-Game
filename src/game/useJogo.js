import { useCallback, useEffect, useRef, useState } from 'react'
import { BONS, RUINS, CATALOGO } from './itens.jsx'
import { iniciarAudio, definirSom, sons } from './som.js'

/* O motor do jogo.

   Regra de ouro daqui: o que muda 60 vezes por segundo (posição do herói,
   parallax, pratos) é escrito direto no DOM pelos refs. O React só entra
   quando algo realmente aparece ou some — um item novo, uma vida a menos.

   Todas as medidas são em pixels por segundo e multiplicadas por `k`, a
   escala do palco, para o jogo ficar igual no celular e no monitor grande. */

const FASES = ['sol', 'nuvens', 'arcoiris', 'noite']
const DURACAO_FASE = 15000

export const CHAVE_RECORDE = 'sua-coxinha:jogo:recorde'

const VEL_MAX = 430
const ACEL = 3000
const FREIO = 2600
const GRAVIDADE = 2500
const IMPULSO_PULO = 900

const CHAO = 0.86 // altura do palco onde ficam os pés
const ALTURA_HEROI = 0.27
const PROPORCAO_HEROI = 0.86 // largura / altura da imagem do mascote
const SEGUNDOS_POR_NIVEL = 20

const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)]
const limitar = (v, min, max) => Math.min(Math.max(v, min), max)

export function useJogo() {
  const palcoRef = useRef(null)
  const cenaRef = useRef(null)
  const heroiRef = useRef(null)

  const [estado, setEstado] = useState('menu') // menu | jogando | pausado | fim
  const [placar, setPlacar] = useState({ pontos: 0, vidas: 3, combo: 0, nivel: 1, pegos: 0 })
  const [itens, setItens] = useState([])
  const [efeitos, setEfeitos] = useState([])
  const [fase, setFase] = useState('sol')
  const [recorde, setRecorde] = useState(0)
  const [somLigado, setSomLigado] = useState(true)

  const teclas = useRef({ esq: false, dir: false })
  const recordeRef = useRef(0)

  const mundo = useRef({
    l: 0, a: 0, k: 1,
    hHeroi: 140, wHeroi: 120, chaoY: 400,
    x: 0, vx: 0, y: 0, vy: 0, noChao: true, virado: 'dir',
    itens: [], efeitos: [], seq: 0,
    t: 0, proximo: 0.8, invuln: 0,
    pontos: 0, vidas: 3, combo: 0, nivel: 1, pegos: 0,
    classe: '', tinhaItens: false, efeitosMudou: false, acabou: false,
  })

  /* ---------------------------------------------------------------
     Medidas do palco
  --------------------------------------------------------------- */

  const desenhar = useCallback(() => {
    const m = mundo.current
    const heroi = heroiRef.current
    if (!heroi) return

    const px = (m.x - m.wHeroi / 2).toFixed(1)
    const py = (m.chaoY - m.hHeroi - m.y).toFixed(1)
    /* a inclinação entra aqui (e não no CSS) para não ser espelhada
       junto com o personagem quando ele olha para a esquerda */
    const inclina = ((m.vx / (VEL_MAX * m.k)) * 6).toFixed(2)

    heroi.style.setProperty('--h', `${m.hHeroi.toFixed(1)}px`)
    heroi.style.transform = `translate3d(${px}px, ${py}px, 0) rotate(${inclina}deg)`
    heroi.style.setProperty('--ar', limitar(m.y / (170 * m.k), 0, 1).toFixed(2))
    heroi.dataset.virado = m.virado

    let movimento = 'heroi--parado'
    if (!m.noChao) movimento = 'heroi--pula'
    else if (Math.abs(m.vx) > 25 * m.k) movimento = 'heroi--anda'

    const classe = `heroi ${movimento}${m.invuln > 0 ? ' heroi--dano' : ''}`
    if (classe !== m.classe) {
      m.classe = classe
      heroi.className = classe
    }

    const cena = cenaRef.current
    if (cena) cena.style.setProperty('--px', ((m.x - m.l / 2) * 0.55).toFixed(1))
  }, [])

  const medir = useCallback(() => {
    const palco = palcoRef.current
    if (!palco) return

    const m = mundo.current
    const { width, height } = palco.getBoundingClientRect()
    if (!width || !height) return

    m.l = width
    m.a = height
    /* a escala segue sobretudo a altura (é por ela que as coisas caem),
       com um empurrãozinho da largura para o celular não virar miniatura */
    m.k = limitar(Math.min(height / 640, (width / 900) * 1.6), 0.6, 1.4)
    m.hHeroi = limitar(Math.min(height * ALTURA_HEROI, width * 0.34), 92, 230)
    m.wHeroi = m.hHeroi * PROPORCAO_HEROI
    m.chaoY = height * CHAO

    if (!m.x) m.x = width / 2
    m.x = limitar(m.x, m.wHeroi * 0.45, width - m.wHeroi * 0.45)

    desenhar()
  }, [desenhar])

  useEffect(() => {
    medir()
    const palco = palcoRef.current
    if (!palco || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medir)
      return () => window.removeEventListener('resize', medir)
    }
    const observador = new ResizeObserver(medir)
    observador.observe(palco)
    return () => observador.disconnect()
  }, [medir])

  /* ---------------------------------------------------------------
     Recorde guardado no navegador
  --------------------------------------------------------------- */

  useEffect(() => {
    try {
      const salvo = Number(window.localStorage.getItem(CHAVE_RECORDE))
      if (Number.isFinite(salvo) && salvo > 0) {
        recordeRef.current = salvo
        setRecorde(salvo)
      }
    } catch {
      /* navegador sem localStorage: o jogo roda igual, só não lembra */
    }
  }, [])

  /* ---------------------------------------------------------------
     Ciclo do clima — roda sempre, inclusive no menu
  --------------------------------------------------------------- */

  useEffect(() => {
    let i = 0
    const id = window.setInterval(() => {
      i = (i + 1) % FASES.length
      setFase(FASES[i])
    }, DURACAO_FASE)
    return () => window.clearInterval(id)
  }, [])

  /* ---------------------------------------------------------------
     Ações
  --------------------------------------------------------------- */

  const pular = useCallback(() => {
    const m = mundo.current
    if (!m.noChao) return
    m.vy = IMPULSO_PULO * m.k
    m.noChao = false
    sons.pulo()
  }, [])

  const definirTecla = useCallback((nome, valor) => {
    teclas.current[nome] = valor
  }, [])

  const iniciar = useCallback(() => {
    iniciarAudio()
    medir()

    const m = mundo.current
    Object.assign(m, {
      t: 0, vx: 0, y: 0, vy: 0, noChao: true, virado: 'dir',
      itens: [], efeitos: [], proximo: 0.9, invuln: 0,
      pontos: 0, vidas: 3, combo: 0, nivel: 1, pegos: 0,
      tinhaItens: false, efeitosMudou: false, acabou: false,
      x: m.l ? m.l / 2 : 0,
    })
    teclas.current.esq = false
    teclas.current.dir = false

    setItens([])
    setEfeitos([])
    setPlacar({ pontos: 0, vidas: 3, combo: 0, nivel: 1, pegos: 0 })
    setEstado('jogando')
    desenhar()
  }, [desenhar, medir])

  const voltarAoMenu = useCallback(() => setEstado('menu'), [])
  const pausar = useCallback(() => setEstado((e) => (e === 'jogando' ? 'pausado' : e)), [])
  const retomar = useCallback(() => setEstado((e) => (e === 'pausado' ? 'jogando' : e)), [])

  const alternarSom = useCallback(() => {
    setSomLigado((valor) => {
      definirSom(!valor)
      return !valor
    })
  }, [])

  const encerrar = useCallback(() => {
    const m = mundo.current
    sons.perdeu()

    if (m.pontos > recordeRef.current) {
      recordeRef.current = m.pontos
      setRecorde(m.pontos)
      try {
        window.localStorage.setItem(CHAVE_RECORDE, String(m.pontos))
      } catch {
        /* sem localStorage: segue o jogo */
      }
    }

    setEstado('fim')
  }, [])

  /* ---------------------------------------------------------------
     Laço principal
  --------------------------------------------------------------- */

  useEffect(() => {
    if (estado !== 'jogando') return undefined

    let animacao = 0
    let anterior = performance.now()

    const brilharPrato = (lado) => {
      const heroi = heroiRef.current
      if (!heroi) return
      const prato = heroi.querySelector(`.prato--${lado}`)
      if (!prato) return
      prato.classList.remove('prato--brilha')
      void prato.offsetWidth // reinicia a animação
      prato.classList.add('prato--brilha')
    }

    const anotar = (m, tipo, x, y, texto = '') => {
      m.efeitos.push({ id: ++m.seq, tipo, x, y, texto, nasceu: m.t })
      m.efeitosMudou = true
    }

    const nascerItem = (m) => {
      const chanceRuim = Math.min(0.45, 0.16 + m.nivel * 0.04)
      const chave = sortear(Math.random() < chanceRuim ? RUINS : BONS)
      const def = CATALOGO[chave]
      const lado = 58 * m.k * def.tamanho
      const margem = lado * 0.6 + 8
      const x = margem + Math.random() * Math.max(20, m.l - margem * 2)

      m.itens.push({
        id: ++m.seq,
        chave,
        tipo: def.tipo,
        pontos: def.pontos,
        lado,
        x,
        x0: x,
        y: -lado,
        vy: (155 + m.nivel * 16 + Math.random() * 95) * m.k,
        giro: Math.random() * 360,
        giroV: (Math.random() - 0.5) * 140,
        balanco: Math.random() * Math.PI * 2,
        bx: (4 + Math.random() * 16) * m.k,
      })
    }

    const passo = (dt) => {
      const m = mundo.current
      let mudouPlacar = false
      m.t += dt

      /* ----- andar ----- */
      const dir = (teclas.current.dir ? 1 : 0) - (teclas.current.esq ? 1 : 0)
      const controle = m.noChao ? 1 : 0.78

      if (dir !== 0) {
        m.vx += dir * ACEL * m.k * controle * dt
        m.virado = dir > 0 ? 'dir' : 'esq'
      } else {
        const freio = FREIO * m.k * dt
        m.vx = Math.abs(m.vx) <= freio ? 0 : m.vx - Math.sign(m.vx) * freio
      }

      const vmax = VEL_MAX * m.k
      m.vx = limitar(m.vx, -vmax, vmax)
      m.x += m.vx * dt

      const borda = m.wHeroi * 0.42
      if (m.x < borda) { m.x = borda; m.vx = 0 }
      if (m.x > m.l - borda) { m.x = m.l - borda; m.vx = 0 }

      /* ----- pular ----- */
      if (!m.noChao || m.y > 0) {
        m.vy -= GRAVIDADE * m.k * dt
        m.y += m.vy * dt
        if (m.y <= 0) {
          m.y = 0
          m.vy = 0
          m.noChao = true
        }
      }

      if (m.invuln > 0) m.invuln = Math.max(0, m.invuln - dt)

      /* ----- dificuldade ----- */
      const nivel = 1 + Math.floor(m.t / SEGUNDOS_POR_NIVEL)
      if (nivel !== m.nivel) {
        m.nivel = nivel
        mudouPlacar = true
        sons.nivel()
      }

      /* ----- chuva de salgados ----- */
      m.proximo -= dt
      if (m.proximo <= 0) {
        nascerItem(m)
        const base = Math.max(0.42, 1.3 - m.nivel * 0.1)
        m.proximo = base * (0.7 + Math.random() * 0.6)
      }

      /* ----- pratos: dois retângulos presos às luvas ----- */
      const pratoY = m.chaoY - m.hHeroi - m.y + m.hHeroi * 0.6
      const larguraPrato = m.wHeroi * 0.46
      const centroEsq = m.x - m.wHeroi * 0.4
      const centroDir = m.x + m.wHeroi * 0.4

      for (let i = m.itens.length - 1; i >= 0; i -= 1) {
        const item = m.itens[i]

        item.y += item.vy * dt
        item.giro += item.giroV * dt
        item.balanco += dt * 1.7
        item.x = item.x0 + Math.sin(item.balanco) * item.bx

        const base = item.y + item.lado * 0.38
        const alcance = larguraPrato / 2 + item.lado * 0.34

        if (base >= pratoY - 14 * m.k && base <= pratoY + 36 * m.k) {
          const noEsq = Math.abs(item.x - centroEsq) < alcance
          const noDir = Math.abs(item.x - centroDir) < alcance

          if (noEsq || noDir) {
            m.itens.splice(i, 1)
            brilharPrato(noEsq ? 'esq' : 'dir')

            if (item.tipo === 'bom') {
              const multiplicador = 1 + Math.min(4, Math.floor(m.combo / 4))
              const ganho = item.pontos * multiplicador
              m.pontos += ganho
              m.combo += 1
              m.pegos += 1
              sons.pega(m.combo)
              anotar(m, 'ponto', item.x, pratoY, `+${ganho}`)
            } else if (m.invuln > 0) {
              anotar(m, 'poeira', item.x, pratoY)
            } else {
              m.vidas -= 1
              m.combo = 0
              m.invuln = 1.2
              sons.dano()
              anotar(m, 'dano', item.x, pratoY, 'ai!')
              const palco = palcoRef.current
              if (palco) {
                palco.classList.remove('palco--tremor')
                void palco.offsetWidth
                palco.classList.add('palco--tremor')
              }
              if (m.vidas <= 0) m.acabou = true
            }

            mudouPlacar = true
            continue
          }
        }

        /* ----- caiu no chão ----- */
        if (item.y - item.lado * 0.5 > m.chaoY) {
          m.itens.splice(i, 1)
          if (item.tipo === 'bom') {
            if (m.combo > 0) mudouPlacar = true
            m.combo = 0
            anotar(m, 'queda', item.x, m.chaoY + 6)
          } else {
            anotar(m, 'poeira', item.x, m.chaoY + 6)
          }
        }
      }

      /* ----- limpeza dos efeitos ----- */
      while (m.efeitos.length && m.t - m.efeitos[0].nasceu > 1.2) {
        m.efeitos.shift()
        m.efeitosMudou = true
      }

      desenhar()

      if (m.itens.length || m.tinhaItens) {
        m.tinhaItens = m.itens.length > 0
        setItens([...m.itens])
      }

      if (m.efeitosMudou) {
        m.efeitosMudou = false
        setEfeitos([...m.efeitos])
      }

      if (mudouPlacar) {
        setPlacar({
          pontos: m.pontos,
          vidas: Math.max(0, m.vidas),
          combo: m.combo,
          nivel: m.nivel,
          pegos: m.pegos,
        })
      }
    }

    const quadro = (agora) => {
      const dt = Math.min((agora - anterior) / 1000, 0.05)
      anterior = agora
      passo(dt)

      if (mundo.current.acabou) {
        encerrar()
        return
      }
      animacao = requestAnimationFrame(quadro)
    }

    animacao = requestAnimationFrame(quadro)
    return () => cancelAnimationFrame(animacao)
  }, [desenhar, encerrar, estado])

  /* ---------------------------------------------------------------
     Teclado
  --------------------------------------------------------------- */

  useEffect(() => {
    if (estado !== 'jogando' && estado !== 'pausado') return undefined

    const ehEsquerda = (t) => t === 'a' || t === 'arrowleft'
    const ehDireita = (t) => t === 'd' || t === 'arrowright'
    const ehPulo = (t) => t === 'w' || t === 'arrowup' || t === ' '

    const aoApertar = (evento) => {
      const tecla = evento.key.toLowerCase()

      if (tecla === 'escape' || tecla === 'p') {
        evento.preventDefault()
        setEstado((e) => (e === 'jogando' ? 'pausado' : e === 'pausado' ? 'jogando' : e))
        return
      }

      if (estado !== 'jogando') return

      if (ehEsquerda(tecla) || ehDireita(tecla) || ehPulo(tecla)) evento.preventDefault()
      if (ehEsquerda(tecla)) teclas.current.esq = true
      if (ehDireita(tecla)) teclas.current.dir = true
      if (ehPulo(tecla) && !evento.repeat) pular()
    }

    const aoSoltar = (evento) => {
      const tecla = evento.key.toLowerCase()
      if (ehEsquerda(tecla)) teclas.current.esq = false
      if (ehDireita(tecla)) teclas.current.dir = false
    }

    const aoSair = () => {
      teclas.current.esq = false
      teclas.current.dir = false
      setEstado((e) => (e === 'jogando' ? 'pausado' : e))
    }

    const aoTrocarDeAba = () => {
      if (document.hidden) aoSair()
    }

    window.addEventListener('keydown', aoApertar)
    window.addEventListener('keyup', aoSoltar)
    window.addEventListener('blur', aoSair)
    document.addEventListener('visibilitychange', aoTrocarDeAba)

    return () => {
      window.removeEventListener('keydown', aoApertar)
      window.removeEventListener('keyup', aoSoltar)
      window.removeEventListener('blur', aoSair)
      document.removeEventListener('visibilitychange', aoTrocarDeAba)
    }
  }, [estado, pular])

  return {
    palcoRef,
    cenaRef,
    heroiRef,
    estado,
    placar,
    itens,
    efeitos,
    fase,
    recorde,
    somLigado,
    alternarSom,
    iniciar,
    voltarAoMenu,
    pausar,
    retomar,
    definirTecla,
    pular,
  }
}
