import { Children, isValidElement, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cores, espaco, fundoDeTela, raio, raioDoCartao, tipografia, vidro } from './tema';

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

// Várias linhas num painel de vidro só, separadas por uma linha fina: a lista
// de exercícios da aba Hoje e as listas da tela do treino. Um cartão por linha
// repetiria borda e sombra a cada item; num painel só, a lista se lê como uma
// peça.
export function ListaEmPainel({ children }: { children: ReactNode }) {
  return (
    <View style={[estilosComuns.cartao, styles.painelDeLista]}>
      {Children.toArray(children).map((linha, indice) => (
        <View key={isValidElement(linha) && linha.key !== null ? linha.key : indice} style={indice > 0 && styles.comDivisoria}>
          {linha}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: fundoDeTela,
  conteudo: { padding: espaco.grande, gap: espaco.medio, paddingBottom: 48 },
  titulo: { ...tipografia.titulo, marginBottom: espaco.pequeno },
  secao: { gap: espaco.pequeno, marginTop: espaco.pequeno },
  // Um pouco para dentro, alinhado com o texto de dentro dos painéis.
  tituloSecao: { ...tipografia.tituloDeSecao, marginHorizontal: 4 },
  // Sem margem de cima e de baixo: cada linha já tem a dela.
  painelDeLista: { paddingVertical: 0, gap: 0 },
  comDivisoria: { borderTopWidth: 1, borderTopColor: cores.divisoria },
});

export const estilosComuns = StyleSheet.create({
  cartao: {
    ...vidro,
    padding: 16,
    borderRadius: raioDoCartao,
    gap: 4,
  },
  textoSecundario: tipografia.secundario,
  campo: {
    ...tipografia.corpo, // sem a cor, o texto digitado sairia preto no fundo escuro
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: raio,
    borderWidth: 1,
    borderColor: cores.divisoria,
    backgroundColor: cores.campo, // mais escuro que o vidro: é onde se escreve
  },
  erro: { fontSize: 15, color: cores.perigo },
});
