import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BarraDeProgresso } from '@/components/BarraDeProgresso';
import { Botao } from '@/components/Botao';
import { ExercicioEmFoco } from '@/components/ExercicioEmFoco';
import { LinhaDoExercicio } from '@/components/LinhaDoExercicio';
import { ResumoDoTreino } from '@/components/ResumoDoTreino';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { TempoDoTreino } from '@/components/TempoDoTreino';
import { cores } from '@/components/tema';
import { carregarHoje, type Hoje, type ItemDoTreino } from '@/db/consultas';
import {
  cancelarTreinoVazio,
  desfazerRegistro,
  fazerCheckin,
  finalizarTreino,
  pausarTreino,
  retomarTreino,
} from '@/db/operacoes';
import { obterConfig } from '@/db/repositorios/config';
import { paraDataLocal } from '@/domain/datas';
import { lerDuracaoDoDescanso } from '@/domain/descanso';
import { segundosDeTreino } from '@/domain/duracao';
import { adiarExercicio, filaDoTreino } from '@/domain/fila';
import type { Realizado } from '@/domain/tipos';
import { useGravacao } from '@/hooks/gravacao';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

// `Extract` tira da união `Hoje` só o caso de dia de treino.
type TreinoDeHoje = Extract<Hoje, { tipo: 'treino' }>;

