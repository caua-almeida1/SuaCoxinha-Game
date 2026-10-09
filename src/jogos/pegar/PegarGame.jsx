import { useMemo } from 'react'

import './pegar.css'
import Cenario from './Cenario.jsx'
import Coxinildo from './Coxinildo.jsx'
import Topo from '../comum/Topo.jsx'
import { CartaoOferta, VitrineAoVivo } from '../comum/Oferta.jsx'
import { ofertaPelaPartida, produtoAleatorio } from '../comum/ofertas.js'
import { useSom } from '../comum/som.js'
import { CATALOGO, BONS, RUINS, ItemCaindo } from '../comum/itens.jsx'
import { useJogo } from './useJogo.js'

/* Pega Pega do Coxinildo.

   O mascote passeia pelo Vale da Coxinha com um prato em cada mão. Do céu cai
   coxinha, churros, refri e copo mágico (ponto), misturados com brócolis,
   pimenta, bomba e óleo queimado (tira uma das três vidas). */

const CLIMAS = {
  sol: { rotulo: 'Dia de sol', icone: '☀' },
  nuvens: { rotulo: 'Céu de nuvens', icone: '☁' },
  arcoiris: { rotulo: 'Arco-íris', icone: '🌈' },
  noite: { rotulo: 'Noite estrelada', icone: '☾' },
}

function Vidas({ quantidade }) {
  return (
    <div className="vidas" aria-label={`${quantidade} de 3 vidas`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="vida" data-cheia={i < quantidade} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 21s-8-5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 3.5C20 16 12 21 12 21Z" />
          </svg>
        </span>
      ))}
    </div>
  )
}

