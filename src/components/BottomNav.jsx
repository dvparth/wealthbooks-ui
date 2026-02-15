import React from 'react';
import '../styles/BottomNav.css';

export default function BottomNav({ current = 'home' }) {
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <nav className="wb-bottom-nav" role="navigation" aria-label="Main navigation">
      <button className="wb-nav-btn" onClick={() => navigate('/')} aria-label="Home">Home</button>
      <button className="wb-nav-btn" onClick={() => navigate('/investments')} aria-label="Investments">Investments</button>
      <button className="wb-nav-btn" onClick={() => navigate('/investments/new')} aria-label="Create">Create</button>
      <button className="wb-nav-btn" onClick={() => navigate('/diagnostics')} aria-label="Diagnostics">Diag</button>
    </nav>
  );
}
