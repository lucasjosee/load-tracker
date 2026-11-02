import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

export type Permissao = 'concedida' | 'negada' | 'nao_perguntada';

// O iOS só mostra o pedido de permissão uma vez. Depois de negado, a única
// saída é a pessoa ligar nos Ajustes; por isso a tela precisa saber a diferença
// entre "nunca perguntei" e "perguntei e ela disse não".
export async function lerPermissao(): Promise<Permissao> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') {
    return 'concedida';
  }
  return status === 'denied' ? 'negada' : 'nao_perguntada';
}

export async function pedirPermissao(): Promise<Permissao> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return status === 'granted' ? 'concedida' : 'negada';
}

// Abre a página do app nos Ajustes do iOS. No Expo Go, quem tem a permissão
// é o próprio Expo Go, então é a página dele que abre.
export async function abrirAjustes(): Promise<void> {
  await Linking.openSettings();
}
