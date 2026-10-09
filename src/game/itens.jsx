import { memo } from 'react'

/* Tudo que cai do céu. Cada item é um desenho em SVG — nada de imagem extra
   para carregar, e o traço grosso combina com o resto do cenário.
   `tipo: 'bom'` vai para o prato e vale ponto. `tipo: 'ruim'` tira uma vida. */

const Coxinha = memo(function Coxinha() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="g-coxinha" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffd880" />
          <stop offset="0.5" stopColor="#f2a832" />
          <stop offset="1" stopColor="#c87a1c" />
        </linearGradient>
      </defs>
      <path
        d="M50 7c11 19 27 41 27 55a27 27 0 0 1-54 0C23 48 39 26 50 7Z"
        fill="url(#g-coxinha)"
        stroke="#7d470f"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M38 34c4 8 3 15-2 23" fill="none" stroke="#fff3c4" strokeWidth="5" strokeLinecap="round" opacity=".55" />
      <circle cx="40" cy="68" r="3" fill="#7d470f" opacity=".3" />
      <circle cx="58" cy="60" r="2.5" fill="#7d470f" opacity=".3" />
      <circle cx="52" cy="76" r="2.5" fill="#7d470f" opacity=".3" />
    </svg>
  )
})

const Churros = memo(function Churros() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="g-churros" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f0b964" />
          <stop offset="0.5" stopColor="#d99038" />
          <stop offset="1" stopColor="#a9641e" />
        </linearGradient>
      </defs>
      <g transform="rotate(-24 50 50)">
        <rect x="31" y="10" width="38" height="80" rx="19" fill="url(#g-churros)" stroke="#73410f" strokeWidth="5" />
        <path d="M38 24h24M38 40h24M38 56h24M38 72h24" stroke="#73410f" strokeWidth="4" strokeLinecap="round" opacity=".45" />
        <circle cx="44" cy="18" r="2.5" fill="#fff6dd" />
        <circle cx="60" cy="48" r="2.5" fill="#fff6dd" />
        <circle cx="42" cy="66" r="2.5" fill="#fff6dd" />
      </g>
    </svg>
  )
})

const Refri = memo(function Refri() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M62 10 72 34" stroke="#d8dde3" strokeWidth="7" strokeLinecap="round" />
      <path d="M26 28h48l-6 56a8 8 0 0 1-8 7H40a8 8 0 0 1-8-7Z" fill="#e8372c" stroke="#7d1810" strokeWidth="5" strokeLinejoin="round" />
      <path d="M30 50h40l-1.5 14h-37Z" fill="#fff" opacity=".9" />
      <rect x="22" y="18" width="56" height="13" rx="6" fill="#f3f4f6" stroke="#7d1810" strokeWidth="5" />
      <path d="M40 60c2 10 2 18 1 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".45" />
    </svg>
  )
})

const CopoMagico = memo(function CopoMagico() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M30 40c6-12 34-12 40 0 6 12-4 16-4 16s7 4 2 12-20 4-20 4-13 5-18-3 0-13 0-13Z"
        fill="#fff6ea"
        stroke="#7a4a21"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M30 44h40l-5 44a7 7 0 0 1-7 6H42a7 7 0 0 1-7-6Z" fill="#f6d9a8" stroke="#7a4a21" strokeWidth="5" strokeLinejoin="round" />
      <path d="M36 58h28l-2 18H38Z" fill="#8a4f24" opacity=".75" />
      <circle cx="52" cy="26" r="6" fill="#e8372c" stroke="#7d1810" strokeWidth="4" />
    </svg>
  )
})

const MiniCoxinha = memo(function MiniCoxinha() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="g-mini" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffe09a" />
          <stop offset="1" stopColor="#dd9324" />
        </linearGradient>
      </defs>
      <ellipse cx="34" cy="62" rx="22" ry="25" fill="url(#g-mini)" stroke="#7d470f" strokeWidth="5" />
      <ellipse cx="66" cy="54" rx="20" ry="23" fill="url(#g-mini)" stroke="#7d470f" strokeWidth="5" />
      <circle cx="30" cy="60" r="2.5" fill="#7d470f" opacity=".3" />
      <circle cx="68" cy="52" r="2.5" fill="#7d470f" opacity=".3" />
    </svg>
  )
})

