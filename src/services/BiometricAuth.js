import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Servicio de autenticación biométrica.
 * Soporta huella dactilar (fingerprint) y Face ID de forma transparente:
 * expo-local-authentication detecta automáticamente qué tipo de
 * hardware biométrico tiene el dispositivo y usa el que corresponda.
 */
class BiometricAuthService {
  async isBiometricAvailable() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    return {
      available: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
    };
  }

  async getSupportedTypes() {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const labels = [];

    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      labels.push('Huella dactilar');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      labels.push('Face ID');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      labels.push('Iris');
    }
    return labels;
  }

  async authenticate(promptMessage = 'Autentícate para acceder a tu bóveda') {
    try {
      const { available } = await this.isBiometricAvailable();

      if (!available) {
        return {
          success: false,
          error: 'NO_BIOMETRIC',
          message:
            'Este dispositivo no tiene biometría configurada. Ve a Ajustes y registra tu huella o rostro.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar código del dispositivo',
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'UNKNOWN',
        message: this._mapErrorMessage(result.error),
      };
    } catch (err) {
      return {
        success: false,
        error: 'EXCEPTION',
        message: err.message || 'Ocurrió un error al autenticar.',
      };
    }
  }

  _mapErrorMessage(errorCode) {
    switch (errorCode) {
      case 'user_cancel':
        return 'Autenticación cancelada por el usuario.';
      case 'lockout':
        return 'Demasiados intentos fallidos. Biometría bloqueada temporalmente.';
      case 'not_enrolled':
        return 'No hay huellas o rostros registrados en este dispositivo.';
      default:
        return 'No se pudo verificar tu identidad. Intenta de nuevo.';
    }
  }
}

export default new BiometricAuthService();
