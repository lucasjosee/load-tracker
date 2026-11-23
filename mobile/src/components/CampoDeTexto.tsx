import { TextInput, type TextInputProps } from 'react-native';

import { cores } from './tema';

// O campo de texto do app: o `TextInput` com o cursor na cor de marca, o
// placeholder legível no fundo escuro e o teclado escuro. Sem este componente,
// cada campo teria de repetir as três coisas, e o primeiro que esquecesse
// abriria um teclado claro no meio do app escuro. O lint barra o `TextInput`
// direto (eslint.config.js).
//
// As props de quem usa vêm depois das nossas, então um campo ainda pode trocar
// qualquer uma delas.
export function CampoDeTexto(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={cores.textoSecundario}
      selectionColor={cores.primaria}
      keyboardAppearance="dark"
      {...props}
    />
  );
}
