import { Component, type ReactNode } from 'react';

type SceneBoundaryProps = {
  /** Wird gezeigt, wenn 3D auf dem Gerät nicht läuft (kein WebGL, alter Treiber) */
  fallback: ReactNode;
  children: ReactNode;
};

/**
 * Fängt Fehler der 3D-Darstellung ab. Auf Geräten ohne passendes WebGL erscheint
 * stattdessen die flache Illustration, die App läuft normal weiter.
 */
export class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
