import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import './pong.css'
import mascote from '../../assets/mascote.webp'
import Topo from '../comum/Topo.jsx'
import { CartaoOferta, Vitrine } from '../comum/Oferta.jsx'
import { produtoAleatorio } from '../comum/ofertas.js'
import { iniciarAudio, sons, useSom } from '../comum/som.js'
import { useRecorde, RECORDES } from '../comum/recorde.js'
import { usePausaAutomatica } from '../comum/usePausaAutomatica.js'
import { CATALOGO } from '../comum/itens.jsx'

/* Coxinha Pong — Coxinildo × Brócolis na Arena Sua Coxinha.

   Pong em pé (pensado para o celular): você é a bandeja listrada embaixo,
   o Brócolis é a raquete verde em cima, e a bola é uma coxinha. De tempos em
   tempos a coxinha se multiplica — no máximo 3 na quadra ao mesmo tempo.
   Cada coxinha que passa é ponto; quem fizer 7 primeiro leva.

   Tudo medido em relação ao tamanho da quadra (W × H), para jogar igual em
   qualquer tela. */

const PONTOS_PARA_VENCER = 7
const MAX_BOLAS = 3
const CONTAGEM = 3

const acaso = (min, max) => min + Math.random() * (max - min)
const limitar = (v, min, max) => Math.min(Math.max(v, min), max)
const tresDigitos = (n) => String(n).padStart(3, '0')

function mundoNovo() {
  return {
    W: 0, H: 0,
    eu: { x: 0, alvo: null }, ele: { x: 0, erro: 0 },
    bolas: [], textos: [], seq: 0, t: 0,
    placar: { eu: 0, ele: 0 },
    rebatidas: 0, proximaDivisao: 4,
    contagem: CONTAGEM, sacarPara: 1, // 1 = desce para mim, -1 = sobe para ele
    teclas: { esq: false, dir: false },
    acabou: false, tremor: 0, piscaEu: 0, piscaEle: 0, oferta: null, pontosDesdeOferta: 0,
  }
}

function medidas(m) {
  const { W, H } = m
  return {
    raqueteL: W * 0.27,
    raqueteA: Math.max(12, H * 0.022),
    yEu: H * 0.91,
    yEle: H * 0.15,
    r: Math.max(12, Math.min(W * 0.045, H * 0.03)),
    velBase: H * 0.6,
    velMax: H * 1.55,
  }
}

