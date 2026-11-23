import { Pressable, StyleSheet, Text } from 'react-native';

import { Recartilhado } from './Recartilhado';
import { cores, cromo, raio, vidroDeControle } from './tema';

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

// O primário é o botão cromado da tela (`cromo` em tema.ts); secundário e
// perigo são de vidro, no tom de cima do cartão.
export function Botao({ titulo, onPress, variante = 'primario', desabilitado = false, compacto = false, peso }: Props) {
  const cromado = variante === 'primario';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      // `pressed` vem do Pressable: enquanto o dedo está no botão, o cromado
      // afunda (gradiente invertido) e os outros escurecem.
      style={({ pressed }) => [
        styles.base,
        compacto && styles.compacto,
        peso !== undefined && [styles.comPeso, { flex: peso }],
        styles[variante],
        pressed && (cromado ? styles.cromoApertado : styles.apagado),
        desabilitado && styles.apagado,
      ]}
    >
      {/* No compacto não sobra largura para a textura sem encostar no texto. */}
      {cromado && !compacto && <Recartilhado raio={raio} largura="18%" />}
      <Text numberOfLines={1} style={[styles.texto, styles[`texto_${variante}`]]}>
        {titulo}
      </Text>
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
  // `backgroundColor` fica por baixo do gradiente: se ele não for desenhado,
  // o botão continua cromado, só que liso.
  primario: { backgroundColor: cromo.cor, backgroundImage: cromo.fundo, boxShadow: cromo.sombra },
  cromoApertado: { backgroundImage: cromo.apertado },
  // `superficieAlta` e não `superficie`: muitos botões ficam dentro de um
  // cartão, e com a cor do cartão eles sumiriam.
  secundario: vidroDeControle,
  perigo: vidroDeControle,
  apagado: { opacity: 0.5 },
  texto: { fontSize: 16, fontWeight: '600' },
  texto_primario: { color: cromo.texto, fontWeight: '700' },
  texto_secundario: { color: cores.texto },
  texto_perigo: { color: cores.perigo },
});
