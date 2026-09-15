import { File, Directory, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';

const vaultDir = new Directory(Paths.document, 'vault');
const VAULT_DIR_LEGACY_URI = `${LegacyFileSystem.documentDirectory}vault/`;
const METADATA_KEY = 'vault_metadata_v1';

/**
 * Servicio que administra el almacenamiento de la bóveda.
 * - Los archivos se copian a una carpeta privada de la app
 *   (Paths.document + "vault/"), NO accesible desde la galería del
 *   sistema ni desde otras apps.
 * - Los metadatos (nombre, tipo, fecha, ruta) se guardan cifrados en
 *   SecureStore (Keychain en iOS, Keystore respaldado por hardware
 *   en Android).
 *
 * Nota sobre el copiado: en Android, los archivos que vienen de
 * expo-document-picker / expo-image-picker a veces llegan con URIs
 * "content://" o con permisos de lectura que la API nueva (File) no
 * siempre puede abrir, y otras veces es al revés (la API "legacy" es
 * la que falla). Es un problema conocido y documentado de Expo, no
 * de este proyecto. Para no depender de una sola API, probamos
 * primero con la nueva y, si falla, caemos automáticamente a la
 * legacy como respaldo.
 */
class VaultStorageService {
  _ensureVaultDir() {
    if (!vaultDir.exists) {
      vaultDir.create({ intermediates: true, idempotent: true });
    }
  }

  async _getMetadata() {
    try {
      const raw = await SecureStore.getItemAsync(METADATA_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async _saveMetadata(items) {
    await SecureStore.setItemAsync(METADATA_KEY, JSON.stringify(items));
  }

  async _copyViaFetch(sourceUri, destFile) {
    // Tercer respaldo: leer el archivo como si fuera una descarga de
    // red. El fetch de React Native usa el mismo mecanismo con el
    // que el celular abre/comparte archivos, y suele tener acceso a
    // proveedores estrictos (como el de WhatsApp) donde las APIs de
    // FileSystem, nueva o legacy, no logran leer directamente.
    const response = await fetch(sourceUri);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    destFile.create({ overwrite: true, intermediates: true });
    destFile.write(bytes);
  }

  async _copyWithFallback(sourceUri, destFile, destLegacyUri) {
    // Intento 1: API nueva (File/Directory).
    try {
      const sourceFile = new File(sourceUri);
      await sourceFile.copy(destFile);
      return;
    } catch (newApiError) {
      // Intento 2: API legacy, que maneja distinto los URIs
      // "content://" y algunos casos de DocumentPicker.
      try {
        await LegacyFileSystem.copyAsync({ from: sourceUri, to: destLegacyUri });
        return;
      } catch (legacyError) {
        // Intento 3: leer con fetch (funciona con proveedores más
        // estrictos, como el de WhatsApp).
        try {
          await this._copyViaFetch(sourceUri, destFile);
          return;
        } catch (fetchError) {
          throw new Error(
            `No se pudo copiar el archivo con ninguno de los tres métodos. ` +
            `Nueva API: ${newApiError?.message || newApiError}. ` +
            `Legacy: ${legacyError?.message || legacyError}. ` +
            `Fetch: ${fetchError?.message || fetchError}.`
          );
        }
      }
    }
  }

  async addItem(sourceUri, originalName, type) {
    this._ensureVaultDir();

    const extension = originalName.includes('.')
      ? originalName.split('.').pop()
      : type === 'image'
      ? 'jpg'
      : type === 'video'
      ? 'mp4'
      : 'dat';

    const id = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const filename = `${id}.${extension}`;
    const destFile = new File(vaultDir, filename);
    const destLegacyUri = `${VAULT_DIR_LEGACY_URI}${filename}`;

    await this._copyWithFallback(sourceUri, destFile, destLegacyUri);

    const items = await this._getMetadata();
    const newItem = {
      id,
      name: originalName,
      type,
      uri: destFile.uri,
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    await this._saveMetadata(items);

    return newItem;
  }

  async getItems() {
    this._ensureVaultDir();
    return this._getMetadata();
  }

  async deleteItem(id) {
    const items = await this._getMetadata();
    const item = items.find((i) => i.id === id);

    if (item) {
      try {
        const file = new File(item.uri);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // Respaldo con la API legacy si la nueva no puede con este URI.
        try {
          const info = await LegacyFileSystem.getInfoAsync(item.uri);
          if (info.exists) {
            await LegacyFileSystem.deleteAsync(item.uri, { idempotent: true });
          }
        } catch {
          // Si tampoco se puede borrar el archivo físico, al menos
          // quitamos el registro de la lista más abajo.
        }
      }
    }

    const remaining = items.filter((i) => i.id !== id);
    await this._saveMetadata(remaining);
    return remaining;
  }

  async clearAll() {
    const items = await this._getMetadata();
    for (const item of items) {
      try {
        const file = new File(item.uri);
        if (file.exists) file.delete();
      } catch {
        try {
          await LegacyFileSystem.deleteAsync(item.uri, { idempotent: true });
        } catch {
          // Ignorar y seguir con el resto.
        }
      }
    }
    await this._saveMetadata([]);
  }
}

export default new VaultStorageService();