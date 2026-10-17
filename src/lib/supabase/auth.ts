import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './client';

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** Liefert needsEmailConfirmation=true, wenn Supabase zuerst eine E-Mail-Bestätigung verlangt (keine Session). */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim() } },
  });
  if (error) throw error;
  return { needsEmailConfirmation: data.session === null };
}

function readAuthParams(url: string): URLSearchParams {
  // Supabase hängt Tokens (Implicit Flow) als Fragment an, Fehler teils als Query
  const [withoutHash, hash = ''] = url.split('#');
  const query = withoutHash.split('?')[1] ?? '';
  return new URLSearchParams(hash || query);
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = makeRedirectUri({ path: 'auth/callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return; // vom Nutzer abgebrochen

  const params = readAuthParams(result.url);
  const failure = params.get('error_description') ?? params.get('error');
  if (failure) throw new Error(failure);

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) throw new Error('Die Anmeldung mit Google lieferte keine Session.');

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
}

export function isAppleSignInAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

export async function signInWithApple(): Promise<void> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('Apple lieferte kein Identity-Token.');

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return; // vom Nutzer abgebrochen
    throw e;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Art. 17 DSGVO: löscht Konto und alle Nutzerdaten (RPC aus der profiles-Migration). */
export async function deleteOwnAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  // Die Session ist serverseitig bereits ungültig, lokal nur noch aufräumen
  await supabase.auth.signOut({ scope: 'local' });
}
