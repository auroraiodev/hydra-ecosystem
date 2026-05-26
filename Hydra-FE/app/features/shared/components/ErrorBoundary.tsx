'use client';

import { Component, ErrorInfo } from 'react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { type ErrorBoundaryProps, type ErrorBoundaryState } from '../types';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 py-12 text-center">
          <div className="vault-glass-panel p-8 max-w-md w-full crystal-shadow rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-32 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="size-16 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-teal">
                <span className="text-3xl">⚠️</span>
              </div>

              <h2 className="text-2xl font-semibold text-vault-text mb-3 tracking-tighter uppercase">
                Algo salió mal
              </h2>

              <p className="text-vault-text-muted font-medium mb-8">
                Ocurrió un error inesperado. Intenta refrescar la página.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <FlowButton
                  variant="default"
                  onClick={this.handleReset}
                  className="rounded-xl px-6 py-2.5 font-bold shadow-lg shadow-teal/20"
                >
                  Reintentar
                </FlowButton>

                <FlowButton
                  variant="vault"
                  onClick={() => window.location.reload()}
                  className="rounded-xl px-6 py-2.5 font-bold"
                >
                  Refrescar página
                </FlowButton>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
