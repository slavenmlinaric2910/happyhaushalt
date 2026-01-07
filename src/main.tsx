import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { seedDemoData } from './lib/seed';
import './index.css';

// Seed demo data on first load
seedDemoData().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

