import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setAppId } from '@masterlms/shared'
import './index.css'
import App from './App.tsx'

// Identifies this app's auth cookie session (see backend apps/users/views).
setAppId('learner')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
