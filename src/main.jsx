import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error in React:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', background: '#030712', color: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#f87171', marginBottom: '8px', textTransform: 'uppercase' }}>
            Ошибка при загрузке
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '340px', marginBottom: '16px' }}>
            Кажется, в памяти браузера осталась старая сессия или произошла ошибка:
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'left', fontSize: '12px', fontFamily: 'monospace', color: '#fca5a5', overflowX: 'auto', marginBottom: '20px', wordBreak: 'break-all' }}>
            {this.state.error?.toString()}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            style={{ padding: '14px 24px', background: 'linear-gradient(to right, #f59e0b, #eab308)', color: '#030712', fontWeight: '900', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '15px', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.3)' }}
          >
            Сбросить память и обновить 🔄
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
