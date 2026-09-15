import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import BiometricAuth from '../services/BiometricAuth';
import JungleBackground from '../components/JungleBackground';
import WoodSignHeader from '../components/WoodSignHeader';
import { colors } from '../theme';

export default function AuthScreen({ onAuthenticated }) {
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const checkAvailability = useCallback(async () => {
    setChecking(true);
    const { available } = await BiometricAuth.isBiometricAvailable();
    const types = await BiometricAuth.getSupportedTypes();
    setAvailable(available);
    setSupportedTypes(types);
    setChecking(false);
  }, []);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const handleAuthenticate = async () => {
    setErrorMsg(null);
    const result = await BiometricAuth.authenticate(
      'Desbloquea tu bóveda de archivos'
    );

    if (result.success) {
      onAuthenticated();
    } else {
      setErrorMsg(result.message);
    }
  };

  if (checking) {
    return (
      <JungleBackground>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </JungleBackground>
    );
  }

  return (
    <JungleBackground>
      <View style={styles.container}>
        <WoodSignHeader
          title="Bóveda Protegida"
          subtitle={
            available
              ? `Usa ${supportedTypes.join(' o ') || 'tu biometría'} para continuar`
              : 'Este dispositivo no tiene biometría configurada'
          }
        />

        {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

        <TouchableOpacity
          style={[styles.button, !available && styles.buttonDisabled]}
          onPress={handleAuthenticate}
          disabled={!available}
        >
          <Text style={styles.buttonText}>🔒 Desbloquear</Text>
        </TouchableOpacity>

        {!available && (
          <Text style={styles.hint}>
            Ve a Ajustes del sistema y registra tu huella dactilar o Face ID
            para poder usar esta app.
          </Text>
        )}
      </View>
    </JungleBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 20,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
    marginTop: 28,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: { color: colors.accentText, fontWeight: '700', fontSize: 16 },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
