import React from 'react'
import ErrorBoundary from './ErrorBoundary'

function SafeComponent({ children, fallback }) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}

export default SafeComponent