const Brocolis = memo(function Brocolis() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M44 56h12v32a6 6 0 0 1-12 0Z" fill="#cfe3a3" stroke="#3d6b22" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="34" cy="42" r="18" fill="#58a832" stroke="#2f5c18" strokeWidth="5" />
      <circle cx="66" cy="44" r="16" fill="#4d9a2c" stroke="#2f5c18" strokeWidth="5" />
      <circle cx="50" cy="28" r="18" fill="#62b63a" stroke="#2f5c18" strokeWidth="5" />
      <circle cx="44" cy="26" r="4" fill="#9ada6c" />
      <circle cx="62" cy="40" r="3.5" fill="#9ada6c" />
    </svg>
  )
})

const Pimenta = memo(function Pimenta() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 18c10 0 14 8 14 8" fill="none" stroke="#3d7a22" strokeWidth="7" strokeLinecap="round" />
      <path d="M42 16h16" stroke="#3d7a22" strokeWidth="7" strokeLinecap="round" />
      <path
        d="M64 26c12 10 14 32 4 46s-30 18-38 8c-6-8 2-12 10-16s12-14 10-24c-1-8 8-19 14-14Z"
        fill="#e02f24"
        stroke="#7d1810"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M58 36c6 10 5 24-2 34" fill="none" stroke="#ff8a7a" strokeWidth="5" strokeLinecap="round" opacity=".7" />
    </svg>
  )
})

const Bomba = memo(function Bomba() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M58 26c4-12 14-12 18-4" fill="none" stroke="#b07a3a" strokeWidth="6" strokeLinecap="round" />
      <path d="M78 16l3-6 3 6 6 3-6 3-3 6-3-6-6-3Z" fill="#ffd23f" />
      <rect x="48" y="22" width="16" height="12" rx="3" fill="#4a4a55" stroke="#1d1d24" strokeWidth="4" />
      <circle cx="48" cy="62" r="29" fill="#33333d" stroke="#14141a" strokeWidth="5" />
      <path d="M34 50c4-6 10-9 16-9" fill="none" stroke="#9a9aa8" strokeWidth="6" strokeLinecap="round" opacity=".8" />
    </svg>
  )
})

const Oleo = memo(function Oleo() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 12c12 20 26 34 26 48a26 26 0 0 1-52 0c0-14 14-28 26-48Z" fill="#4c3a1c" stroke="#231a0b" strokeWidth="5" strokeLinejoin="round" />
      <path d="M38 52c-4 6-5 12-3 18" fill="none" stroke="#a08b55" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <circle cx="62" cy="70" r="4" fill="#1b1409" opacity=".6" />
    </svg>
  )
})

export const CATALOGO = {
  coxinha: { tipo: 'bom', pontos: 12, tamanho: 1.0, rotulo: 'Coxinha', Sprite: Coxinha },
  mini: { tipo: 'bom', pontos: 8, tamanho: 0.9, rotulo: 'Mini coxinha', Sprite: MiniCoxinha },
  churros: { tipo: 'bom', pontos: 10, tamanho: 0.95, rotulo: 'Churros', Sprite: Churros },
  refri: { tipo: 'bom', pontos: 10, tamanho: 0.95, rotulo: 'Refri', Sprite: Refri },
  copo: { tipo: 'bom', pontos: 14, tamanho: 1.0, rotulo: 'Copo mágico', Sprite: CopoMagico },
  brocolis: { tipo: 'ruim', pontos: 0, tamanho: 1.0, rotulo: 'Brócolis', Sprite: Brocolis },
  pimenta: { tipo: 'ruim', pontos: 0, tamanho: 0.95, rotulo: 'Pimenta', Sprite: Pimenta },
  bomba: { tipo: 'ruim', pontos: 0, tamanho: 1.0, rotulo: 'Bomba', Sprite: Bomba },
  oleo: { tipo: 'ruim', pontos: 0, tamanho: 0.95, rotulo: 'Óleo queimado', Sprite: Oleo },
}

export const BONS = ['coxinha', 'mini', 'churros', 'refri', 'copo']
export const RUINS = ['brocolis', 'pimenta', 'bomba', 'oleo']

/* Um item na tela. Recebe só números, e o desenho de dentro é memoizado:
   a cada quadro o React mexe no transform de uma div e para por aí. */
export function ItemCaindo({ chave, x, y, giro, lado }) {
  const { Sprite, tipo } = CATALOGO[chave]

  return (
    <div
      className="item"
      data-tipo={tipo}
      style={{
        width: `${lado}px`,
        height: `${lado}px`,
        transform: `translate3d(${x - lado / 2}px, ${y - lado / 2}px, 0) rotate(${giro}deg)`,
      }}
    >
      <Sprite />
    </div>
  )
}
