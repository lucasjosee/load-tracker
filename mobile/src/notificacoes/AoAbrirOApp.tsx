import * as Notifications from 'expo-notifications';
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

// Não desenha nada: só reagenda as notificações quando o app abre e toda vez
// que ele volta para a frente (§6, "ao abrir o app").
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

  return null;
}
