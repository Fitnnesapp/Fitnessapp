import * as SecureStore from 'expo-secure-store';

// SecureStore warnt ab ca. 2 KB pro Eintrag. Eine Supabase-Session ist oft größer,
// deshalb wird der Wert in Stücke zerlegt abgelegt.
const CHUNK_SIZE = 1800;

const countKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

async function removeItem(key: string): Promise<void> {
  const rawCount = await SecureStore.getItemAsync(countKey(key));
  const count = rawCount ? Number(rawCount) : 0;

  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
  await SecureStore.deleteItemAsync(countKey(key));
}

async function getItem(key: string): Promise<string | null> {
  const rawCount = await SecureStore.getItemAsync(countKey(key));
  if (!rawCount) return null;

  const parts: string[] = [];
  for (let i = 0; i < Number(rawCount); i++) {
    const part = await SecureStore.getItemAsync(chunkKey(key, i));
    if (part === null) return null;
    parts.push(part);
  }
  return parts.join('');
}

async function setItem(key: string, value: string): Promise<void> {
  await removeItem(key);

  const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'gs')) ?? [];
  for (let i = 0; i < chunks.length; i++) {
    await SecureStore.setItemAsync(chunkKey(key, i), chunks[i]);
  }
  await SecureStore.setItemAsync(countKey(key), String(chunks.length));
}

export const secureStorage = { getItem, setItem, removeItem };
