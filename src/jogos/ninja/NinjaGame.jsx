import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import './ninja.css'
import mascote from '../../assets/mascote.webp'
import Topo from '../comum/Topo.jsx'
import { CartaoOferta, VitrineAoVivo } from '../comum/Oferta.jsx'
import { ofertaPelaPartida, produtoAleatorio } from '../comum/ofertas.js'
import { iniciarAudio, sons, useSom } from '../comum/som.js'
import { useRecorde, RECORDES } from '../comum/recorde.js'
import { usePausaAutomatica } from '../comum/usePausaAutomatica.js'
import { CATALOGO, BONS } from '../comum/itens.jsx'

/* Coxinha Ninja — Fruit Ninja na cozinha da Sua Coxinha.

   Os salgados são jogados para cima de trás do balcão; passe o dedo (ou o
   mouse apertado) para cortar. Cada um que cai inteiro é um erro, três erros
   e acabou. Cortou a bomba, acabou na hora. Cortar 3 ou mais num golpe só
   vale combo.

   Mesmo esquema do Pega Pega: o mundo vive num ref mutável e o React só
   redesenha uma vez por quadro, lendo dali. */

const MAX_ERROS = 3
const SEGUNDOS_POR_NIVEL = 22
const VIDA_TRILHA = 0.11 // segundos que o rastro da faca fica na tela
const JANELA_COMBO = 0.28

const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)]
const acaso = (min, max) => min + Math.random() * (max - min)

/* distância do ponto (px, py) ao segmento a→b */
function distanciaAoSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const comprimento = dx * dx + dy * dy
  let t = comprimento ? ((px - ax) * dx + (py - ay) * dy) / comprimento : 0
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

function mundoNovo() {
  return {
    l: 0, a: 0, k: 1, g: 900,
    itens: [], metades: [], respingos: [], textos: [], trilha: [], fila: [],
    seq: 0, t: 0, proximaOnda: 0.6, nivel: 1,
    pontos: 0, erros: 0, cortados: 0, melhorCombo: 0, contagem: {},
    dedo: null, gesto: { cortes: 0, ultimo: 0 },
    explosao: null, fimEm: 0, acabou: false, humor: '',
  }
}

/* -------------------------------------------------------------------
   Peças da tela
------------------------------------------------------------------- */

function Item({ item }) {
  const { Sprite, tipo } = item.chave === 'bomba' ? BOMBA : CATALOGO[item.chave]
  return (
    <div
      className="ninja-item"
      data-tipo={tipo}
      style={{
        width: `${item.lado}px`,
        height: `${item.lado}px`,
        transform: `translate3d(${item.x - item.lado / 2}px, ${item.y - item.lado / 2}px, 0) rotate(${item.giro}deg)`,
      }}
    >
      <Sprite />
    </div>
  )
}

function Metade({ peca }) {
  const { Sprite, recheio } = CATALOGO[peca.chave]
  return (
    <div
      className="metade"
      style={{
        width: `${peca.lado}px`,
        height: `${peca.lado}px`,
        opacity: Math.min(1, peca.vida * 2),
        transform: `translate3d(${peca.x - peca.lado / 2}px, ${peca.y - peca.lado / 2}px, 0) rotate(${peca.angulo + peca.giro}deg)`,
      }}
    >
      <div className="metade__recorte" data-lado={peca.lado2}>
        <div className="metade__sprite" style={{ transform: `rotate(${peca.giroItem - peca.angulo}deg)` }}>
          <Sprite />
        </div>
        <span className="metade__recheio" style={{ background: recheio }} />
      </div>
    </div>
  )
}

function Erros({ quantidade }) {
  return (
    <div className="ninja-erros" aria-label={`${quantidade} de ${MAX_ERROS} erros`}>
      {Array.from({ length: MAX_ERROS }, (_, i) => (
        <span key={i} data-errou={i < quantidade} aria-hidden="true">
          ✕
        </span>
      ))}
    </div>
  )
}

const BOMBA = { tipo: 'ruim', Sprite: CATALOGO.bomba.Sprite, rotulo: 'Bomba' }

