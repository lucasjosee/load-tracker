import { StyleSheet, Text, TextInput, type TextInputProps, type TextProps } from 'react-native';

import { fonte } from './tema';

// A Saira desenha a linha com 1,57 vez o tamanho da letra (a fonte do sistema,
// com uns 1,2). Sem um `lineHeight`, todo texto do app ficaria um terço mais
// alto, com espaço sobrando em cima e embaixo. Este é o padrão; quem dá um
// `lineHeight` no estilo continua mandando.
const ALTURA_DA_LINHA = 1.25;

// `Text` e `TextInput` com a fonte do app. O React Native não tem fonte padrão
// global: sem estes dois, cada estilo de texto do app teria de repetir a
// família. O lint barra o `Text` e o `TextInput` diretos (eslint.config.js),
// para nenhuma tela nova voltar para a fonte do sistema sem perceber.
//
// O estilo de quem usa vem depois do nosso, então quem precisa de outra
// família (`fontFamily: fonte.larga`) ainda consegue trocar.
export function Texto({ style, ...props }: TextProps) {
  const { fontSize, lineHeight } = StyleSheet.flatten(style) ?? {};
  // Só com o tamanho no próprio estilo: um texto dentro de outro herda o
  // tamanho do de fora, e a conta aqui sairia com o tamanho errado.
  const linha = fontSize !== undefined && lineHeight === undefined ? { lineHeight: Math.round(fontSize * ALTURA_DA_LINHA) } : null;
  return <Text {...props} style={[estilos.base, style, linha]} />;
}

export function CampoDeTexto({ style, ...props }: TextInputProps) {
  return <TextInput {...props} style={[estilos.base, style]} />;
}

const estilos = StyleSheet.create({
  base: { fontFamily: fonte.normal },
});
