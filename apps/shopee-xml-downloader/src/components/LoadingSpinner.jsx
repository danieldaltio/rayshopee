import React from 'react';

export default function LoadingSpinner({ message = 'Carregando...' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}
