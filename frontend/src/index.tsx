/**
 * Main entry point for the Create Testings Demo application
 * 
 * This file initializes the React application and renders
 * the root App component into the DOM.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Get the root element from the DOM
const rootElement = document.getElementById('root');

// Ensure the root element exists
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create the React root
const root = ReactDOM.createRoot(rootElement);

// Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 