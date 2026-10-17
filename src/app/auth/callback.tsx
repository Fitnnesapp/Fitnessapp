import { Redirect } from 'expo-router';

// Ziel des OAuth-Redirects (Google). Die Tokens liest signInWithGoogle() aus der Rücksprung-URL;
// dieser Screen fängt nur den Deep-Link ab, damit kein "Nicht gefunden" erscheint.
export default function AuthCallback() {
  return <Redirect href="/" />;
}
