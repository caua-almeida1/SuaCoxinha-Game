import mascote from '../../assets/mascote.webp'
import { forwardRef, memo } from 'react'

/* O Coxinildo. O mascote é a foto oficial da loja; os dois pratos são
   desenhados por cima das luvas, que é onde ele já segura as plaquinhas.

   Quem move este bloco é o laço do jogo, direto no DOM (transform no `.heroi`),
   então este componente nunca re-renderiza durante a partida. As animações de
   andar, pular e tomar dano são só troca de classe. */

const Coxinildo = forwardRef(function Coxinildo({ altura }, ref) {
  return (
    <div className="heroi" ref={ref} style={{ '--h': `${altura}px` }}>
      <span className="heroi__sombra" />

      <div className="heroi__virar">
        <div className="heroi__balanco">
          <img
            className="heroi__mascote"
            src={mascote}
            alt="Coxinildo, o mascote da Sua Coxinha"
            draggable="false"
          />

          <span className="prato prato--esq">
            <i className="prato__base" />
            <i className="prato__brilho" />
          </span>

          <span className="prato prato--dir">
            <i className="prato__base" />
            <i className="prato__brilho" />
          </span>
        </div>
      </div>

      <span className="heroi__poeira">
        <i /><i /><i />
      </span>
    </div>
  )
})

export default memo(Coxinildo)
