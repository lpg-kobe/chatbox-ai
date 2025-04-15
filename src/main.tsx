import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './Home.tsx'
// import App from './App.tsx' => 这个是基础版（交互仅供参考）

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
    {/* <App /> */}
  </StrictMode>,
)
