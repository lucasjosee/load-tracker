import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cores, espaco } from './tema';

interface Props {
  titulo?: string;
  children: ReactNode;
}

// Moldura comum das telas: rolagem, margens e título grande opcional.
export function Tela({ titulo, children }: Props) {
  return (
    // `automatic` deixa o iOS calcular as margens da barra de status, do
    // cabeçalho e da barra de abas, para o conteúdo não ficar escondido.
    <ScrollView
      style={styles.fundo}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      {titulo !== undefined && (
        <Text style={styles.titulo} accessibilityRole="header">
          {titulo}
        </Text>
      )}
      {children}
    </ScrollView>
  );
}

interface SecaoProps {
  titulo: string;
  children: ReactNode;
}

export function Secao({ titulo, children }: SecaoProps) {
  return (
    <View style={styles.secao}>
      <Text style={styles.tituloSecao}>{titulo}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: { backgroundColor: cores.fundo },
  conteudo: { padding: espaco.grande, gap: espaco.medio, paddingBottom: 48 },
  titulo: { fontSize: 32, fontWeight: '700', marginBottom: espaco.pequeno },
  secao: { gap: espaco.pequeno, marginTop: espaco.pequeno },
  tituloSecao: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.textoSecundario,
    textTransform: 'uppercase',
  },
});

export const estilosComuns = StyleSheet.create({
  cartao: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: cores.superficie,
    gap: 4,
  },
  textoSecundario: { fontSize: 15, color: cores.textoSecundario },
  campo: {
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: cores.superficie,
  },
  erro: { fontSize: 15, color: cores.perigo },
});
