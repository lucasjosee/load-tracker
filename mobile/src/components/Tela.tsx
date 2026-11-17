import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cores, espaco, raio, raioDoCartao, tipografia } from './tema';

interface Props {
  titulo?: string;
  // Espaço extra no fim da rolagem, para quando há algo fixo por cima do
  // rodapé da tela (o botão "Iniciar treino" da aba Hoje).
  folgaNoFim?: number;
  children: ReactNode;
}

// Moldura comum das telas: rolagem, margens e título grande opcional.
export function Tela({ titulo, folgaNoFim = 0, children }: Props) {
  return (
    // `automatic` deixa o iOS calcular as margens da barra de status, do
    // cabeçalho e da barra de abas, para o conteúdo não ficar escondido.
    <ScrollView
      style={styles.fundo}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.conteudo, folgaNoFim > 0 && { paddingBottom: 48 + folgaNoFim }]}
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
  titulo: { ...tipografia.titulo, marginBottom: espaco.pequeno },
  secao: { gap: espaco.pequeno, marginTop: espaco.pequeno },
  tituloSecao: { ...tipografia.tituloDeSecao, textTransform: 'uppercase', letterSpacing: 0.5 },
});

export const estilosComuns = StyleSheet.create({
  cartao: {
    padding: 16,
    borderRadius: raioDoCartao,
    backgroundColor: cores.superficie,
    gap: 4,
  },
  textoSecundario: tipografia.secundario,
  campo: {
    ...tipografia.corpo, // sem a cor, o texto digitado sairia preto no fundo escuro
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: raio,
    backgroundColor: cores.superficie,
  },
  erro: { fontSize: 15, color: cores.perigo },
});
