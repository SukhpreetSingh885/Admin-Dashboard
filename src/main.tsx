import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './dashboard.css';
import './redesign.css';
import './shell.css';
import './studio-theme.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
