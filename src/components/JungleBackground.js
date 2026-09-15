import React from 'react';
import { View, ImageBackground, Image, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Proporciones reales de cada PNG (ancho x alto) para que no se deformen.
const VINE_RATIO = 657 / 512;
const LEAVES_RATIO = 288 / 1280;

export default function JungleBackground({ children }) {
  return (
    <ImageBackground
      source={require('../../assets/bg-pink.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <Image
        source={require('../../assets/vine.png')}
        style={styles.vine}
        pointerEvents="none"
      />

      <View style={styles.content}>{children}</View>

      <Image
        source={require('../../assets/leaves-border.png')}
        style={styles.leaves}
        pointerEvents="none"
        resizeMode="stretch"
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  content: { flex: 1, zIndex: 2 },
  vine: {
    position: 'absolute',
    top: -6,
    right: -10,
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4 * VINE_RATIO,
    zIndex: 1,
  },
  leaves: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * LEAVES_RATIO,
    zIndex: 1,
  },
});
