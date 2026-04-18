import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Remove StrictMode to avoid double-invoking effects in development
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
