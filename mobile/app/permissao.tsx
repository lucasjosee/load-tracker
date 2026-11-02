import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { estilosComuns } from '@/components/Tela';
import { cores, espaco } from '@/components/tema';
import { reagendarNotificacoes } from '@/notificacoes/agendar';
import { pedirPermissao } from '@/notificacoes/permissao';

// Tela de contexto antes do pedido do iOS (§3.1, passo 4). O iOS só pergunta
// uma vez: explicar antes aumenta a chance de a pessoa dizer sim, e "Agora
// não" aqui não gasta essa única chance.
export default function TelaPermissao() {
  const db = useSQLiteContext();

  async function ativar() {
    if ((await pedirPermissao()) === 'concedida') {
      await reagendarNotificacoes(db); // os avisos da semana já ficam agendados
    }
    router.back();
  }

  return (
    <View style={styles.tela}>
      <Text style={styles.titulo}>Pra te avisar no dia do treino o que fazer</Text>
      <Text style={estilosComuns.textoSecundario}>
        No dia do treino chega um aviso com as metas, e às 21h um lembrete se você ainda não registrou. Os avisos
        são agendados no próprio iPhone e funcionam sem internet.
      </Text>
      <View style={styles.botoes}>
        <Botao titulo="Ativar avisos" onPress={ativar} />
        <Botao titulo="Agora não" variante="secundario" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, padding: espaco.grande, gap: espaco.grande, justifyContent: 'center', backgroundColor: cores.fundo },
  titulo: { fontSize: 28, fontWeight: '700' },
  botoes: { gap: espaco.pequeno },
});
