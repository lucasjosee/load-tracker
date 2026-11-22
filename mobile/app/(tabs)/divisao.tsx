import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { SecaoAvisos } from '@/components/SecaoAvisos';
import { Stepper } from '@/components/Stepper';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { Texto } from '@/components/Texto';
import { prepararParaRefazerOnboarding, preencherDadosFicticios, SEMANAS_DE_HISTORICO } from '@/db/dadosFicticios';
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
import { useRefazerOnboarding } from '@/hooks/onboarding';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

export default function TelaDivisao() {
  const db = useSQLiteContext();
  const [treinos, setTreinos] = useState<TreinoComDias[] | null>(null);
  const [descansoS, setDescansoS] = useState(DESCANSO_PADRAO_S);
  const refazerOnboarding = useRefazerOnboarding();

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

  // Só existe em desenvolvimento (Expo Go): enche o app de histórico inventado
  // para dar o que ver nos gráficos.
  function preencherFicticios() {
    Alert.alert(
      'Trocar tudo por dados fictícios?',
      `A divisão e o histórico deste iPhone serão apagados e substituídos por ${SEMANAS_DE_HISTORICO} semanas de treinos inventados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Trocar',
          style: 'destructive',
          onPress: async () => {
            try {
              await preencherDadosFicticios(db, paraDataLocal(new Date()));
            } catch {
              Alert.alert('Não foi possível gerar os dados', 'Nada foi alterado.');
              return;
            }
            await reagendarNotificacoes(db);
            setTreinos(await listarTreinos(db));
            Alert.alert('Dados fictícios gravados', 'Veja as abas Hoje e Evolução.');
          },
        },
      ],
    );
  }

  // Também só em desenvolvimento: no Expo Go o seed pula o onboarding, e sem
  // isto não haveria como ver o primeiro uso do app.
  function refazer() {
    Alert.alert(
      'Refazer o onboarding?',
      'A divisão e o histórico deste iPhone serão apagados, e o app volta para a tela de boas-vindas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar e refazer',
          style: 'destructive',
          onPress: async () => {
            try {
              await prepararParaRefazerOnboarding(db);
            } catch {
              Alert.alert('Não foi possível apagar', 'Nada foi alterado.');
              return;
            }
            await reagendarNotificacoes(db); // sem treinos, cancela os avisos agendados
            refazerOnboarding();
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
        {treinos.length === 0 && <Texto style={estilosComuns.textoSecundario}>Nenhum treino cadastrado.</Texto>}

        {treinos.map((treino) => (
          <Pressable
            key={treino.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/treino/[id]', params: { id: treino.id } })}
            style={({ pressed }) => [estilosComuns.cartao, pressed && styles.pressionado]}
          >
            <Texto style={styles.nome}>{treino.nome}</Texto>
            <Texto style={estilosComuns.textoSecundario}>
              {treino.dias.length > 0 ? listarDiasPorExtenso(treino.dias) : 'Sem dia definido'}
            </Texto>
          </Pressable>
        ))}

        {diasDeDescanso.length > 0 && treinos.length > 0 && (
          <Texto style={estilosComuns.textoSecundario}>Descanso: {listarDiasPorExtenso(diasDeDescanso).toLowerCase()}</Texto>
        )}

        <Botao titulo="Novo treino" variante="secundario" onPress={() => router.push('/treino/novo')} />
      </Secao>

      <SecaoAvisos onMudou={() => reagendarNotificacoes(db)} />

      <Secao titulo="Descanso">
        <View style={styles.linha}>
          <Texto style={styles.rotulo}>Tempo entre séries</Texto>
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
        <Texto style={estilosComuns.textoSecundario}>
          O cronômetro fica em cada cartão da aba Hoje e vibra quando o tempo acaba, com o app aberto.
        </Texto>
      </Secao>

      <Secao titulo="Dados">
        <Texto style={estilosComuns.textoSecundario}>
          Tudo fica só neste iPhone. Exporte de vez em quando e salve em Arquivos ou no iCloud.
        </Texto>
        <Botao titulo="Exportar backup (JSON)" variante="secundario" onPress={exportar} />
        <Botao titulo="Restaurar backup" variante="perigo" onPress={restaurar} />
      </Secao>

      {__DEV__ && (
        <Secao titulo="Desenvolvimento">
          <Texto style={estilosComuns.textoSecundario}>
            Só aparece no Expo Go. Os dois botões apagam a divisão e o histórico: o primeiro grava{' '}
            {SEMANAS_DE_HISTORICO} semanas de treinos inventados, o segundo volta ao primeiro uso do app.
          </Texto>
          <Botao titulo="Preencher com dados fictícios" variante="perigo" onPress={preencherFicticios} />
          <Botao titulo="Refazer onboarding" variante="perigo" onPress={refazer} />
        </Secao>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  nome: { fontSize: 17, fontWeight: '600', color: cores.texto },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { fontSize: 17, color: cores.texto, flexShrink: 1 },
  pressionado: { opacity: 0.6 },
});
