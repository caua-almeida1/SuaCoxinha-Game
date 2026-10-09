/* Produtos da loja que aparecem como oferta dentro dos jogos.
   Nomes, descrições e preços copiados do cardápio de suacoxinhaloja.com.br/cajamar;
   as fotos vêm direto do site da loja, então trocar a foto lá troca aqui também.
   Quando o cardápio mudar, é só editar esta lista. */

export const SITE_URL = 'https://www.suacoxinhaloja.com.br/cajamar'
export const CARDAPIO_URL = `${SITE_URL}#cardapio`
export const IFOOD_URL =
  'https://www.ifood.com.br/delivery/cajamar-sp/sua-coxinha-cajamar-vila-poupanca/5ce23c05-ea29-4fb3-99d3-2ac2b289fb57'
export const NOVENOVE_URL = 'https://oia.99app.com/dlp9/xeuFH9'
const WHATSAPP = '5511976403209'

const foto = (nome) => `https://www.suacoxinhaloja.com.br/assets/produtos/${nome}.webp`

export const PRODUTOS = [
  {
    id: 'coxinha-g',
    nome: 'Coxinha G',
    descricao: 'Coxinha grande de 250g. Crocante por fora, cremosa por dentro.',
    preco: '14,90',
    foto: foto('coxinha-g'),
  },
  {
    id: 'coxinha-m',
    nome: 'Coxinha M',
    descricao: 'Coxinha média de 130g, em 8 sabores.',
    preco: '9,90',
    foto: foto('coxinha-m'),
  },
  {
    id: 'copo-magico-salgado',
    nome: 'Copo Mágico Salgado',
    descricao: '20 mini coxinhas de frango num copo só.',
    preco: '18,90',
    foto: foto('copo-magico-salgado'),
  },
  {
    id: 'churros-gourmet',
    nome: 'Churros Gourmet',
    descricao: 'Você escolhe o recheio e o topping.',
    preco: '12,90',
    foto: foto('churros-gourmet'),
  },
  {
    id: 'copo-magico-doce',
    nome: 'Copo Mágico Doce',
    descricao: '12 mini churros de doce de leite ou chocolate.',
    preco: '18,90',
    foto: foto('copo-magico-doce'),
  },
  {
    id: 'mini-churros',
    nome: 'Mini Churros Recheados',
    descricao: 'Recheio de doce de leite ou chocolate.',
    preco: '12,90',
    aPartirDe: true,
    foto: foto('mini-churros'),
  },
  {
    id: 'combo-pra-voce',
    nome: 'Combo Pra Você',
    descricao: '1 coxinha G (250g) e 1 Coca-Cola lata 350ml.',
    preco: '20,90',
    foto: foto('coxinha-combo'),
  },
  {
    id: 'combo-dupla-fome',
    nome: 'Combo Dupla Fome',
    descricao: '2 coxinhas G (250g) e 1 Coca-Cola 600ml.',
    preco: '38,90',
    foto: foto('combo-dupla-fome'),
  },
  {
    id: 'combo-casal',
    nome: 'Combo Casal',
    descricao: '30 salgados PP, 8 mini churros e 1 Coca-Cola 600ml.',
    preco: '44,80',
    foto: foto('combo-casal'),
  },
  {
    id: 'linha-degust',
    nome: 'Linha Degust',
    descricao: '100 mini coxinhas de frango, de 9g cada.',
    preco: '49,90',
    foto: foto('linha-degust'),
  },
]

const POR_ID = Object.fromEntries(PRODUTOS.map((p) => [p.id, p]))

/* o que caiu/foi cortado no jogo → o produto de verdade que mais lembra aquilo */
const ITEM_PARA_PRODUTO = {
  coxinha: 'coxinha-g',
  mini: 'copo-magico-salgado',
  churros: 'churros-gourmet',
  copo: 'copo-magico-doce',
  refri: 'combo-pra-voce',
}

export const linkWhatsApp = (produto) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Oi! Vim do Coxinha Game e bateu vontade de ${produto.nome} 😋`,
  )}`

export const precoTexto = (produto) => `${produto.aPartirDe ? 'a partir de ' : ''}R$ ${produto.preco}`

export function produtoAleatorio(evitar) {
  const opcoes = PRODUTOS.filter((p) => p.id !== evitar)
  return opcoes[Math.floor(Math.random() * opcoes.length)]
}

/* Recebe { coxinha: 12, churros: 3, ... } e devolve a oferta do item mais pego.
   Sem contagem nenhuma, sorteia. */
export function ofertaPelaPartida(contagem = {}) {
  let melhor = null
  let maior = 0
  for (const [chave, qtd] of Object.entries(contagem)) {
    if (ITEM_PARA_PRODUTO[chave] && qtd > maior) {
      melhor = ITEM_PARA_PRODUTO[chave]
      maior = qtd
    }
  }
  return melhor ? POR_ID[melhor] : produtoAleatorio()
}
