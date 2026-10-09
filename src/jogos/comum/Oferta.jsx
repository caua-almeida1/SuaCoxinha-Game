import { useEffect, useRef, useState } from 'react'
import { IFOOD_URL, CARDAPIO_URL, linkWhatsApp, precoTexto, produtoAleatorio } from './ofertas.js'
import './oferta.css'

/* Foto do produto vinda do site da loja. Se não carregar (sem internet,
   foto renomeada), some e o cartão continua de pé só com o texto. */
function FotoProduto({ produto, className }) {
  const [quebrou, setQuebrou] = useState(false)
  if (quebrou) return null
  return (
    <img
      className={className}
      src={produto.foto}
      alt={produto.nome}
      loading="lazy"
      draggable="false"
      onError={() => setQuebrou(true)}
    />
  )
}

/* Cartão grande: fim de jogo e pausa. */
export function CartaoOferta({ produto, chamada = 'Bateu a fome?' }) {
  if (!produto) return null
  return (
    <aside className="oferta" aria-label={`Oferta: ${produto.nome}`}>
      <FotoProduto produto={produto} className="oferta__foto" />
      <div className="oferta__corpo">
        <span className="oferta__chamada">{chamada}</span>
        <strong className="oferta__nome">{produto.nome}</strong>
        <span className="oferta__descricao">{produto.descricao}</span>
        <span className="oferta__preco">{precoTexto(produto)}</span>
        <div className="oferta__acoes">
          <a className="oferta__pedir" href={IFOOD_URL} target="_blank" rel="noopener noreferrer">
            Pedir no iFood
          </a>
          <a className="oferta__zap" href={linkWhatsApp(produto)} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </div>
        <a className="oferta__cardapio" href={CARDAPIO_URL} target="_blank" rel="noopener noreferrer">
          Ver cardápio completo →
        </a>
      </div>
    </aside>
  )
}

const FRASES = ['Bateu a fome?', 'Pausa pro lanche?', 'Tá com fome, né?', 'Saindo quentinha!', 'Recarregue as energias']

/* Vitrine ao vivo: um cartãozinho que desliza na tela de tempos em tempos
   enquanto a partida rola. Não bloqueia o jogo — some sozinho, dá pra fechar,
   e tocar em "Pedir" abre o iFood numa aba nova (o jogo pausa ao perder o foco). */
export function VitrineAoVivo({ ativo, primeiraEm = 18000, intervalo = 32000, duracao = 7000, posicao = 'topo' }) {
  const [produto, setProduto] = useState(null)
  const [frase, setFrase] = useState(FRASES[0])
  const ultimo = useRef(null)

  useEffect(() => {
    if (!ativo) {
      setProduto(null)
      return undefined
    }

    let esconder = 0
    const mostrar = () => {
      const novo = produtoAleatorio(ultimo.current)
      ultimo.current = novo.id
      setFrase(FRASES[Math.floor(Math.random() * FRASES.length)])
      setProduto(novo)
      window.clearTimeout(esconder)
      esconder = window.setTimeout(() => setProduto(null), duracao)
    }

    let repetir = 0
    const primeira = window.setTimeout(() => {
      mostrar()
      repetir = window.setInterval(mostrar, intervalo)
    }, primeiraEm)

    return () => {
      window.clearTimeout(primeira)
      window.clearInterval(repetir)
      window.clearTimeout(esconder)
    }
  }, [ativo, primeiraEm, intervalo, duracao])

  if (!produto) return null
  return (
    <Vitrine key={produto.id} produto={produto} frase={frase} posicao={posicao} aoFechar={() => setProduto(null)} />
  )
}

/* O cartãozinho em si — usado pela vitrine ao vivo e, direto, pelo Pong
   na contagem entre um ponto e outro. */
export function Vitrine({ produto, frase = 'Bateu a fome?', posicao = 'topo', aoFechar, fixa = false }) {
  /* o jogo escuta o ponteiro no palco inteiro; a vitrine não deve mexer no jogo */
  const parar = (evento) => evento.stopPropagation()

  return (
    <div className="vitrine" data-posicao={posicao} data-fixa={fixa} onPointerDown={parar} role="status">
      <FotoProduto produto={produto} className="vitrine__foto" />
      <div className="vitrine__texto">
        <span>{frase}</span>
        <strong>{produto.nome}</strong>
        <em>{precoTexto(produto)}</em>
      </div>
      <a className="vitrine__pedir" href={IFOOD_URL} target="_blank" rel="noopener noreferrer">
        Pedir
      </a>
      {aoFechar && (
        <button type="button" className="vitrine__fechar" onClick={aoFechar} aria-label="Fechar oferta">
          ×
        </button>
      )}
    </div>
  )
}
