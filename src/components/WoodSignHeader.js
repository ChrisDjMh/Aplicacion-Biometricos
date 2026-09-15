import React from 'react';
import { View, ImageBackground, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIGN_RATIO = 679 / 864; // alto / ancho real del PNG
// La tabla de madera (parte sólida) ocupa, aprox., del 59% al 100%
// de la altura de la imagen; el resto de arriba son las cuerdas
// transparentes que cuelgan del letrero.
const PLANK_START_RATIO = 0.5;

const FULL_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);
const FULL_HEIGHT = FULL_WIDTH * SIGN_RATIO;

export default function WoodSignHeader({ title, subtitle, compact = false }) {
  const width = compact ? FULL_WIDTH * 0.72 : FULL_WIDTH;
  const height = compact ? FULL_HEIGHT * 0.72 : FULL_HEIGHT;
  const plankTop = height  * PLANK_START_RATIO;

  return (
    <ImageBackground
      source={require('../../assets/wood-sign.png')}
      style={{ width, height }}
      resizeMode="contain"
    >
      {/* Caja que cubre SOLO la tabla de madera (no las cuerdas de
          arriba), para centrar el texto dentro de ella. */}
      <View
        style={[
          styles.plankTextBox,
          {
            top: plankTop,
            paddingHorizontal: width * 0.16,
          },
        ]}
      >
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  plankTextBox: {
    position: 'absolute',
    left: 0,
    right: 25,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(59,36,18,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  titleCompact: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(59,36,18,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitleCompact: {
    fontSize: 10,
    marginTop: 2,
  },
});