import { memo } from 'react'

/* O Vale da Coxinha.
   Tudo aqui é desenho em CSS/SVG dividido em camadas. Cada camada carrega um
   `--d` (profundidade): o laço do jogo escreve `--px` na raiz da cena e o CSS
   desloca cada camada por `--px * --d`, então o fundo anda devagar e a frente
   anda rápido quando o Sr. Coxinha se move.

   O clima (`data-fase`) troca sozinho entre sol, nuvens, arco-íris e noite —
   as cores do céu são variáveis e a transição é feita pelo próprio CSS. */

const ESTRELAS = [
  [6, 14, 1], [13, 32, 0.7], [21, 9, 1.2], [28, 24, 0.6], [34, 40, 0.9],
  [41, 12, 1.1], [47, 30, 0.7], [54, 18, 1], [60, 38, 0.8], [66, 10, 1.2],
  [72, 27, 0.7], [78, 16, 1], [84, 34, 0.9], [90, 20, 1.1], [95, 8, 0.8],
  [11, 44, 0.8], [25, 50, 0.6], [57, 48, 0.7], [69, 45, 0.9], [88, 47, 0.6],
]

const CORES_ARCO = ['#ff5a5a', '#ff9a3c', '#ffd23f', '#5fd36a', '#43b6ff', '#5b63e8', '#a05ce8']

const NUVENS_LONGE = [
  { x: 4, y: 12, s: 0.9 }, { x: 36, y: 6, s: 1.2 }, { x: 68, y: 16, s: 0.8 },
]
const NUVENS_MEIO = [
  { x: 14, y: 22, s: 1.4 }, { x: 54, y: 10, s: 1.1 }, { x: 82, y: 26, s: 1.3 },
]
const NUVENS_PERTO = [
  { x: 24, y: 34, s: 1.8 }, { x: 72, y: 38, s: 1.6 },
]

function Nuvem({ x, y, s }) {
  return (
    <svg
      className="nuvem"
      viewBox="0 0 120 64"
      aria-hidden="true"
      style={{ left: `${x}%`, top: `${y}%`, width: `${s * 150}px` }}
    >
      <g className="nuvem__corpo">
        <ellipse cx="60" cy="44" rx="52" ry="18" />
        <circle cx="44" cy="30" r="22" />
        <circle cx="78" cy="33" r="17" />
        <circle cx="22" cy="37" r="14" />
      </g>
      <ellipse className="nuvem__sombra" cx="60" cy="52" rx="44" ry="8" />
    </svg>
  )
}

/* Árvore gorda, de copa em três bolhas — o jeito mais simples de lembrar
   as árvores de fazenda sem precisar de sprite. */
function Arvore({ x, escala = 1, atras = false }) {
  return (
    <div
      className={`arvore ${atras ? 'arvore--fundo' : ''}`}
      style={{ left: `${x}%`, '--e': escala }}
      aria-hidden="true"
    >
      <span className="arvore__copa arvore__copa--a" />
      <span className="arvore__copa arvore__copa--b" />
      <span className="arvore__copa arvore__copa--c" />
      <span className="arvore__tronco" />
      <span className="arvore__sombra" />
    </div>
  )
}

function Moita({ x, escala = 1 }) {
  return (
    <div className="moita" style={{ left: `${x}%`, '--e': escala }} aria-hidden="true">
      <span /><span /><span />
    </div>
  )
}

function Flor({ x, cor, atraso }) {
  return (
    <span
      className="flor"
      style={{ left: `${x}%`, '--cor': cor, animationDelay: `${atraso}s` }}
      aria-hidden="true"
    />
  )
}

