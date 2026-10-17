import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { secureStorage } from './secure-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** false, solange .env fehlt: die App startet trotzdem und zeigt einen Hinweis statt abzustürzen. */
export const isSupabaseConfigured = Boolean(url && anonKey);

const isNative = Platform.OS !== 'web';

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'missing-anon-key', {
  auth: {
    // Tokens liegen im verschlüsselten Keystore/Keychain statt in AsyncStorage
    storage: isNative ? secureStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
