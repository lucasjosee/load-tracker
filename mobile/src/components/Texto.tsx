import { StyleSheet, Text, TextInput, type TextInputProps, type TextProps } from 'react-native';

import { fonte } from './tema';

// `Text` e `TextInput` com a fonte do app. O React Native não tem fonte padrão
// global: sem estes dois, cada estilo de texto do app teria de repetir a
// família. O lint barra o `Text` e o `TextInput` diretos (eslint.config.js),
// para nenhuma tela nova voltar para a fonte do sistema sem perceber.
//
// O estilo de quem usa vem depois do nosso, então quem precisa de outra
// família (`fontFamily: fonte.larga`) ainda consegue trocar.
export function Texto({ style, ...props }: TextProps) {
  return <Text {...props} style={[estilos.base, style]} />;
}

export function CampoDeTexto({ style, ...props }: TextInputProps) {
  return <TextInput {...props} style={[estilos.base, style]} />;
}

const estilos = StyleSheet.create({
  base: { fontFamily: fonte.normal },
});