/* -------------------------------------------------------------------
   O jogo
------------------------------------------------------------------- */

export default function NinjaGame({ aoVoltar }) {
  const palcoRef = useRef(null)
  const trilhaRef = useRef(null)
  const brilhoRef = useRef(null)
  const mundo = useRef(mundoNovo())

  const [estado, setEstado] = useState('menu') // menu | jogando | pausado | fim
  const [, redesenhar] = useReducer((n) => n + 1, 0)
  const [resumo, setResumo] = useState({ pontos: 0, cortados: 0, melhorCombo: 0, contagem: {}, bomba: false })
  const [recorde, registrarRecorde] = useRecorde(RECORDES.ninja)
  const [novoRecorde, setNovoRecorde] = useState(false)
  const { somLigado, alternarSom } = useSom()

  const pausar = useCallback(() => setEstado((e) => (e === 'jogando' ? 'pausado' : e)), [])
  const retomar = useCallback(() => setEstado((e) => (e === 'pausado' ? 'jogando' : e)), [])
  usePausaAutomatica(estado === 'jogando', pausar)

  /* ---------------- medidas ---------------- */

  const medir = useCallback(() => {
    const palco = palcoRef.current
    if (!palco) return
    const { width, height } = palco.getBoundingClientRect()
    if (!width || !height) return
    const m = mundo.current
    m.l = width
    m.a = height
    m.k = Math.min(1.4, Math.max(0.65, Math.min(height / 640, (width / 900) * 1.7)))
    m.g = height * 1.25
  }, [])

  useEffect(() => {
    medir()
    const palco = palcoRef.current
    if (!palco || typeof ResizeObserver === 'undefined') return undefined
    const observador = new ResizeObserver(medir)
    observador.observe(palco)
    return () => observador.disconnect()
  }, [medir])

  /* ---------------- começar / acabar ---------------- */

  const iniciar = useCallback(() => {
    iniciarAudio()
    mundo.current = mundoNovo()
    medir()
    setNovoRecorde(false)
    setEstado('jogando')
  }, [medir])

  const encerrar = useCallback(() => {
    const m = mundo.current
    sons.perdeu()
    trilhaRef.current?.setAttribute('points', '')
    brilhoRef.current?.setAttribute('points', '')
    setNovoRecorde(registrarRecorde(m.pontos))
    setResumo({
      pontos: m.pontos,
      cortados: m.cortados,
      melhorCombo: m.melhorCombo,
      contagem: { ...m.contagem },
      bomba: Boolean(m.explosao),
    })
    setEstado('fim')
  }, [registrarRecorde])

  /* ---------------- lançar ---------------- */

  const lancar = (m, bomba) => {
    const chave = bomba ? 'bomba' : sortear(BONS)
    const tamanho = bomba ? 1 : CATALOGO[chave].tamanho
    const lado = 86 * m.k * tamanho
    const x = acaso(0.14, 0.86) * m.l
    const altura = acaso(0.5, 0.82) * m.a
    const vy = -Math.sqrt(2 * m.g * altura)
    const tempoTopo = -vy / m.g
    const vx = ((m.l / 2 - x) / (tempoTopo * 2)) * acaso(0.3, 1)

    m.itens.push({
      id: ++m.seq, chave, bomba, lado, r: lado * 0.44,
      x, y: m.a + lado * 0.6, vx, vy,
      giro: Math.random() * 360, giroV: acaso(-220, 220),
    })
    sons.lancar()
  }

  const novaOnda = (m) => {
    const quantos = 1 + Math.floor(Math.random() * Math.min(5, 1 + m.nivel))
    const chanceBomba = Math.min(0.3, 0.1 + m.nivel * 0.03)
    const temBomba = m.t > 4 && Math.random() < chanceBomba
    const posBomba = Math.floor(Math.random() * quantos)
    for (let i = 0; i < quantos; i += 1) {
      m.fila.push({ em: m.t + i * acaso(0.12, 0.3), bomba: temBomba && i === posBomba })
    }
    m.proximaOnda = m.t + acaso(1.6, 2.6) - Math.min(0.9, m.nivel * 0.1) + quantos * 0.15
  }

  /* ---------------- cortar ---------------- */

  const texto = (m, x, y, conteudo, tipo = 'ponto') => {
    m.textos.push({ id: ++m.seq, x, y, conteudo, tipo, nasceu: m.t })
  }

  const cortar = useCallback((ax, ay, bx, by) => {
    const m = mundo.current
    if (m.explosao) return
    const angulo = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI

    for (let i = m.itens.length - 1; i >= 0; i -= 1) {
      const item = m.itens[i]
      if (distanciaAoSegmento(item.x, item.y, ax, ay, bx, by) > item.r) continue
      m.itens.splice(i, 1)

      if (item.bomba) {
        m.explosao = { x: item.x, y: item.y, em: m.t }
        m.fimEm = m.t + 1.1
        m.humor = 'susto'
        sons.explosao()
        palcoRef.current?.classList.add('ninja--explodiu')
        return
      }

      const def = CATALOGO[item.chave]
      m.pontos += def.pontos
      m.cortados += 1
      m.contagem[item.chave] = (m.contagem[item.chave] || 0) + 1
      sons.corte()

      /* as duas metades saem empurradas para lados opostos da linha do corte */
      const rad = (angulo * Math.PI) / 180
      const nx = -Math.sin(rad) * 140 * m.k
      const ny = Math.cos(rad) * 140 * m.k
      ;['a', 'b'].forEach((lado2, j) => {
        const sinal = j === 0 ? -1 : 1
        m.metades.push({
          id: ++m.seq, chave: item.chave, lado: item.lado, lado2,
          x: item.x, y: item.y,
          vx: item.vx * 0.6 + nx * sinal, vy: Math.min(item.vy, 0) * 0.4 + ny * sinal - 120 * m.k,
          angulo, giroItem: item.giro, giro: 0, giroV: sinal * acaso(90, 260), vida: 1.6,
        })
      })

      m.respingos.push({
        id: ++m.seq, x: item.x, y: item.y, cor: def.recheio,
        tam: item.lado * acaso(1.1, 1.5), rot: Math.random() * 360, nasceu: m.t,
      })
      if (m.respingos.length > 14) m.respingos.shift()

      texto(m, item.x, item.y - item.lado * 0.4, `+${def.pontos}`)

      m.gesto.cortes += 1
      m.gesto.ultimo = m.t
    }
  }, [])

  /* ---------------- ponteiro ---------------- */

  const ponto = (evento) => {
    const caixa = palcoRef.current.getBoundingClientRect()
    return { x: evento.clientX - caixa.left, y: evento.clientY - caixa.top }
  }

  const aoTocar = (evento) => {
    if (estado !== 'jogando') return
    if (evento.target.closest('button, a, .vitrine')) return
    const m = mundo.current
    /* a faca é um dedo só: um toque novo sempre assume, então um pointerup
       perdido (gesto do sistema, por exemplo) nunca trava o corte */
    m.dedo = evento.pointerId
    const p = ponto(evento)
    m.trilha = [{ ...p, t: m.t }]
    try {
      evento.currentTarget.setPointerCapture(evento.pointerId)
    } catch {
      /* sem captura o corte funciona igual dentro do palco */
    }
  }

  const aoArrastar = (evento) => {
    const m = mundo.current
    if (estado !== 'jogando' || evento.pointerId !== m.dedo) return
    const p = ponto(evento)
    const anterior = m.trilha[m.trilha.length - 1]
    m.trilha.push({ ...p, t: m.t })
    if (anterior && Math.hypot(p.x - anterior.x, p.y - anterior.y) > 3) {
      cortar(anterior.x, anterior.y, p.x, p.y)
    }
  }

  const aoSoltar = (evento) => {
    const m = mundo.current
    if (evento.pointerId !== m.dedo) return
    m.dedo = null
  }

  /* ---------------- laço ---------------- */

  useEffect(() => {
    if (estado !== 'jogando') return undefined
    let animacao = 0
    let anterior = performance.now()

    const passo = (dt) => {
      const m = mundo.current
      m.t += dt

      if (m.fimEm) {
        if (m.t >= m.fimEm) m.acabou = true
      } else {
        const nivel = 1 + Math.floor(m.t / SEGUNDOS_POR_NIVEL)
        if (nivel !== m.nivel) {
          m.nivel = nivel
          sons.nivel()
        }
        if (m.t >= m.proximaOnda) novaOnda(m)
        for (let i = m.fila.length - 1; i >= 0; i -= 1) {
          if (m.t >= m.fila[i].em) {
            lancar(m, m.fila[i].bomba)
            m.fila.splice(i, 1)
          }
        }
      }

      /* com a bomba cortada o mundo congela por um instante */
      const ritmo = m.explosao ? 0.15 : 1
      const dtm = dt * ritmo

      for (let i = m.itens.length - 1; i >= 0; i -= 1) {
        const item = m.itens[i]
        item.vy += m.g * dtm
        item.x += item.vx * dtm
        item.y += item.vy * dtm
        item.giro += item.giroV * dtm

        if (item.vy > 0 && item.y - item.lado > m.a) {
          m.itens.splice(i, 1)
          if (!item.bomba && !m.explosao) {
            m.erros += 1
            sons.dano()
            texto(m, Math.min(Math.max(item.x, 30), m.l - 30), m.a - 40 * m.k, '✕', 'erro')
            m.humor = 'triste'
            if (m.erros >= MAX_ERROS) {
              m.fimEm = m.t + 0.6
            }
          }
        }
      }

      for (let i = m.metades.length - 1; i >= 0; i -= 1) {
        const peca = m.metades[i]
        peca.vy += m.g * dtm
        peca.x += peca.vx * dtm
        peca.y += peca.vy * dtm
        peca.giro += peca.giroV * dtm
        peca.vida -= dt
        if (peca.vida <= 0 || peca.y - peca.lado > m.a) m.metades.splice(i, 1)
      }

      while (m.respingos.length && m.t - m.respingos[0].nasceu > 2.6) m.respingos.shift()
      while (m.textos.length && m.t - m.textos[0].nasceu > 1) m.textos.shift()
      while (m.trilha.length && m.t - m.trilha[0].t > VIDA_TRILHA) m.trilha.shift()

      /* combo: vários cortes num golpe só */
      if (m.gesto.cortes && m.t - m.gesto.ultimo > JANELA_COMBO) {
        if (m.gesto.cortes >= 3) {
          const bonus = m.gesto.cortes * 5
          m.pontos += bonus
          m.melhorCombo = Math.max(m.melhorCombo, m.gesto.cortes)
          const ultimo = m.trilha[m.trilha.length - 1] || { x: m.l / 2, y: m.a / 2 }
          texto(m, ultimo.x, ultimo.y, `Combo ×${m.gesto.cortes}  +${bonus}`, 'combo')
          m.humor = 'feliz'
          sons.multiplica()
        }
        m.gesto.cortes = 0
      }

      /* o rastro da faca vai direto no SVG */
      const trilha = trilhaRef.current
      const brilho = brilhoRef.current
      if (trilha && brilho) {
        const pontos = m.trilha.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
        trilha.setAttribute('points', pontos)
        brilho.setAttribute('points', pontos)
      }

      redesenhar()
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
  }, [estado, encerrar])

  /* tira o tremor da explosão quando sai da partida */
  useEffect(() => {
    if (estado === 'menu' || estado === 'jogando') palcoRef.current?.classList.remove('ninja--explodiu')
  }, [estado])

  /* ---------------- teclado: só pausa ---------------- */

  useEffect(() => {
    if (estado !== 'jogando' && estado !== 'pausado') return undefined
    const aoApertar = (evento) => {
      const tecla = evento.key.toLowerCase()
      if (tecla === 'escape' || tecla === 'p') {
        evento.preventDefault()
        setEstado((e) => (e === 'jogando' ? 'pausado' : e === 'pausado' ? 'jogando' : e))
      }
    }
    window.addEventListener('keydown', aoApertar)
    return () => window.removeEventListener('keydown', aoApertar)
  }, [estado])

  /* o humor do Coxinildo volta ao normal sozinho */
  const m = mundo.current
  useEffect(() => {
    if (!m.humor) return undefined
    const id = window.setTimeout(() => {
      if (!m.explosao) m.humor = ''
    }, 900)
    return () => window.clearTimeout(id)
  }, [m.humor, m])

  const ofertaFim = useMemo(() => (estado === 'fim' ? ofertaPelaPartida(resumo.contagem) : null), [estado, resumo])
  const ofertaPausa = useMemo(() => (estado === 'pausado' ? produtoAleatorio() : null), [estado])
  const emJogo = estado === 'jogando' || estado === 'pausado'

  return (
    <main className="jogo jogo--ninja" data-estado={estado}>
      <Topo
        titulo="Coxinha Ninja"
        lugar="Cozinha da Sua Coxinha"
        aoVoltar={aoVoltar}
        somLigado={somLigado}
        alternarSom={alternarSom}
        pausar={estado === 'jogando' ? pausar : null}
      />

      <div
        className="palco ninja"
        ref={palcoRef}
        onPointerDown={aoTocar}
        onPointerMove={aoArrastar}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
      >
        {/* ---------- cozinha ---------- */}
        <div className="cozinha" aria-hidden="true">
          <div className="cozinha__azulejos" />
          <div className="cozinha__letreiro">
            <span>SUA</span>
            <strong>COXINHA</strong>
            <small>coxinharia gourmet</small>
          </div>
          <div className="cozinha__prateleira cozinha__prateleira--esq">
            <i /><i /><i />
          </div>
          <div className="cozinha__prateleira cozinha__prateleira--dir">
            <i /><i /><i />
          </div>
          <div className="cozinha__tabua" />
          <div className="cozinha__vapor">
            <span /><span /><span /><span />
          </div>
          <div className="cozinha__balcao">
            <span className="cozinha__fritadeira" />
          </div>
        </div>

        <div className="ninja__respingos" aria-hidden="true">
          {emJogo &&
            m.respingos.map((r) => (
              <span
                key={r.id}
                className="respingo"
                style={{
                  width: `${r.tam}px`,
                  height: `${r.tam}px`,
                  '--cor': r.cor,
                  opacity: Math.max(0, 1 - (m.t - r.nasceu) / 2.6),
                  transform: `translate3d(${r.x - r.tam / 2}px, ${r.y - r.tam / 2}px, 0) rotate(${r.rot}deg)`,
                }}
              />
            ))}
        </div>

        <img
          className="ninja__mascote"
          data-humor={emJogo ? m.humor : ''}
          src={mascote}
          alt=""
          draggable="false"
        />

        <div className="ninja__itens" aria-hidden="true">
          {emJogo && m.itens.map((item) => <Item key={item.id} item={item} />)}
          {emJogo && m.metades.map((peca) => <Metade key={peca.id} peca={peca} />)}
        </div>

        <div className="ninja__textos" aria-hidden="true">
          {emJogo &&
            m.textos.map((t) => (
              <span
                key={t.id}
                className="ninja-texto"
                data-tipo={t.tipo}
                style={{ transform: `translate3d(${t.x}px, ${t.y}px, 0)` }}
              >
                {t.conteudo}
              </span>
            ))}
        </div>

        <svg className="ninja__faca" aria-hidden="true">
          <polyline ref={brilhoRef} className="ninja__faca-brilho" points="" />
          <polyline ref={trilhaRef} className="ninja__faca-fio" points="" />
        </svg>

        {emJogo && m.explosao && (
          <div
            className="ninja__explosao"
            style={{ left: `${m.explosao.x}px`, top: `${m.explosao.y}px` }}
            aria-hidden="true"
          />
        )}

        {/* ---------- placar ---------- */}
        <div className="ninja__placar">
          <div className="ninja__pontos">
            <span className="ninja__pontos-icone" aria-hidden="true">
              <CATALOGO.coxinha.Sprite />
            </span>
            <strong>{emJogo ? m.pontos : resumo.pontos}</strong>
          </div>
          <span className="ninja__recorde">Recorde {recorde}</span>
        </div>
        <Erros quantidade={emJogo ? m.erros : 0} />

        {/* em cima do letreiro (só decoração), longe de onde os salgados sobem e do placar */}
        <VitrineAoVivo ativo={estado === 'jogando'} posicao="letreiro" primeiraEm={20000} />

        {/* ---------- telas ---------- */}
        {estado === 'menu' && (
          <div className="tela">
            <div className="quadro quadro--largo">
              <span className="quadro__faixa">Sua Coxinha apresenta</span>
              <h1 className="quadro__titulo">Coxinha Ninja</h1>
              <p className="quadro__texto">
                Hora do rush na cozinha! O Coxinildo está jogando os salgados pro alto e você corta tudo no ar
                — só não encosta na bomba.
              </p>

              <div className="quadro__legendas">
                <div className="legenda" data-tom="bom">
                  <h3>Corte tudo isso</h3>
                  <ul>
                    {BONS.map((chave) => {
                      const { Sprite, rotulo, pontos } = CATALOGO[chave]
                      return (
                        <li key={chave}>
                          <span className="legenda__arte"><Sprite /></span>
                          <span className="legenda__nome">{rotulo}</span>
                          <span className="legenda__valor">+{pontos}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <div className="legenda" data-tom="ruim">
                  <h3>Regras da cozinha</h3>
                  <ul>
                    <li>
                      <span className="legenda__arte"><BOMBA.Sprite /></span>
                      <span className="legenda__nome">Cortou a bomba, acabou.</span>
                    </li>
                    <li>
                      <span className="legenda__arte legenda__arte--x">✕</span>
                      <span className="legenda__nome">Deixou cair 3 salgados, acabou.</span>
                    </li>
                    <li>
                      <span className="legenda__arte legenda__arte--x">×3</span>
                      <span className="legenda__nome">3 ou mais num golpe só = combo.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button type="button" className="botao-principal" onClick={iniciar}>
                Afiar a faca <span aria-hidden="true">→</span>
              </button>
              <small className="quadro__rodape">Passe o dedo na tela — ou arraste com o mouse apertado.</small>
            </div>
          </div>
        )}

        {estado === 'pausado' && (
          <div className="tela">
            <div className="quadro">
              <h2 className="quadro__titulo quadro__titulo--medio">Pausa</h2>
              <p className="quadro__texto">A fritadeira espera. Enquanto isso…</p>
              <CartaoOferta produto={ofertaPausa} chamada="Pausa pro lanche?" />
              <button type="button" className="botao-principal" onClick={retomar}>
                Continuar
              </button>
              <button type="button" className="botao-secundario" onClick={() => setEstado('menu')}>
                Sair da partida
              </button>
            </div>
          </div>
        )}

        {estado === 'fim' && (
          <div className="tela">
            <div className="quadro">
              <span className="quadro__faixa">{resumo.bomba ? 'Bum!' : 'Fim de jogo'}</span>
              <h2 className="quadro__titulo quadro__titulo--medio">
                {novoRecorde ? 'Novo recorde!' : resumo.bomba ? 'Cortou a bomba' : 'Caiu no chão'}
              </h2>
              <div className="resultado">
                <div>
                  <span>Pontos</span>
                  <strong>{resumo.pontos}</strong>
                </div>
                <div>
                  <span>Cortou</span>
                  <strong>{resumo.cortados}</strong>
                </div>
                <div>
                  <span>Combo</span>
                  <strong>{resumo.melhorCombo ? `×${resumo.melhorCombo}` : '—'}</strong>
                </div>
              </div>
              <CartaoOferta produto={ofertaFim} chamada="Agora come de verdade" />
              <button type="button" className="botao-principal" onClick={iniciar}>
                Jogar de novo
              </button>
              <button type="button" className="botao-secundario" onClick={aoVoltar}>
                Outros jogos
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
