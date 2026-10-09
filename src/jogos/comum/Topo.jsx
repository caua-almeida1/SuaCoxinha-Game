/* Barra de cima de todos os jogos: volta ao catálogo, nome do jogo, som e pausa. */
export default function Topo({ titulo, lugar, aoVoltar, somLigado, alternarSom, pausar }) {
  return (
    <header className="jogo__topo">
      <button type="button" className="botao-icone" onClick={aoVoltar}>
        <span aria-hidden="true">←</span> Jogos
      </button>

      <div className="jogo__titulo">
        <strong>{titulo}</strong>
        <span>{lugar}</span>
      </div>

      <div className="jogo__acoes">
        <button
          type="button"
          className="botao-icone botao-icone--quadrado"
          onClick={alternarSom}
          aria-pressed={somLigado}
          title={somLigado ? 'Desligar o som' : 'Ligar o som'}
        >
          <span aria-hidden="true">{somLigado ? '🔊' : '🔇'}</span>
          <span className="sr-only">Som</span>
        </button>

        {pausar && (
          <button type="button" className="botao-icone botao-icone--quadrado" onClick={pausar} title="Pausar">
            <span aria-hidden="true">❚❚</span>
            <span className="sr-only">Pausar</span>
          </button>
        )}
      </div>
    </header>
  )
}
