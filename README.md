# Coxinha Game Test

Fliperama do Coxinildo, o mascote da Sua Coxinha: três jogos com a cara da loja, em React + Vite.

```bash
npm install
npm run dev
```

## Jogos

| Link | Jogo | Ambiente |
| --- | --- | --- |
| `#/pegar` | **Pega Pega**: o Coxinildo pega o que cai do céu com os pratos e desvia do brócolis | Vale da Coxinha |
| `#/ninja` | **Coxinha Ninja**: corte os salgados no ar, sem encostar na bomba (estilo Fruit Ninja) | Cozinha da Sua Coxinha |
| `#/pong` | **Coxinha Pong**: Coxinildo × Brócolis; a coxinha se multiplica, até 3 na quadra | Arena Sua Coxinha |

Sem hash, abre o catálogo de jogos com o cardápio da loja embaixo.

No celular, o Pega Pega aceita arrastar o Coxinildo com o dedo (puxar para cima faz ele pular) ou os botões.

## Ofertas da loja

Os produtos ficam em `src/jogos/comum/ofertas.js`, com nome, descrição, preço e foto
copiados de [suacoxinhaloja.com.br/cajamar](https://www.suacoxinhaloja.com.br/cajamar).
As fotos são carregadas direto do site da loja. Quando o cardápio mudar, é só editar essa lista.

Onde as ofertas aparecem:

- **Durante a partida**: um cartãozinho desliza na tela de tempos em tempos (no Pong, ele aparece
  na contagem entre os pontos).
- **Na pausa e no fim de jogo**: um cartão com a foto, o preço e botões para pedir no iFood ou pelo WhatsApp.
  No fim de jogo, o produto oferecido é o do item que a pessoa mais pegou ou cortou.

## Estrutura

```
src/
  App.jsx            navegação pelo hash entre o catálogo e os jogos
  Catalogo.jsx       catálogo de jogos + cardápio
  jogos/
    comum/           base.css, sons, recordes, ofertas, sprites (itens.jsx), topo
    pegar/           Pega Pega (cenário, Coxinildo, motor)
    ninja/           Coxinha Ninja
    pong/            Coxinha Pong
```
