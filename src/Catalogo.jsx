import './catalogo.css'
import mascote from './assets/mascote.webp'
import { CATALOGO } from './jogos/comum/itens.jsx'
import { PRODUTOS, IFOOD_URL, NOVENOVE_URL, CARDAPIO_URL, SITE_URL, precoTexto } from './jogos/comum/ofertas.js'
import { lerRecorde, RECORDES } from './jogos/comum/recorde.js'

/* Fliperama do Coxinildo: a vitrine de jogos. Cada cartão tem uma mini
   cena desenhada em CSS com a cara do jogo, e embaixo vem o cardápio de
   verdade — o jogo é a desculpa, a coxinha é o objetivo. */

const { Sprite: Coxinha } = CATALOGO.coxinha
const { Sprite: Churros } = CATALOGO.churros
const { Sprite: Mini } = CATALOGO.mini
const { Sprite: Brocolis } = CATALOGO.brocolis
const { Sprite: Bomba } = CATALOGO.bomba
const { Sprite: Refri } = CATALOGO.refri

function CenaPegar() {
  return (
    <div className="previa previa--pegar" aria-hidden="true">
      <span className="previa__sol" />
      <span className="previa__item" style={{ left: '18%', top: '14%', '--g': '-14deg' }}><Coxinha /></span>
      <span className="previa__item" style={{ left: '62%', top: '6%', '--g': '18deg' }}><Churros /></span>
      <span className="previa__item previa__item--ruim" style={{ left: '78%', top: '34%', '--g': '-8deg' }}><Brocolis /></span>
      <span className="previa__item" style={{ left: '40%', top: '30%', '--g': '8deg' }}><Refri /></span>
      <span className="previa__grama" />
      <img className="previa__mascote" src={mascote} alt="" draggable="false" />
    </div>
  )
}

function CenaNinja() {
  return (
    <div className="previa previa--ninja" aria-hidden="true">
      <span className="previa__neon">SUA COXINHA</span>
      <span className="previa__corte" />
      <span className="previa__item previa__item--a" style={{ left: '26%', top: '34%' }}><Coxinha /></span>
      <span className="previa__item previa__item--b" style={{ left: '30%', top: '40%' }}><Coxinha /></span>
      <span className="previa__item" style={{ left: '60%', top: '22%', '--g': '30deg' }}><Mini /></span>
      <span className="previa__item previa__item--ruim" style={{ left: '74%', top: '52%', '--g': '-12deg' }}><Bomba /></span>
      <span className="previa__balcao" />
    </div>
  )
}

function CenaPong() {
  return (
    <div className="previa previa--pong" aria-hidden="true">
      <span className="previa__linha" />
      <span className="previa__raquete previa__raquete--ele" />
      <span className="previa__raquete previa__raquete--eu" />
      <span className="previa__bola" style={{ left: '24%', top: '30%' }}><Coxinha /></span>
      <span className="previa__bola" style={{ left: '52%', top: '50%' }}><Coxinha /></span>
      <span className="previa__bola" style={{ left: '70%', top: '34%' }}><Coxinha /></span>
      <span className="previa__x3">×3</span>
    </div>
  )
}

export const JOGOS = [
  {
    id: 'pegar',
    nome: 'Pega Pega',
    lugar: 'Vale da Coxinha',
    descricao: 'Encha os pratos do Coxinildo com o que cai do céu e fuja do brócolis.',
    recorde: 'pegar',
    rotuloRecorde: 'Recorde',
    Cena: CenaPegar,
  },
  {
    id: 'ninja',
    nome: 'Coxinha Ninja',
    lugar: 'Cozinha da Sua Coxinha',
    descricao: 'Corte os salgados no ar com o dedo. Só não encosta na bomba.',
    recorde: 'ninja',
    rotuloRecorde: 'Recorde',
    Cena: CenaNinja,
  },
  {
    id: 'pong',
    nome: 'Coxinha Pong',
    lugar: 'Arena Sua Coxinha',
    descricao: 'Coxinildo × Brócolis. A coxinha se multiplica — até 3 na quadra!',
    recorde: 'pong',
    rotuloRecorde: 'Vitórias',
    Cena: CenaPong,
  },
]

export default function Catalogo({ abrir }) {
  return (
    <main className="catalogo">
      <header className="catalogo__topo">
        <a className="catalogo__voltar" href={SITE_URL}>
          <span aria-hidden="true">←</span> Voltar ao site
        </a>
        <a className="catalogo__pedir" href={IFOOD_URL} target="_blank" rel="noopener noreferrer">
          Pedir agora
        </a>
      </header>

      <section className="catalogo__hero">
        <div className="catalogo__hero-texto">
          <span className="catalogo__selo">Sua Coxinha apresenta</span>
          <h1>
            Fliperama
            <br />
            do Coxinildo
          </h1>
          <p>Três jogos, uma fome só. Escolha o seu e bata o recorde — o lanche de verdade fica logo ali embaixo.</p>
        </div>
        <img className="catalogo__mascote" src={mascote} alt="Coxinildo, o mascote da Sua Coxinha" draggable="false" />
      </section>

      <section className="catalogo__jogos" aria-label="Escolha um jogo">
        {JOGOS.map(({ id, nome, lugar, descricao, recorde, rotuloRecorde, Cena }) => (
          <button key={id} type="button" className="cartucho" onClick={() => abrir(id)}>
            <Cena />
            <span className="cartucho__info">
              <span className="cartucho__lugar">{lugar}</span>
              <strong className="cartucho__nome">{nome}</strong>
              <span className="cartucho__descricao">{descricao}</span>
              <span className="cartucho__rodape">
                <span className="cartucho__recorde">
                  {rotuloRecorde}: <b>{lerRecorde(RECORDES[recorde])}</b>
                </span>
                <span className="cartucho__jogar">
                  Jogar <span aria-hidden="true">→</span>
                </span>
              </span>
            </span>
          </button>
        ))}
      </section>

      <section className="cardapio" aria-labelledby="cardapio-titulo">
        <div className="cardapio__topo">
          <h2 id="cardapio-titulo">Bateu a fome?</h2>
          <a href={CARDAPIO_URL} target="_blank" rel="noopener noreferrer">
            Cardápio completo →
          </a>
        </div>
        <ul className="cardapio__lista">
          {PRODUTOS.map((produto) => (
            <li key={produto.id} className="prato-loja">
              <img src={produto.foto} alt={produto.nome} loading="lazy" draggable="false" />
              <strong>{produto.nome}</strong>
              <span>{produto.descricao}</span>
              <em>{precoTexto(produto)}</em>
              <a href={IFOOD_URL} target="_blank" rel="noopener noreferrer">
                Pedir
              </a>
            </li>
          ))}
        </ul>
        <div className="cardapio__canais">
          <a className="canal canal--ifood" href={IFOOD_URL} target="_blank" rel="noopener noreferrer">
            Pedir no iFood
          </a>
          <a className="canal canal--99" href={NOVENOVE_URL} target="_blank" rel="noopener noreferrer">
            Pedir no 99Food
          </a>
        </div>
        <small className="cardapio__aviso">Fotos meramente ilustrativas. Preços da loja de Cajamar.</small>
      </section>
    </main>
  )
}
