import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { reagendarNotificacoes } from './agendar';
import { ID_DO_TREINO_EM_ANDAMENTO, tirarTreinoEmAndamentoSeAcabou } from './TreinoEmAndamento';

// Com o app aberto, o iOS não mostra notificação nenhuma a menos que a gente
// diga como tratá-la. Aqui: mostra o banner e põe na central, sem som. A do
// treino em andamento vai só para a central: ela nasce com a tela do treino
// aberta, e um banner por exercício cobriria o que a pessoa está olhando.
Notifications.setNotificationHandler({
  handleNotification: async (notificacao) => ({
    shouldShowBanner: notificacao.request.identifier !== ID_DO_TREINO_EM_ANDAMENTO,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Não desenha nada: reagenda as notificações quando o app abre e toda vez
// que ele volta para a frente (§6, "ao abrir o app"), e leva para a tela
// certa quando a pessoa toca numa notificação.
export function AoAbrirOApp() {
  const db = useSQLiteContext();

  useEffect(() => {
    const aoAbrir = () => {
      reagendarNotificacoes(db);
      tirarTreinoEmAndamentoSeAcabou(db);
    };
    aoAbrir();
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        aoAbrir();
      }
    });
    return () => assinatura.remove();
  }, [db]);

  // Toque numa notificação com o app em segundo plano: volta para a aba Hoje,
  // mesmo que ele tenha ficado em outra tela; a do treino em andamento leva
  // para a tela do treino. Com o app fechado não precisa de nada: ele já abre
  // na aba Hoje, que é a primeira, e de lá o treino está a um toque.
  useEffect(() => {
    const assinatura = Notifications.addNotificationResponseReceivedListener((resposta) => {
      const { request } = resposta.notification;
      const treinoId = request.content.data?.treinoId;
      if (request.identifier === ID_DO_TREINO_EM_ANDAMENTO && typeof treinoId === 'string') {
        router.navigate({ pathname: '/sessao', params: { treinoId } });
      } else {
        router.navigate('/');
      }
    });
    return () => assinatura.remove();
  }, []);

  return null;
}