export default function PongGame({ aoVoltar }) {
  const campoRef = useRef(null)
  const mundo = useRef(mundoNovo())
  const [estado, setEstado] = useState('menu') // menu | jogando | pausado | fim
  const [, redesenhar] = useReducer((n) => n + 1, 0)
  const [vitorias, registrarVitorias] = useRecorde(RECORDES.pong)
  const [final, setFinal] = useState({ eu: 0, ele: 0, venceu: false })
  const { somLigado, alternarSom } = useSom()

  const pausar = useCallback(() => setEstado((e) => (e === 'jogando' ? 'pausado' : e)), [])
  const retomar = useCallback(() => setEstado((e) => (e === 'pausado' ? 'jogando' : e)), [])
  usePausaAutomatica(estado === 'jogando', pausar)

  /* o Brócolis fica um pouco mais esperto a cada vitória sua */
  const vitoriasRef = useRef(vitorias)
  vitoriasRef.current = vitorias

  /* ---------------- medidas ---------------- */

  const medir = useCallback(() => {
    const campo = campoRef.current
    if (!campo) return
    const { width, height } = campo.getBoundingClientRect()
    if (!width || !height) return
    const m = mundo.current
    const escalaX = m.W ? width / m.W : 1
    const escalaY = m.H ? height / m.H : 1
    m.eu.x = m.W ? m.eu.x * escalaX : width / 2
    m.ele.x = m.W ? m.ele.x * escalaX : width / 2
    m.bolas.forEach((b) => {
      b.x *= escalaX
      b.y *= escalaY
    })
    m.W = width
    m.H = height
    redesenhar()
  }, [])

  useEffect(() => {
    medir()
    const campo = campoRef.current
    if (!campo || typeof ResizeObserver === 'undefined') return undefined
    const observador = new ResizeObserver(medir)
    observador.observe(campo)
    return () => observador.disconnect()
  }, [medir])

  /* ---------------- começar / acabar ---------------- */

  const iniciar = useCallback(() => {
    iniciarAudio()
    const anterior = mundo.current
    mundo.current = mundoNovo()
    mundo.current.W = anterior.W
    mundo.current.H = anterior.H
    mundo.current.eu.x = anterior.W / 2
    mundo.current.ele.x = anterior.W / 2
    medir()
    setEstado('jogando')
  }, [medir])

  const encerrar = useCallback(() => {
    const m = mundo.current
    const venceu = m.placar.eu > m.placar.ele
    if (venceu) {
      registrarVitorias(vitoriasRef.current + 1)
      sons.vitoria()
    } else {
      sons.perdeu()
    }
    setFinal({ eu: m.placar.eu, ele: m.placar.ele, venceu })
    setEstado('fim')
  }, [registrarVitorias])

  /* ---------------- controles ---------------- */

  const xNoCampo = (evento) => {
    const campo = campoRef.current
    if (!campo) return 0
    return evento.clientX - campo.getBoundingClientRect().left
  }

  const aoMover = (evento) => {
    if (estado !== 'jogando') return
    if (evento.pointerType === 'touch' && evento.buttons === 0 && evento.type === 'pointermove') return
    mundo.current.eu.alvo = xNoCampo(evento)
  }

  const aoTocar = (evento) => {
    if (estado !== 'jogando') return
    if (evento.target.closest('button, a, .vitrine')) return
    try {
      evento.currentTarget.setPointerCapture(evento.pointerId)
    } catch {
      /* sem captura a bandeja segue o dedo igual dentro do palco */
    }
    mundo.current.eu.alvo = xNoCampo(evento)
  }

  useEffect(() => {
    if (estado !== 'jogando' && estado !== 'pausado') return undefined
    const m = mundo.current
    const ehEsq = (t) => t === 'a' || t === 'arrowleft'
    const ehDir = (t) => t === 'd' || t === 'arrowright'

    const aoApertar = (evento) => {
      const tecla = evento.key.toLowerCase()
      if (tecla === 'escape' || tecla === 'p') {
        evento.preventDefault()
        setEstado((e) => (e === 'jogando' ? 'pausado' : e === 'pausado' ? 'jogando' : e))
        return
      }
      if (ehEsq(tecla) || ehDir(tecla)) {
        evento.preventDefault()
        m.eu.alvo = null
      }
      if (ehEsq(tecla)) m.teclas.esq = true
      if (ehDir(tecla)) m.teclas.dir = true
    }
    const aoSoltar = (evento) => {
      const tecla = evento.key.toLowerCase()
      if (ehEsq(tecla)) m.teclas.esq = false
      if (ehDir(tecla)) m.teclas.dir = false
    }
    window.addEventListener('keydown', aoApertar)
    window.addEventListener('keyup', aoSoltar)
    return () => {
      window.removeEventListener('keydown', aoApertar)
      window.removeEventListener('keyup', aoSoltar)
      m.teclas.esq = false
      m.teclas.dir = false
    }
  }, [estado])

  /* ---------------- laço ---------------- */

  useEffect(() => {
    if (estado !== 'jogando') return undefined
    let animacao = 0
    let anterior = performance.now()

    const texto = (m, x, y, conteudo, tipo) => {
      m.textos.push({ id: ++m.seq, x, y, conteudo, tipo, nasceu: m.t })
    }

    const sacar = (m, med) => {
      const angulo = acaso(-0.5, 0.5)
      const vel = med.velBase
      m.bolas.push({
        id: ++m.seq,
        x: m.W / 2,
        y: m.H / 2,
        vx: Math.sin(angulo) * vel,
        vy: Math.cos(angulo) * vel * m.sacarPara,
        vel,
        giro: 0,
      })
      m.rebatidas = 0
      m.proximaDivisao = Math.floor(acaso(3, 5))
    }

    /* a coxinha que acabou de ser rebatida vira duas (ou três) */
    const multiplicar = (m, bola) => {
      if (m.bolas.length >= MAX_BOLAS) return
      const angulo = Math.atan2(bola.vx, Math.abs(bola.vy))
      const desvio = (angulo > 0 ? -1 : 1) * acaso(0.35, 0.6)
      const novoAngulo = limitar(angulo + desvio, -1.1, 1.1)
      const sentido = Math.sign(bola.vy)
      m.bolas.push({
        id: ++m.seq,
        x: bola.x,
        y: bola.y,
        vx: Math.sin(novoAngulo) * bola.vel,
        vy: Math.cos(novoAngulo) * bola.vel * sentido,
        vel: bola.vel,
        giro: bola.giro,
        nova: m.t,
      })
      texto(m, m.W / 2, m.H / 2, m.bolas.length === 2 ? 'Coxinha em dobro!' : 'Coxinha em triplo!', 'multi')
      sons.multiplica()
      m.rebatidas = 0
      m.proximaDivisao = Math.floor(acaso(4, 7))
    }

    const rebater = (m, med, bola, raqueteX, deCima) => {
      const desvio = limitar((bola.x - raqueteX) / (med.raqueteL / 2), -1, 1)
      const angulo = desvio * 1.05 // até ~60°
      bola.vel = Math.min(med.velMax, bola.vel * 1.05)
      bola.vx = Math.sin(angulo) * bola.vel
      bola.vy = Math.cos(angulo) * bola.vel * (deCima ? 1 : -1)
      sons.rebate(Math.abs(desvio) * 4)
      m.rebatidas += 1
      if (deCima) m.piscaEle = m.t
      else {
        m.piscaEu = m.t
        /* depois de cada rebatida sua o Brócolis escolhe onde vai "errar" a mira */
        m.ele.erro = acaso(-0.5, 0.5) * med.raqueteL * (0.55 - Math.min(0.35, vitoriasRef.current * 0.04))
      }
      if (m.rebatidas >= m.proximaDivisao) multiplicar(m, bola)
    }

    const passo = (dt) => {
      const m = mundo.current
      if (!m.W) return
      const med = medidas(m)
      m.t += dt

      /* ----- minha bandeja ----- */
      const metade = med.raqueteL / 2
      const teclado = (m.teclas.dir ? 1 : 0) - (m.teclas.esq ? 1 : 0)
      if (teclado) {
        m.eu.x += teclado * m.W * 1.5 * dt
      } else if (m.eu.alvo !== null) {
        const passoMax = m.W * 5 * dt
        m.eu.x += limitar(m.eu.alvo - m.eu.x, -passoMax, passoMax)
      }
      m.eu.x = limitar(m.eu.x, metade, m.W - metade)

      /* ----- o Brócolis ----- */
      const vindo = m.bolas
        .filter((b) => b.vy < 0)
        .sort((a, b) => a.y / -a.vy - b.y / -b.vy)[0]
      let alvoEle = m.W / 2
      if (vindo) {
        /* prevê onde a bola chega, rebatendo nas paredes */
        const tempo = (vindo.y - med.yEle) / -vindo.vy
        let x = vindo.x + vindo.vx * tempo
        const largura = m.W - med.r * 2
        x -= med.r
        x = ((x % (2 * largura)) + 2 * largura) % (2 * largura)
        if (x > largura) x = 2 * largura - x
        alvoEle = x + med.r + m.ele.erro
      }
      const velEle = m.W * (0.7 + Math.min(0.5, vitoriasRef.current * 0.06) + Math.min(0.3, m.placar.eu * 0.04))
      m.ele.x += limitar(alvoEle - m.ele.x, -velEle * dt, velEle * dt)
      m.ele.x = limitar(m.ele.x, metade, m.W - metade)

      /* ----- contagem entre pontos ----- */
      if (!m.bolas.length) {
        const antes = Math.ceil(m.contagem)
        m.contagem -= dt
        const depois = Math.ceil(m.contagem)
        if (depois !== antes && depois > 0) sons.bip(false)
        if (m.contagem <= 0) {
          sons.bip(true)
          m.oferta = null
          sacar(m, med)
        }
      }

      /* ----- coxinhas ----- */
      for (let i = m.bolas.length - 1; i >= 0; i -= 1) {
        const b = m.bolas[i]
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.giro += (b.vx / med.r) * dt * 40

        if (b.x - med.r < 0) {
          b.x = med.r
          b.vx = Math.abs(b.vx)
          sons.parede()
        } else if (b.x + med.r > m.W) {
          b.x = m.W - med.r
          b.vx = -Math.abs(b.vx)
          sons.parede()
        }

        const meiaA = med.raqueteA / 2
        if (
          b.vy > 0 &&
          b.y + med.r >= med.yEu - meiaA &&
          b.y - med.r <= med.yEu + meiaA &&
          Math.abs(b.x - m.eu.x) <= metade + med.r * 0.8
        ) {
          b.y = med.yEu - meiaA - med.r
          rebater(m, med, b, m.eu.x, false)
        } else if (
          b.vy < 0 &&
          b.y - med.r <= med.yEle + meiaA &&
          b.y + med.r >= med.yEle - meiaA &&
          Math.abs(b.x - m.ele.x) <= metade + med.r * 0.8
        ) {
          b.y = med.yEle + meiaA + med.r
          rebater(m, med, b, m.ele.x, true)
        }

        /* ----- ponto ----- */
        if (b.y - med.r > m.H || b.y + med.r < 0) {
          const meu = b.y + med.r < 0
          m.bolas.splice(i, 1)
          if (meu) {
            m.placar.eu += 1
            sons.pontoMeu()
            texto(m, b.x, med.yEle + 40, '+1', 'meu')
            m.sacarPara = -1
          } else {
            m.placar.ele += 1
            sons.pontoDele()
            texto(m, b.x, med.yEu - 40, '+1 Brócolis', 'dele')
            m.tremor = m.t
            m.sacarPara = 1
          }
          if (m.placar.eu >= PONTOS_PARA_VENCER || m.placar.ele >= PONTOS_PARA_VENCER) {
            m.acabou = true
          } else if (!m.bolas.length) {
            m.contagem = CONTAGEM
            /* a cada 2 pontos, a contagem traz uma oferta da loja */
            m.pontosDesdeOferta += 1
            if (m.pontosDesdeOferta >= 2) {
              m.pontosDesdeOferta = 0
              m.oferta = produtoAleatorio(m.oferta?.id)
            }
          }
        }
      }

      while (m.textos.length && m.t - m.textos[0].nasceu > 1.3) m.textos.shift()
      redesenhar()
    }

    const quadro = (agora) => {
      const dt = Math.min((agora - anterior) / 1000, 0.033)
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

  /* ---------------- desenho ---------------- */

  const m = mundo.current
  const med = medidas(m)
  const emJogo = estado === 'jogando' || estado === 'pausado'
  const placar = emJogo ? m.placar : estado === 'fim' ? final : { eu: 0, ele: 0 }
  const lider = placar.eu === placar.ele ? null : placar.eu > placar.ele ? 'eu' : 'ele'
  const numeroContagem = emJogo && !m.bolas.length ? Math.max(1, Math.ceil(m.contagem)) : null
  const tremendo = emJogo && m.t - m.tremor < 0.35 && m.tremor > 0

  const ofertaFim = useMemo(() => (estado === 'fim' ? produtoAleatorio() : null), [estado])
  const ofertaPausa = useMemo(() => (estado === 'pausado' ? produtoAleatorio() : null), [estado])
  const Bola = CATALOGO.coxinha.Sprite
  const Brocolis = CATALOGO.brocolis.Sprite

  return (
    <main className="jogo jogo--pong" data-estado={estado}>
      <Topo
        titulo="Coxinha Pong"
        lugar="Arena Sua Coxinha"
        aoVoltar={aoVoltar}
        somLigado={somLigado}
        alternarSom={alternarSom}
        pausar={estado === 'jogando' ? pausar : null}
      />

      <div
        className={`palco pong${tremendo ? ' palco--tremor' : ''}`}
        onPointerDown={aoTocar}
        onPointerMove={aoMover}
      >
        {/* ---------- arena em volta ---------- */}
        <div className="arena" aria-hidden="true">
          <div className="arena__torcida arena__torcida--esq" />
          <div className="arena__torcida arena__torcida--dir" />
          <div className="arena__faixa arena__faixa--esq">SUA COXINHA</div>
          <div className="arena__faixa arena__faixa--dir">SUA COXINHA</div>
          <span className="arena__holofote arena__holofote--a" />
          <span className="arena__holofote arena__holofote--b" />
        </div>

        <div className="pong__campo" ref={campoRef}>
          <div className="quadra" aria-hidden="true">
            <span className="quadra__area quadra__area--ele" />
            <span className="quadra__area quadra__area--eu" />
            <span className="quadra__meio" />
            <span className="quadra__circulo">
              <b>SUA</b>
              <b>COXINHA</b>
            </span>
          </div>

          {/* ----- placar no estilo das lives: 010 [eu][ele] 000 ----- */}
          <div className="pong__placar">
            <strong className="pong__numero" data-lider={lider === 'eu'}>{tresDigitos(placar.eu)}</strong>
            <span className="pong__avatar pong__avatar--eu" data-lider={lider === 'eu'}>
              <img src={mascote} alt="Coxinildo" draggable="false" />
              {lider === 'eu' && <i className="pong__coroa" aria-hidden="true">👑</i>}
            </span>
            <span className="pong__avatar pong__avatar--ele" data-lider={lider === 'ele'}>
              <Brocolis />
              {lider === 'ele' && <i className="pong__coroa" aria-hidden="true">👑</i>}
            </span>
            <strong className="pong__numero" data-lider={lider === 'ele'}>{tresDigitos(placar.ele)}</strong>
          </div>

          {numeroContagem !== null && (
            <div className="pong__contagem" key={numeroContagem} aria-live="polite">
              {numeroContagem}
            </div>
          )}

          {/* raquete do Brócolis */}
          <div
            className="raquete raquete--ele"
            data-bateu={emJogo && m.t - m.piscaEle < 0.15}
            style={{
              width: `${med.raqueteL}px`,
              height: `${med.raqueteA}px`,
              transform: `translate3d(${(m.ele.x || m.W / 2) - med.raqueteL / 2}px, ${med.yEle - med.raqueteA / 2}px, 0)`,
            }}
          />

          {/* minha bandeja */}
          <div
            className="raquete raquete--eu"
            data-bateu={emJogo && m.t - m.piscaEu < 0.15}
            style={{
              width: `${med.raqueteL}px`,
              height: `${med.raqueteA}px`,
              transform: `translate3d(${(m.eu.x || m.W / 2) - med.raqueteL / 2}px, ${med.yEu - med.raqueteA / 2}px, 0)`,
            }}
          />

          {emJogo &&
            m.bolas.map((b) => (
              <div
                key={b.id}
                className="bola"
                data-nova={b.nova !== undefined && m.t - b.nova < 0.4}
                style={{
                  width: `${med.r * 2.3}px`,
                  height: `${med.r * 2.3}px`,
                  transform: `translate3d(${b.x - med.r * 1.15}px, ${b.y - med.r * 1.15}px, 0) rotate(${b.giro}deg)`,
                }}
              >
                <Bola />
              </div>
            ))}

          {emJogo &&
            m.textos.map((t) => (
              <span
                key={t.id}
                className="pong-texto"
                data-tipo={t.tipo}
                style={{ transform: `translate3d(${t.x}px, ${t.y}px, 0)` }}
              >
                {t.conteudo}
              </span>
            ))}

          {emJogo && m.bolas.length > 1 && (
            <div className="pong__multi" aria-hidden="true">
              ×{m.bolas.length}
            </div>
          )}

          {estado === 'jogando' && numeroContagem !== null && m.oferta && (
            <Vitrine produto={m.oferta} frase="Intervalo pro lanche" posicao="base" fixa />
          )}
        </div>

        {/* ---------- telas ---------- */}
        {estado === 'menu' && (
          <div className="tela">
            <div className="quadro">
              <span className="quadro__faixa">Sua Coxinha apresenta</span>
              <h1 className="quadro__titulo">Coxinha Pong</h1>
              <p className="quadro__texto">
                Coxinildo × Brócolis, valendo o último salgado da vitrine. Rebata a coxinha com a bandeja —
                e fique esperto: ela se multiplica (até 3 de uma vez!). Quem fizer {PONTOS_PARA_VENCER} pontos
                primeiro, ganha.
              </p>
              <div className="pong__versus" aria-hidden="true">
                <span className="pong__avatar pong__avatar--eu"><img src={mascote} alt="" /></span>
                <b>×</b>
                <span className="pong__avatar pong__avatar--ele"><Brocolis /></span>
              </div>
              <div className="quadro__teclas">
                <div>
                  <kbd>A</kbd><kbd>D</kbd> <span>ou</span> <kbd>←</kbd><kbd>→</kbd> <span>ou o mouse</span>
                  <small>Mover</small>
                </div>
              </div>
              <button type="button" className="botao-principal" onClick={iniciar}>
                Entrar na quadra <span aria-hidden="true">→</span>
              </button>
              <small className="quadro__rodape">
                No celular, arraste o dedo em qualquer lugar da tela. Vitórias até agora: {vitorias}
              </small>
            </div>
          </div>
        )}

        {estado === 'pausado' && (
          <div className="tela">
            <div className="quadro">
              <h2 className="quadro__titulo quadro__titulo--medio">Tempo técnico</h2>
              <p className="quadro__texto">O Brócolis foi beber água. Você bem que podia pedir um lanche…</p>
              <CartaoOferta produto={ofertaPausa} chamada="Pausa pro lanche?" />
              <button type="button" className="botao-principal" onClick={retomar}>
                Voltar pra quadra
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
              <span className="quadro__faixa">{final.venceu ? 'Vitória' : 'Derrota'}</span>
              <h2 className="quadro__titulo quadro__titulo--medio">
                {final.venceu ? 'O Coxinildo venceu!' : 'Deu Brócolis…'}
              </h2>
              <div className="resultado resultado--dois">
                <div>
                  <span>Placar</span>
                  <strong>
                    {final.eu} × {final.ele}
                  </strong>
                </div>
                <div>
                  <span>Vitórias</span>
                  <strong>{vitorias}</strong>
                </div>
              </div>
              <CartaoOferta
                produto={ofertaFim}
                chamada={final.venceu ? 'Comemora com uma dessas' : 'Consola com uma dessas'}
              />
              <button type="button" className="botao-principal" onClick={iniciar}>
                {final.venceu ? 'Revanche do Brócolis' : 'Pedir revanche'}
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
