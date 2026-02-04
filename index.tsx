import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log("Mounting React App...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React App Mounted.");
} catch (err) {
  console.error("React Mount Error:", err);
  // @ts-ignore
  if (window.showErrorUI) window.showErrorUI(err.toString());
}