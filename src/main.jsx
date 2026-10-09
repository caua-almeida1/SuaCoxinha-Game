import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CoxinhaGame from './game/CoxinhaGame.jsx'

// "Voltar ao site" leva para o site principal da Sua Coxinha.
const SITE_URL = 'https://www.suacoxinhaloja.com.br'
const navegar = () => { window.location.href = SITE_URL }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CoxinhaGame navegar={navegar} />
  </StrictMode>,
)
