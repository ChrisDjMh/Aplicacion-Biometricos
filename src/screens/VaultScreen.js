import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import VaultStorage from '../services/VaultStorage';
import JungleBackground from '../components/JungleBackground';
import WoodSignHeader from '../components/WoodSignHeader';
import { colors } from '../theme';

// Tipos de documento que sí aceptamos en el botón "+ Documento".
const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
];
const ALLOWED_DOCUMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf',
];

function isAllowedDocument(asset) {
  const mime = (asset.mimeType || '').toLowerCase();
  if (ALLOWED_DOCUMENT_MIME_TYPES.includes(mime)) return true;

  // Respaldo por extensión: algunos dispositivos/Android antiguos no
  // devuelven mimeType para ciertos archivos.
  const ext = asset.name?.split('.').pop()?.toLowerCase();
  return ALLOWED_DOCUMENT_EXTENSIONS.includes(ext);
}

function isAllowedImageOrVideo(asset) {
  const mime = (asset.mimeType || '').toLowerCase();
  if (mime.startsWith('image/') || mime.startsWith('video/')) return true;
  return asset.type === 'image' || asset.type === 'video';
}

// Componente aparte porque los Hooks (useVideoPlayer) no se pueden
// llamar condicionalmente dentro del JSX de VaultScreen.
function VideoPreview({ uri, style }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <VideoView
      style={style}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls
    />
  );
}

export default function VaultScreen({ onLock }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState(null);

  const loadItems = useCallback(async () => {
    const data = await VaultStorage.getItems();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const pickImageOrVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    if (!isAllowedImageOrVideo(asset)) {
      Alert.alert(
        'Archivo no permitido',
        'Solo se pueden guardar fotos o videos desde este botón. Elige otro archivo o usa "+ Documento" si es un documento.'
      );
      return;
    }

    const type = asset.type === 'video' || (asset.mimeType || '').startsWith('video/') ? 'video' : 'image';
    const name = asset.fileName || asset.uri.split('/').pop();

    try {
      await VaultStorage.addItem(asset.uri, name, type);
      loadItems();
    } catch (err) {
      Alert.alert(
        'No se pudo guardar',
        'Hubo un problema al copiar este archivo a la bóveda. Intenta con otro archivo.'
      );
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_DOCUMENT_MIME_TYPES,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    if (!isAllowedDocument(asset)) {
      Alert.alert(
        'Archivo no permitido',
        'Solo se pueden guardar documentos (PDF, Word, Excel, PowerPoint, TXT, CSV o RTF). Elige otro archivo.'
      );
      return;
    }

    try {
      await VaultStorage.addItem(asset.uri, asset.name, 'document');
      loadItems();
    } catch (err) {
      Alert.alert(
        'No se pudo guardar',
        'Hubo un problema al copiar este documento a la bóveda. Intenta con otro archivo.'
      );
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar archivo',
      '¿Seguro que quieres eliminar este archivo de la bóveda? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const remaining = await VaultStorage.deleteItem(id);
            setItems(remaining);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => setPreviewItem(item)}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.itemIcon}>
        <Text style={{ fontSize: 22 }}>
          {item.type === 'image' ? '🖼️' : item.type === 'video' ? '🎬' : '📄'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <JungleBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <WoodSignHeader title="Mi Bóveda" compact />
          <TouchableOpacity onPress={onLock} style={styles.lockButton}>
            <Text style={styles.lockButtonText}>🔒 Bloquear</Text>
          </TouchableOpacity>
        </View>

        {!loading && items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aún no has guardado nada. Agrega fotos, videos o documentos.
            </Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 150, paddingTop: 4 }}
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImageOrVideo}>
            <Text style={styles.actionText}>+ Foto/Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={pickDocument}>
            <Text style={styles.actionText}>+ Documento</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={!!previewItem} animationType="slide" transparent={false}>
          <View style={styles.previewContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPreviewItem(null)}
            >
              <Text style={styles.closeButtonText}>✕ Cerrar</Text>
            </TouchableOpacity>

            {previewItem?.type === 'image' && (
              <Image
                source={{ uri: previewItem.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}

            {previewItem?.type === 'video' && (
              <VideoPreview uri={previewItem.uri} style={styles.previewImage} />
            )}

            {previewItem?.type === 'document' && (
              <View style={styles.docPreview}>
                <Text style={{ fontSize: 60 }}>📄</Text>
                <Text style={styles.docName}>{previewItem.name}</Text>
                <Text style={styles.docHint}>
                  Vista previa no disponible para este tipo de archivo. El
                  archivo está almacenado de forma segura dentro de la
                  bóveda.
                </Text>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </JungleBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  lockButton: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginTop: 14,
  },
  lockButtonText: { color: colors.accent, fontWeight: '700' },
  emptyState: { paddingHorizontal: 32, marginTop: 30 },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 14 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(59,36,18,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemName: { color: colors.textDark, fontSize: 15, fontWeight: '700' },
  itemDate: { color: colors.textSubtle, fontSize: 12, marginTop: 2 },
  actions: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  actionText: { color: colors.accentText, fontWeight: '700' },
  previewContainer: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  closeButton: { alignSelf: 'flex-end', padding: 16 },
  closeButtonText: { color: '#F8FAFC', fontSize: 16 },
  previewImage: { flex: 1, width: '100%' },
  docPreview: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  docName: { color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginTop: 16 },
  docHint: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});