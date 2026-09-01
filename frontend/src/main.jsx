import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
      <h1>💸 Personal Finance Manager</h1>
      <p>Sistema web para la gestión y control de finanzas personales.</p>
      <p>
        Estado de la API:{' '}
        <a href="/api/health" target="_blank" rel="noreferrer">/api/health</a>
      </p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);