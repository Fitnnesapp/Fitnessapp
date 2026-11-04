import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Sicherungsdatei teilen oder auswählen. Auf dem Handy über das Teilen-Menü (Dateien, Drive, AirDrop ...),
 * im Browser als Download. Es wird nichts hochgeladen, die Datei verlässt das Gerät nur, wenn du es willst.
 */
export async function shareBackupFile(fileName: string, content: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(content);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Sicherung speichern' });
}

/** Lässt eine Sicherungsdatei auswählen und gibt ihren Text zurück, oder null bei Abbruch. */
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  if (Platform.OS === 'web' && asset.file) return asset.file.text();
  return new File(asset.uri).text();
}