function Legenda({ chaves, titulo, tom }) {
  return (
    <div className="legenda" data-tom={tom}>
      <h3>{titulo}</h3>
      <ul>
        {chaves.map((chave) => {
          const { Sprite, rotulo, pontos } = CATALOGO[chave]
          return (
            <li key={chave}>
              <span className="legenda__arte">
                <Sprite />
              </span>
              <span className="legenda__nome">{rotulo}</span>
              {tom === 'bom' && <span className="legenda__valor">+{pontos}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function PegarGame({ aoVoltar }) {
  const {
    palcoRef,
    cenaRef,
    heroiRef,
    estado,
    placar,
    itens,
    efeitos,
    fase,
    recorde,
    contagem,
    iniciar,
    voltarAoMenu,
    pausar,
    retomar,
    definirTecla,
    pular,
    aoTocarPalco,
    aoArrastarPalco,
    aoSoltarPalco,
  } = useJogo()
  const { somLigado, alternarSom } = useSom()

  const clima = CLIMAS[fase]
  const multiplicador = 1 + Math.min(4, Math.floor(placar.combo / 4))

  /* a oferta do fim de jogo é o produto de verdade do item que a pessoa mais pegou */
  const ofertaFim = useMemo(() => (estado === 'fim' ? ofertaPelaPartida(contagem) : null), [estado, contagem])
  const ofertaPausa = useMemo(() => (estado === 'pausado' ? produtoAleatorio() : null), [estado])

  /* Botões de celular: seguram a tecla enquanto o dedo estiver em cima. */
  const segurar = (nome) => ({
    onPointerDown: (evento) => {
      evento.preventDefault()
      evento.stopPropagation()
      evento.currentTarget.setPointerCapture?.(evento.pointerId)
      definirTecla(nome, true)
    },
    onPointerUp: () => definirTecla(nome, false),
    onPointerCancel: () => definirTecla(nome, false),
    onLostPointerCapture: () => definirTecla(nome, false),
  })

  return (
    <main className="jogo" data-estado={estado}>
      <Topo
        titulo="Pega Pega"
        lugar="Vale da Coxinha"
        aoVoltar={aoVoltar}
        somLigado={somLigado}
        alternarSom={alternarSom}
        pausar={estado === 'jogando' ? pausar : null}
      />

      {/* ===================== palco ===================== */}
      <div
        className="palco"
        ref={palcoRef}
        data-fase={fase}
        onPointerDown={estado === 'jogando' ? aoTocarPalco : undefined}
        onPointerMove={estado === 'jogando' ? aoArrastarPalco : undefined}
        onPointerUp={aoSoltarPalco}
        onPointerCancel={aoSoltarPalco}
      >
        <Cenario cenaRef={cenaRef} fase={fase} />

        <div className="palco__itens">
          {itens.map((item) => (
            <ItemCaindo key={item.id} chave={item.chave} x={item.x} y={item.y} giro={item.giro} lado={item.lado} />
          ))}
        </div>

        <Coxinildo ref={heroiRef} altura={150} />

        <div className="palco__efeitos">
          {efeitos.map((efeito) => (
            <span
              key={efeito.id}
              className="efeito"
              data-tipo={efeito.tipo}
              style={{ transform: `translate3d(${efeito.x}px, ${efeito.y}px, 0)` }}
            >
              {efeito.texto}
            </span>
          ))}
        </div>

        {/* ----- painel de madeira ----- */}
        <div className="painel">
          <Vidas quantidade={placar.vidas} />

          <div className="painel__pontos">
            <span className="painel__rotulo">Pontos</span>
            <strong>{placar.pontos}</strong>
          </div>

          <div className="painel__coluna">
            <span className="painel__rotulo">Recorde</span>
            <strong>{recorde}</strong>
          </div>

          <div className="painel__coluna">
            <span className="painel__rotulo">Nível</span>
            <strong>{placar.nivel}</strong>
          </div>

          <div className="painel__clima" key={fase}>
            <span aria-hidden="true">{clima.icone}</span>
            {clima.rotulo}
          </div>
        </div>

        {multiplicador > 1 && estado === 'jogando' && (
          <div className="combo" key={multiplicador}>
            combo ×{multiplicador}
          </div>
        )}

        <VitrineAoVivo ativo={estado === 'jogando'} posicao="topo" />

        {/* ----- controles de toque ----- */}
        {estado === 'jogando' && (
          <>
            <div className="dica-toque" aria-hidden="true">
              Arraste o Coxinildo · puxe pra cima para pular
            </div>
            <div className="controles">
              <div className="controles__setas">
                <button type="button" className="controle" {...segurar('esq')} aria-label="Ir para a esquerda">
                  ◀
                </button>
                <button type="button" className="controle" {...segurar('dir')} aria-label="Ir para a direita">
                  ▶
                </button>
              </div>
              <button
                type="button"
                className="controle controle--pulo"
                onPointerDown={(evento) => {
                  evento.preventDefault()
                  evento.stopPropagation()
                  pular()
                }}
                aria-label="Pular"
              >
                ⤒
              </button>
            </div>
          </>
        )}

        {/* ===================== telas ===================== */}
        {estado === 'menu' && (
          <div className="tela">
            <div className="quadro quadro--largo">
              <span className="quadro__faixa">Sua Coxinha apresenta</span>
              <h1 className="quadro__titulo">Pega Pega</h1>
              <p className="quadro__texto">
                O Coxinildo saiu para passear com um prato em cada mão. Do céu começou a cair comida —
                e também umas coisas que coxinha nenhuma merece. Encha os pratos, desvie do resto.
              </p>

              <div className="quadro__legendas">
                <Legenda titulo="Pegue nos pratos" chaves={BONS} tom="bom" />
                <Legenda titulo="Fuja destes" chaves={RUINS} tom="ruim" />
              </div>

              <div className="quadro__teclas">
                <div>
                  <kbd>A</kbd><kbd>D</kbd> <span>ou</span> <kbd>←</kbd><kbd>→</kbd>
                  <small>Andar</small>
                </div>
                <div>
                  <kbd>Espaço</kbd> <span>ou</span> <kbd>W</kbd>
                  <small>Pular</small>
                </div>
                <div>
                  <kbd>Esc</kbd>
                  <small>Pausar</small>
                </div>
              </div>

              <button type="button" className="botao-principal" onClick={iniciar}>
                Começar <span aria-hidden="true">→</span>
              </button>

              <small className="quadro__rodape">
                No celular, arraste o Coxinildo com o dedo e puxe pra cima para pular — ou use os botões.
              </small>
            </div>
          </div>
        )}

        {estado === 'pausado' && (
          <div className="tela">
            <div className="quadro">
              <h2 className="quadro__titulo quadro__titulo--medio">Pausa</h2>
              <p className="quadro__texto">O Coxinildo aproveitou para respirar. E beliscar alguma coisa…</p>
              <CartaoOferta produto={ofertaPausa} chamada="Pausa pro lanche?" />
              <button type="button" className="botao-principal" onClick={retomar}>
                Continuar
              </button>
              <button type="button" className="botao-secundario" onClick={voltarAoMenu}>
                Sair da partida
              </button>
            </div>
          </div>
        )}

        {estado === 'fim' && (
          <div className="tela">
            <div className="quadro">
              <span className="quadro__faixa">Fim de jogo</span>
              <h2 className="quadro__titulo quadro__titulo--medio">
                {placar.pontos >= recorde && placar.pontos > 0 ? 'Novo recorde!' : 'Os pratos caíram'}
              </h2>

              <div className="resultado">
                <div>
                  <span>Pontos</span>
                  <strong>{placar.pontos}</strong>
                </div>
                <div>
                  <span>Pegou</span>
                  <strong>{placar.pegos}</strong>
                </div>
                <div>
                  <span>Recorde</span>
                  <strong>{recorde}</strong>
                </div>
              </div>

              <CartaoOferta produto={ofertaFim} chamada="Pegou fome também?" />

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
