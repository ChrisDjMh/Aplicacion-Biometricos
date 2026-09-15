# Biometric Vault App

App en React Native (Expo SDK 57) que protege fotos, videos y documentos
guardados detrás de autenticación biométrica (huella dactilar / Face ID).

## Requisitos

- Node.js 18+
- La app **Expo Go** instalada en tu celular (o un emulador Android /
  simulador iOS).
- Un dispositivo/emulador con biometría configurada (huella o Face ID
  ya registrados en Ajustes del sistema).

## Instalación

Descomprime el zip y desde esa carpeta corre:

```bash
npm install
```

## Ejecutar

```bash
npx expo start --tunnel
```

Escanea el QR con la app **Expo Go**. Se recomienda `--tunnel` porque
funciona sin importar la red en la que estén tu celular y tu
computadora (a diferencia del modo LAN, que requiere estar en el
mismo Wi-Fi).

> `@expo/ngrok` ya viene incluido en `package.json` como
> devDependency, así que `--tunnel` debería funcionar sin pedir
> instalar nada extra.

### Probar Face ID / huella en simulador

- **iOS Simulator:** `Features > Face ID > Enrolled`, luego
  `Features > Face ID > Matching Face`.
- **Android Emulator:** en los controles extendidos, la opción
  "Fingerprint" simula una huella registrada.

## Estructura del proyecto

```
BiometricVaultApp/
├── App.js                      # Punto de entrada, maneja bloqueo automático
├── app.json                    # Configuración de Expo y permisos nativos
├── package.json
├── assets/                     # Íconos placeholder (reemplázalos por tu logo)
└── src/
    ├── screens/
    │   ├── AuthScreen.js        # Pantalla de bloqueo/autenticación
    │   └── VaultScreen.js       # Lista de archivos + agregar/ver/borrar
    └── services/
        ├── BiometricAuth.js     # Lógica de expo-local-authentication
        └── VaultStorage.js      # Copia archivos a carpeta privada + metadatos cifrados
```

## Cómo funciona la seguridad

1. **Autenticación:** `expo-local-authentication` llama al sistema
   operativo nativo (Face ID / Touch ID en iOS, BiometricPrompt en
   Android).
2. **Almacenamiento de archivos:** los archivos elegidos se copian a
   `FileSystem.documentDirectory + 'vault/'`, una carpeta privada de
   la app, no visible desde la galería del sistema.
3. **Metadatos:** el listado se guarda con `expo-secure-store`
   (Keychain en iOS, Keystore respaldado por hardware en Android).
4. **Re-bloqueo automático:** si el usuario cambia de app o apaga la
   pantalla, `AppState` fuerza el bloqueo.

## Si te sale un error al correrlo

- **"Project is incompatible with this version of Expo Go"** → tu
  Expo Go se actualizó a un SDK más nuevo que el del proyecto. Corre
  `npx expo install --fix` para alinear versiones.
- **"Failed to download remote update" / se queda cargando** → es un
  problema de red entre tu celular y la computadora. Usa
  `npx expo start --tunnel`.
- **ERESOLVE al hacer `npm install`** → borra `node_modules` y
  `package-lock.json` y vuelve a instalar (`Remove-Item -Recurse
  -Force node_modules` en PowerShell, `rm -rf node_modules` en
  Mac/Linux).

## Posibles mejoras (siguientes pasos)

- Cifrar el contenido de los archivos con `expo-crypto`.
- PIN de respaldo configurable por el usuario.
- Miniaturas de video con `expo-video-thumbnails`.
- Backup cifrado del vault.
