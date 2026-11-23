import { Children, isValidElement, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cores, espaco, gradienteDoFundo, raio, raioDoCartao, relevo, tipografia } from './tema';

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

// Várias linhas num painel só, separadas por sulcos: a lista de exercícios da
// aba Hoje e as listas da tela do treino. Um cartão por linha repetiria borda
// e sombra a cada item; num painel só, a lista se lê como uma peça.
export function ListaEmPainel({ children }: { children: ReactNode }) {
  return (
    <View style={[estilosComuns.cartao, styles.painelDeLista]}>
      {Children.toArray(children).map((linha, indice) => (
        <View key={isValidElement(linha) && linha.key !== null ? linha.key : indice} style={indice > 0 && styles.comSulco}>
          {linha}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // A cor fica por baixo do gradiente: é o que aparece se ele não for desenhado.
  fundo: { backgroundColor: cores.fundo, backgroundImage: gradienteDoFundo },
  conteudo: { padding: espaco.grande, gap: espaco.medio, paddingBottom: 48 },
  titulo: { ...tipografia.titulo, marginBottom: espaco.pequeno },
  secao: { gap: espaco.pequeno, marginTop: espaco.pequeno },
  tituloSecao: { ...tipografia.tituloDeSecao, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Sem margem de cima e de baixo: cada linha já tem a dela.
  painelDeLista: { paddingVertical: 0, gap: 0 },
  // O sulco entre duas linhas: escuro, com um filete de luz logo abaixo.
  comSulco: { borderTopWidth: 1, borderTopColor: cores.sulco, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)' },
});

export const estilosComuns = StyleSheet.create({
  cartao: {
    padding: 16,
    borderRadius: raioDoCartao,
    backgroundColor: cores.superficie,
    boxShadow: relevo.painel,
    gap: 4,
  },
  textoSecundario: tipografia.secundario,
  campo: {
    ...tipografia.corpo, // sem a cor, o texto digitado sairia preto no fundo escuro
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: raio,
    backgroundColor: cores.superficie,
    boxShadow: relevo.afundado, // o campo é um sulco: é onde se escreve
  },
  erro: { fontSize: 15, color: cores.perigo },
});
