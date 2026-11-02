import { Pressable, StyleSheet, Text } from 'react-native';

import { cores, raio } from './tema';

type Variante = 'primario' | 'secundario' | 'perigo';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  compacto?: boolean;
}

export function Botao({ titulo, onPress, variante = 'primario', desabilitado = false, compacto = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      // `pressed` vem do Pressable: escurece o botão enquanto o dedo está nele.
      style={({ pressed }) => [
        styles.base,
        compacto && styles.compacto,
        styles[variante],
        (pressed || desabilitado) && styles.apagado,
      ]}
    >
      <Text style={[styles.texto, styles[`texto_${variante}`]]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: raio,
    alignItems: 'center',
  },
  compacto: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexGrow: 1,
  },
  primario: { backgroundColor: cores.primaria },
  secundario: { backgroundColor: cores.superficie },
  perigo: { backgroundColor: cores.superficie },
  apagado: { opacity: 0.5 },
  texto: { fontSize: 16, fontWeight: '600' },
  texto_primario: { color: cores.textoSobrePrimaria },
  texto_secundario: { color: cores.primaria },
  texto_perigo: { color: cores.perigo },
});
