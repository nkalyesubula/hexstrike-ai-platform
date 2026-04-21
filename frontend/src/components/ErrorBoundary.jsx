import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#1a1a2e',
          minHeight: '100vh',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#16213e',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#ff6b6b' }}>⚠️ Something went wrong</h1>
            <p style={{ margin: '20px 0' }}>{this.state.error?.message || 'An error occurred'}</p>
            <details style={{ textAlign: 'left', marginTop: '20px' }}>
              <summary>Error Details</summary>
              <pre style={{
                background: '#0f3460',
                padding: '10px',
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '12px',
                marginTop: '10px'
              }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#6c63ff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
