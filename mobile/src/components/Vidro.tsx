import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { vidroDeControle } from './tema';

// Se o iPhone desenha o vidro do iOS 26 (Liquid Glass). Antes do iOS 26 o
// `GlassView` vira uma View comum, sem vidro nenhum.
export const VIDRO_DO_SISTEMA = isLiquidGlassAvailable();

interface Props {
  style?: StyleProp<ViewStyle>;
  apertado?: boolean;
  children: ReactNode;
}

// O fundo dos botões de vidro (secundário, perigo e as pílulas da tela do
// treino). No iOS 26 é o vidro de verdade do sistema, com o reflexo e a
// refração dos controles da Apple; antes dele, a imitação dos painéis.
//
// Os painéis grandes (cartões, listas) continuam com a imitação mesmo no iOS
// 26: a Apple deixa o vidro para os controles que flutuam sobre o conteúdo, e
// muitos vidros de verdade numa tela que rola pesam para desenhar.
//
// O vidro do sistema some se a View dele ficar com `opacity` abaixo de 1. Por
// isso o "apertado" é uma película clara por cima do conteúdo, e quem usa
// apaga o texto (e não o botão) quando ele está desabilitado.
export function Vidro({ style, apertado = false, children }: Props) {
  const pelicula = apertado && <View pointerEvents="none" style={styles.pelicula} />;
  if (VIDRO_DO_SISTEMA) {
    return (
      <GlassView glassEffectStyle="regular" colorScheme="dark" tintColor="rgba(255, 255, 255, 0.06)" style={style}>
        {children}
        {pelicula}
      </GlassView>
    );
  }
  return (
    <View style={[vidroDeControle, style]}>
      {children}
      {pelicula}
    </View>
  );
}

const styles = StyleSheet.create({
  // `borderRadius: 999` e não o raio de quem usa: a película fica dentro do
  // botão, e um raio maior que a metade da altura vira sempre uma pílula.
  pelicula: { ...StyleSheet.absoluteFill, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
});
