import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Vite's import.meta.env.BASE_URL is the configured `base` (e.g. "/ems/").
// React Router wants the basename without a trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