function Cenario({ cenaRef, fase }) {
  return (
    <div className="cena" ref={cenaRef} data-fase={fase} aria-hidden="true">
      {/* ---------- céu ---------- */}
      <div className="cena__ceu" />

      <div className="cena__estrelas">
        {ESTRELAS.map(([x, y, r], i) => (
          <span
            key={i}
            style={{ left: `${x}%`, top: `${y}%`, width: `${r * 4}px`, height: `${r * 4}px`, animationDelay: `${i * 0.23}s` }}
          />
        ))}
      </div>

      <div className="cena__sol">
        <span className="cena__sol-brilho" />
        <span className="cena__sol-disco" />
      </div>

      <div className="cena__lua">
        <span />
      </div>

      <div className="cena__arcoiris">
        <svg viewBox="0 0 200 100" preserveAspectRatio="none">
          {CORES_ARCO.map((cor, i) => {
            const r = 94 - i * 8
            return (
              <path
                key={cor}
                d={`M${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100`}
                fill="none"
                stroke={cor}
                strokeWidth="8"
              />
            )
          })}
        </svg>
      </div>

      <div className="cena__garoa">
        {Array.from({ length: 26 }, (_, i) => (
          <span key={i} style={{ left: `${(i * 3.9 + (i % 3) * 1.4) % 100}%`, animationDelay: `${(i % 7) * 0.21}s` }} />
        ))}
      </div>

      {/* ---------- nuvens em três velocidades ---------- */}
      <div className="camada cena__nuvens cena__nuvens--longe" style={{ '--d': 0.012 }}>
        <div className="deriva deriva--lenta">
          {NUVENS_LONGE.map((n, i) => <Nuvem key={i} {...n} />)}
          {NUVENS_LONGE.map((n, i) => <Nuvem key={`b${i}`} {...n} x={n.x + 50} />)}
        </div>
      </div>

      <div className="camada cena__nuvens cena__nuvens--meio" style={{ '--d': 0.028 }}>
        <div className="deriva deriva--media">
          {NUVENS_MEIO.map((n, i) => <Nuvem key={i} {...n} />)}
          {NUVENS_MEIO.map((n, i) => <Nuvem key={`b${i}`} {...n} x={n.x + 50} />)}
        </div>
      </div>

      {/* ---------- montanhas ---------- */}
      <div className="camada cena__montanhas" style={{ '--d': 0.05 }}>
        <svg viewBox="0 0 1200 300" preserveAspectRatio="none">
          <path d="M0 300V190l120-80 90 60 110-110 130 120 120-60 150 90 120-70 130 80 110-40 20 20v100Z" />
        </svg>
      </div>

      {/* ---------- colinas com floresta distante ---------- */}
      <div className="camada cena__colinas" style={{ '--d': 0.09 }}>
        <svg viewBox="0 0 1200 240" preserveAspectRatio="none">
          <path d="M0 240V150c90-70 200-70 300-20s210 50 320 0 230-50 330 10 250 30 250 30v70Z" />
        </svg>
        <div className="cena__mata">
          {[4, 11, 17, 24, 31, 38, 46, 53, 61, 68, 75, 83, 91, 97].map((x, i) => (
            <Arvore key={x} x={x} escala={0.42 + (i % 3) * 0.05} atras />
          ))}
        </div>
      </div>

      <div className="camada cena__nuvens cena__nuvens--perto" style={{ '--d': 0.055 }}>
        <div className="deriva deriva--rapida">
          {NUVENS_PERTO.map((n, i) => <Nuvem key={i} {...n} />)}
          {NUVENS_PERTO.map((n, i) => <Nuvem key={`b${i}`} {...n} x={n.x + 50} />)}
        </div>
      </div>

      {/* ---------- bosque e a barraquinha da loja ---------- */}
      <div className="camada cena__bosque" style={{ '--d': 0.17 }}>
        <Arvore x={7} escala={0.95} />
        <Arvore x={19} escala={0.72} />

        <div className="barraca">
          <div className="barraca__telhado"><i /><i /><i /><i /><i /><i /></div>
          <div className="barraca__placa">SUA COXINHA</div>
          <div className="barraca__balcao">
            <span className="barraca__poste" />
            <span className="barraca__poste" />
          </div>
        </div>

        <Arvore x={74} escala={0.78} />
        <Arvore x={88} escala={1} />
      </div>

      {/* ---------- cerca de madeira ---------- */}
      <div className="camada cena__cerca" style={{ '--d': 0.24 }}>
        <div className="cerca">
          {Array.from({ length: 22 }, (_, i) => <span key={i} className="cerca__estaca" />)}
          <i className="cerca__trave cerca__trave--alta" />
          <i className="cerca__trave cerca__trave--baixa" />
        </div>
      </div>

      {/* ---------- chão ---------- */}
      <div className="cena__solo">
        <div className="solo__grama">
          <svg className="solo__borda" viewBox="0 0 1200 24" preserveAspectRatio="none">
            <path d="M0 24V8c25-10 50 6 75-2s50-10 75 0 50 10 75 2 50-12 75-2 50 12 75 4 50-14 75-4 50 12 75 4 50-12 75-2 50 10 75 2 50-12 75-2 50 10 75 2 50-10 75 0 50 8 75 2 50-10 75 0v10Z" />
          </svg>
          <div className="camada solo__tufos" style={{ '--d': 0.4 }}>
            {[3, 9, 15, 22, 29, 36, 44, 51, 58, 65, 72, 79, 86, 93, 98].map((x, i) => (
              <span key={x} className="tufo" style={{ left: `${x}%`, '--e': 0.8 + (i % 4) * 0.12 }} />
            ))}
            <Flor x={12} cor="#ff6f91" atraso={0} />
            <Flor x={27} cor="#ffd23f" atraso={0.4} />
            <Flor x={41} cor="#ffffff" atraso={0.9} />
            <Flor x={63} cor="#ff6f91" atraso={0.2} />
            <Flor x={81} cor="#ffd23f" atraso={0.7} />
            <Flor x={94} cor="#b48cff" atraso={1.1} />
          </div>
        </div>
        <div className="solo__terra">
          <span className="solo__pedra" style={{ left: '18%' }} />
          <span className="solo__pedra" style={{ left: '47%', '--e': 0.7 }} />
          <span className="solo__pedra" style={{ left: '78%', '--e': 1.2 }} />
        </div>
      </div>

      {/* ---------- primeiro plano ---------- */}
      <div className="camada cena__frente" style={{ '--d': 0.55 }}>
        <Moita x={-4} escala={1.5} />
        <Moita x={33} escala={0.8} />
        <Moita x={96} escala={1.6} />
      </div>

      <div className="cena__vagalumes">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 7.3 + 4) % 100}%`,
              bottom: `${12 + ((i * 13) % 34)}%`,
              animationDelay: `${(i % 5) * 0.9}s`,
              animationDuration: `${5 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      <div className="cena__clima" />
    </div>
  )
}

export default memo(Cenario)
