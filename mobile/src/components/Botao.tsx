import { Pressable, StyleSheet } from 'react-native';

import { cores, raio } from './tema';
import { Texto } from './Texto';

type Variante = 'primario' | 'secundario' | 'perigo';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  compacto?: boolean;
  // Numa linha de botões, quanto da largura este ocupa em relação aos
  // vizinhos (vira `flex`). Ex.: "Bati" com peso 2 ao lado de dois com peso 1.
  peso?: number;
}

export function Botao({ titulo, onPress, variante = 'primario', desabilitado = false, compacto = false, peso }: Props) {
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
        peso !== undefined && [styles.comPeso, { flex: peso }],
        styles[variante],
        (pressed || desabilitado) && styles.apagado,
      ]}
    >
      <Texto numberOfLines={1} style={[styles.texto, styles[`texto_${variante}`]]}>
        {titulo}
      </Texto>
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
  // Dividindo a linha, a largura já vem do `flex`: margem interna pequena
  // para "Ajustar" caber num quarto do cartão.
  comPeso: { paddingHorizontal: 6 },
  primario: { backgroundColor: cores.primaria },
  // `superficieAlta` e não `superficie`: muitos botões ficam dentro de um
  // cartão, e com a cor do cartão eles sumiriam.
  secundario: { backgroundColor: cores.superficieAlta },
  perigo: { backgroundColor: cores.superficieAlta },
  apagado: { opacity: 0.5 },
  texto: { fontSize: 16, fontWeight: '600' },
  texto_primario: { color: cores.textoSobrePrimaria },
  texto_secundario: { color: cores.texto },
  texto_perigo: { color: cores.perigo },
});
