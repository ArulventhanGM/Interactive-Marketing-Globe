import React from 'react';
import ReactDOM from 'react-dom';
import './styles/global.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">MNC Interactive Globe</h1>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
