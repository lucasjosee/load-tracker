import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from './tema';
import { Vidro } from './Vidro';

type Variante = 'primario' | 'secundario' | 'perigo';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  compacto?: boolean;
  // Numa linha de botões, quanto da largura este ocupa em relação aos
  // vizinhos (vira `flex`). Ex.: "Ajustar" e "Depois" com peso 1 cada,
  // dividindo a linha ao meio.
  peso?: number;
}

// Todos os botões são pílulas. O primário é branco e cheio: é o mais claro
// da tela, então é o primeiro que o olho acha. Secundário e perigo são de
// vidro (Vidro.tsx); o perigo só muda a cor do texto.
//
// A altura é mínima, e não fixa: com o texto do iPhone em tamanho grande, o
// botão cresce em vez de cortar o texto. O raio é a metade da altura mínima.
export function Botao({ titulo, onPress, variante = 'primario', desabilitado = false, compacto = false, peso }: Props) {
  const forma = compacto ? styles.formaCompacta : variante === 'primario' ? styles.formaPrincipal : styles.formaSecundaria;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={peso !== undefined && { flex: peso }}
    >
      {/* `pressed` vem do Pressable: é verdadeiro enquanto o dedo está no botão. */}
      {({ pressed }) => {
        const texto = (
          <Text
            numberOfLines={1}
            style={[
              styles.texto,
              styles[`texto_${variante}`],
              compacto && styles.textoCompacto,
              // No primário quem apaga é o fundo (`principalApagado`).
              desabilitado && variante !== 'primario' && styles.textoApagado,
            ]}
          >
            {titulo}
          </Text>
        );
        return variante === 'primario' ? (
          <View style={[styles.forma, forma, styles.principal, pressed && styles.principalApertado, desabilitado && styles.principalApagado]}>
            {texto}
          </View>
        ) : (
          <Vidro apertado={pressed} style={[styles.forma, forma]}>
            {texto}
          </Vidro>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  forma: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  formaPrincipal: { minHeight: 56, borderRadius: 28 },
  formaSecundaria: { minHeight: 50, borderRadius: 25 },
  // Dividindo a linha com outros, a largura já vem do `flex`.
  formaCompacta: { minHeight: 36, borderRadius: 18, paddingHorizontal: 14 },
  principal: { backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' },
  principalApertado: { backgroundColor: '#D9E0EC' },
  principalApagado: { backgroundColor: 'rgba(255, 255, 255, 0.35)', boxShadow: 'none' },
  texto: { fontSize: 16, fontWeight: '600', paddingVertical: 8 },
  textoCompacto: { fontSize: 15, paddingVertical: 6 },
  texto_primario: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, color: cores.textoSobrePrimaria },
  texto_secundario: { color: cores.texto },
  texto_perigo: { color: cores.perigo },
  textoApagado: { opacity: 0.4 },
});
