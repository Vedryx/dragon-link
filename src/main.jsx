import { StrictMode } from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/app.css'

const root = document.getElementById('root')
const tree = <StrictMode><App /></StrictMode>

if (root.hasChildNodes()) hydrateRoot(root, tree)
else createRoot(root).render(tree)
