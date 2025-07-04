// src/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import GlobeApp from './components/GlobeApp';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <GlobeApp />
  </React.StrictMode>
);