// O treino em andamento (§3.2), por cima das abas: um exercício por vez. Abre
// pelo "Iniciar treino" da aba Hoje, que cria a sessão. Voltar não encerra o
// treino: os registros e o início da sessão já estão no banco, então ao
// reabrir a fila recomeça do que falta e o tempo continua contando.
export default function TelaSessao() {
  const db = useSQLiteContext();
  const { treinoId } = useLocalSearchParams<{ treinoId: string }>();
  const [dados, setDados] = useState<{ data: string; treino: TreinoDeHoje; descansoS: number } | null>(null);
  // Exercícios que a pessoa deixou para depois, na ordem em que adiou. Fica
  // só na memória da tela: fechá-la devolve a fila à ordem do treino.
  const [adiados, setAdiados] = useState<string[]>([]);
  const [encerrado, setEncerrado] = useState(false);
  const gravarComTrava = useGravacao(); // trava contra toque duplo
  // A tela não apaga sozinha enquanto esta tela está aberta: o cronômetro e o
  // descanso ficam à vista com o celular apoiado no aparelho.
  useKeepAwake();

  const carregar = useCallback(async (): Promise<TreinoDeHoje | null> => {
    const data = paraDataLocal(new Date());
    const [conteudo, descanso] = await Promise.all([carregarHoje(db, data, treinoId), obterConfig(db, 'descanso_segundos')]);
    if (conteudo.tipo !== 'treino') {
      router.back(); // o treino foi apagado enquanto a tela estava aberta
      return null;
    }
    setDados({ data, treino: conteudo, descansoS: lerDuracaoDoDescanso(descanso) });
    return conteudo;
  }, [db, treinoId]);

  // Ao voltar do detalhe de um exercício, os dados podem ter mudado.
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  if (dados === null) {
    return <Tela>{null}</Tela>;
  }
  const { data, treino, descansoS } = dados;
  const { itens } = treino;

  const fila = filaDoTreino(
    itens.map((item) => item.exercicio.id),
    itens.filter((item) => item.feitoHoje !== null).map((item) => item.exercicio.id),
    adiados,
  );
  const porId = new Map(itens.map((item) => [item.exercicio.id, item]));
  const naFila = fila.map((id) => porId.get(id)).filter((item) => item !== undefined);
  const [atual, ...aSeguir] = naFila;
  const feitos = itens.filter((item) => item.feitoHoje !== null);
  const mostrarResumo = encerrado || atual === undefined;

  // Fecha a sessão e mostra o resumo. Reagendar com o treino finalizado tira
  // o lembrete das 21h de hoje e atualiza os avisos com as metas novas (§6).
  async function encerrar(sessaoId: string) {
    await finalizarTreino(db, sessaoId);
    await reagendarNotificacoes(db);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await carregar();
    setEncerrado(true);
  }

  const checkin = (item: ItemDoTreino, realizado: Realizado) =>
    gravarComTrava(async () => {
      await fazerCheckin(db, item.exercicio, realizado, treino.treino.id, data);
      const depois = await carregar();
      // Era o último que faltava: o treino se encerra sozinho.
      if (depois !== null && depois.sessao !== null && depois.itens.every((i) => i.feitoHoje !== null)) {
        await encerrar(depois.sessao.id);
      }
    });

  const desfazer = (item: ItemDoTreino) =>
    gravarComTrava(async () => {
      if (item.feitoHoje !== null) {
        await desfazerRegistro(db, item.exercicio, item.feitoHoje.id);
        await carregar();
      }
    });

  const pausado = treino.sessao !== null && treino.sessao.pausadaEm !== null;

  const alternarPausa = () =>
    gravarComTrava(async () => {
      if (treino.sessao === null) {
        return;
      }
      await (pausado ? retomarTreino(db, treino.sessao.id) : pausarTreino(db, treino.sessao.id));
      await carregar();
    });

  function pedirParaEncerrar() {
    const sessao = treino.sessao;
    if (sessao === null) {
      router.back();
      return;
    }
    if (feitos.length === 0) {
      // Nada registrado: não há o que resumir. A sessão vazia é apagada.
      Alert.alert('Sair do treino?', 'Nenhum exercício foi registrado. O treino volta a ficar por iniciar.', [
        { text: 'Continuar treinando', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () =>
            gravarComTrava(async () => {
              await cancelarTreinoVazio(db, sessao.id);
              router.back();
            }),
        },
      ]);
      return;
    }
    Alert.alert(
      'Encerrar o treino?',
      naFila.length === 1 ? 'Falta 1 exercício. Ele fica sem registro hoje.' : `Faltam ${naFila.length} exercícios. Eles ficam sem registro hoje.`,
      [
        { text: 'Continuar treinando', style: 'cancel' },
        { text: 'Encerrar', onPress: () => gravarComTrava(() => encerrar(sessao.id)) },
      ],
    );
  }

  const abrir = (item: ItemDoTreino) => router.push({ pathname: '/exercicio/[id]', params: { id: item.exercicio.id } });

  return (
    <Tela>
      <Stack.Screen options={{ title: treino.treino.nome }} />
      <View style={styles.topo}>
        {/* Depois de encerrado o tempo para: a duração vai no resumo. */}
        {!mostrarResumo && treino.sessao !== null && (
          <View style={styles.tempo}>
            <TempoDoTreino sessao={treino.sessao} />
            {!pausado && <Botao titulo="Pausar" variante="secundario" compacto onPress={alternarPausa} />}
          </View>
        )}
        <BarraDeProgresso feitos={itens.map((item) => item.feitoHoje !== null)} />
      </View>

      {mostrarResumo ? (
        <>
          <ResumoDoTreino
            itens={itens}
            tipos={treino.tiposDaSessao}
            duracaoS={treino.sessao !== null && treino.sessao.finalizadaEm !== null ? segundosDeTreino(treino.sessao, 0) : null}
          />
          <Botao titulo="Concluir" onPress={() => router.back()} />
        </>
      ) : pausado ? (
        // Pausado, o exercício sai da frente: registrar agora contaria um
        // tempo que não foi de treino. Retomar devolve tudo como estava.
        <View style={[estilosComuns.cartao, styles.pausa]}>
          <Text style={styles.tituloDaPausa}>Treino pausado</Text>
          <Text style={estilosComuns.textoSecundario}>O tempo está parado. O que você já registrou continua salvo.</Text>
          <Botao titulo="Retomar treino" onPress={alternarPausa} />
          <Botao titulo="Encerrar treino" variante="secundario" onPress={pedirParaEncerrar} />
        </View>
      ) : (
        <>
          {/* A `key` faz o React montar um cartão novo a cada exercício: o
              painel Ajustar e o cronômetro não passam de um para o outro. */}
          <ExercicioEmFoco
            key={atual.exercicio.id}
            item={atual}
            onCheckin={(realizado) => checkin(atual, realizado)}
            onAdiar={aSeguir.length === 0 ? null : () => setAdiados(adiarExercicio(adiados, atual.exercicio.id))}
            onAbrir={() => abrir(atual)}
            descansoS={descansoS}
          />
          {aSeguir.length > 0 && (
            <Secao titulo="A seguir">
              {aSeguir.map((item) => (
                <LinhaDoExercicio key={item.exercicio.id} item={item} onAbrir={() => abrir(item)} />
              ))}
            </Secao>
          )}
          {feitos.length > 0 && (
            <Secao titulo="Feitos">
              {feitos.map((item) => (
                <LinhaDoExercicio key={item.exercicio.id} item={item} onAbrir={() => abrir(item)} onDesfazer={() => desfazer(item)} />
              ))}
            </Secao>
          )}
          <Botao titulo="Encerrar treino" variante="secundario" onPress={pedirParaEncerrar} />
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { gap: 10 },
  tempo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pausa: { padding: 20, gap: 12 },
  tituloDaPausa: { fontSize: 24, fontWeight: '700', color: cores.texto },
});
