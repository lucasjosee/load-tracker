import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { reagendarNotificacoes } from './agendar';

// Com o app aberto, o iOS não mostra notificação nenhuma a menos que a gente
// diga como tratá-la. Aqui: mostra o banner e põe na central, sem som.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Não desenha nada: reagenda as notificações quando o app abre e toda vez
// que ele volta para a frente (§6, "ao abrir o app"), e leva para a aba Hoje
// quando a pessoa toca numa notificação.
export function AoAbrirOApp() {
  const db = useSQLiteContext();

  useEffect(() => {
    reagendarNotificacoes(db);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        reagendarNotificacoes(db);
      }
    });
    return () => assinatura.remove();
  }, [db]);

  // Toque numa notificação com o app em segundo plano: volta para a aba Hoje,
  // mesmo que ele tenha ficado em outra tela. Com o app fechado não precisa
  // de nada: ele já abre na aba Hoje, que é a primeira.
  useEffect(() => {
    const assinatura = Notifications.addNotificationResponseReceivedListener(() => {
      router.navigate('/');
    });
    return () => assinatura.remove();
  }, []);

  return null;
}
