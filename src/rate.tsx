import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import RateApp from './RateApp.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RateApp />
  </StrictMode>,
);
