import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { SecaoAvisos } from '@/components/SecaoAvisos';
import { Stepper } from '@/components/Stepper';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { escolherArquivoDeBackup, exportarBackup, restaurarBackup, VERSAO_DO_BANCO } from '@/db/backup';
import { obterConfig, salvarConfig } from '@/db/repositorios/config';
import { listarTreinos, type TreinoComDias } from '@/db/repositorios/treinos';
import { lerBackup, resumoDoBackup } from '@/domain/backup';
import { listarDiasPorExtenso, paraDataLocal } from '@/domain/datas';
import {
  DESCANSO_MAXIMO_S,
  DESCANSO_MINIMO_S,
  DESCANSO_PADRAO_S,
  formatarDescanso,
  lerDuracaoDoDescanso,
  PASSO_DO_DESCANSO_S,
} from '@/domain/descanso';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

export default function TelaDivisao() {
  const db = useSQLiteContext();
  const [treinos, setTreinos] = useState<TreinoComDias[] | null>(null);
  const [descansoS, setDescansoS] = useState(DESCANSO_PADRAO_S);

  // useFocusEffect roda ao abrir a aba e toda vez que ela volta a aparecer
  // (ex.: depois de editar um treino), então a lista nunca fica velha.
  useFocusEffect(
    useCallback(() => {
      listarTreinos(db).then(setTreinos);
      obterConfig(db, 'descanso_segundos').then((texto) => setDescansoS(lerDuracaoDoDescanso(texto)));
    }, [db]),
  );

  if (treinos === null) {
    return <Tela titulo="Divisão">{null}</Tela>;
  }

  async function mudarDescanso(segundos: number) {
    setDescansoS(segundos);
    await salvarConfig(db, 'descanso_segundos', String(segundos));
  }

  async function exportar() {
    try {
      await exportarBackup(db, paraDataLocal(new Date()));
    } catch {
      Alert.alert('Não foi possível exportar', 'Tente de novo. Seus dados continuam no aparelho.');
    }
  }

  // Restaurar apaga o que está no aparelho, então são três passos: escolher o
  // arquivo, conferir se é mesmo um backup, e só então pedir a confirmação.
  async function restaurar() {
    let texto: string | null;
    try {
      texto = await escolherArquivoDeBackup();
    } catch {
      Alert.alert('Não foi possível abrir o arquivo', 'Tente de novo ou escolha outro arquivo.');
      return;
    }
    if (texto === null) {
      return; // a pessoa cancelou
    }
    const leitura = lerBackup(texto, VERSAO_DO_BANCO);
    if (!leitura.ok) {
      Alert.alert('Não dá para restaurar', leitura.erro);
      return;
    }
    Alert.alert(
      'Restaurar este backup?',
      `${resumoDoBackup(leitura.valor)}.\n\nTudo o que está neste iPhone hoje será substituído.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            try {
              await restaurarBackup(db, leitura.valor);
            } catch {
              Alert.alert('O backup não foi restaurado', 'O arquivo tem dados que o app não aceita. Nada foi alterado.');
              return;
            }
            await reagendarNotificacoes(db); // os avisos passam a seguir a divisão restaurada
            setTreinos(await listarTreinos(db));
            Alert.alert('Backup restaurado', 'Seus dados voltaram.');
          },
        },
      ],
    );
  }

  const diasComTreino = treinos.flatMap((treino) => treino.dias);
  const diasDeDescanso = [0, 1, 2, 3, 4, 5, 6].filter((dia) => !diasComTreino.includes(dia));

  return (
    <Tela titulo="Divisão">
      <Secao titulo="Treinos">
        {treinos.length === 0 && <Text style={estilosComuns.textoSecundario}>Nenhum treino cadastrado.</Text>}

        {treinos.map((treino) => (
          <Pressable
            key={treino.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/treino/[id]', params: { id: treino.id } })}
            style={({ pressed }) => [estilosComuns.cartao, pressed && styles.pressionado]}
          >
            <Text style={styles.nome}>{treino.nome}</Text>
            <Text style={estilosComuns.textoSecundario}>
              {treino.dias.length > 0 ? listarDiasPorExtenso(treino.dias) : 'Sem dia definido'}
            </Text>
          </Pressable>
        ))}

        {diasDeDescanso.length > 0 && treinos.length > 0 && (
          <Text style={estilosComuns.textoSecundario}>Descanso: {listarDiasPorExtenso(diasDeDescanso).toLowerCase()}</Text>
        )}

        <Botao titulo="Novo treino" variante="secundario" onPress={() => router.push('/treino/novo')} />
      </Secao>

      <SecaoAvisos onMudou={() => reagendarNotificacoes(db)} />

      <Secao titulo="Descanso">
        <View style={styles.linha}>
          <Text style={styles.rotulo}>Tempo entre séries</Text>
          <Stepper
            valor={descansoS}
            onMudar={mudarDescanso}
            passo={PASSO_DO_DESCANSO_S}
            minimo={DESCANSO_MINIMO_S}
            maximo={DESCANSO_MAXIMO_S}
            formatar={formatarDescanso}
            rotulo="tempo de descanso"
          />
        </View>
        <Text style={estilosComuns.textoSecundario}>
          O cronômetro fica em cada cartão da aba Hoje e vibra quando o tempo acaba, com o app aberto.
        </Text>
      </Secao>

      <Secao titulo="Dados">
        <Text style={estilosComuns.textoSecundario}>
          Tudo fica só neste iPhone. Exporte de vez em quando e salve em Arquivos ou no iCloud.
        </Text>
        <Botao titulo="Exportar backup (JSON)" variante="secundario" onPress={exportar} />
        <Botao titulo="Restaurar backup" variante="perigo" onPress={restaurar} />
      </Secao>

    </Tela>
  );
}

const styles = StyleSheet.create({
  nome: { fontSize: 17, fontWeight: '600', color: cores.texto },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { fontSize: 17, color: cores.texto, flexShrink: 1 },
  pressionado: { opacity: 0.6 },
});
