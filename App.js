import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './src/screens/AuthScreen';
import VaultScreen from './src/screens/VaultScreen';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const appState = useRef(AppState.currentState);

  const handleAuthenticated = useCallback(() => {
    setUnlocked(true);
  }, []);

  const handleLock = useCallback(() => {
    setUnlocked(false);
  }, []);

  useEffect(() => {
    // Vuelve a bloquear la bóveda automáticamente cuando la app
    // pasa a segundo plano (el usuario cambia de app, apaga la
    // pantalla, etc.).
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = appState.current === 'active';
      const goingBackground =
        nextState === 'background' || nextState === 'inactive';

      if (wasActive && goingBackground) {
        setUnlocked(false);
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {unlocked ? (
        <VaultScreen onLock={handleLock} />
      ) : (
        <AuthScreen onAuthenticated={handleAuthenticated} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
