import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { SeletorDeDias } from '@/components/SeletorDeDias';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { excluirTreinoMantendoHistorico, moverExercicio, salvarDiasDoTreino } from '@/db/operacoes';
import { listarEstados } from '@/db/repositorios/estadoProgressao';
import { desvincularExercicio, listarExerciciosDoTreino, type Exercicio } from '@/db/repositorios/exercicios';
import { listarTreinos, renomearTreino, type TreinoComDias } from '@/db/repositorios/treinos';
import { textoMeta, textoSeries } from '@/domain/textos';
import type { EstadoProgressao } from '@/domain/tipos';
import { validarNomeDoTreino } from '@/domain/validacao';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

interface Dados {
  treino: TreinoComDias;
  ocupados: Map<number, string>; // dias de outros treinos → nome do treino
  exercicios: Exercicio[];
  estados: Map<string, EstadoProgressao>;
}

async function carregarDados(db: SQLiteDatabase, id: string): Promise<Dados | null> {
  const treinos = await listarTreinos(db);
  const treino = treinos.find((t) => t.id === id);
  if (treino === undefined) {
    return null;
  }
  const ocupados = new Map(
    treinos.filter((t) => t.id !== id).flatMap((t) => t.dias.map((dia) => [dia, t.nome] as const)),
  );
  const [exercicios, estados] = await Promise.all([listarExerciciosDoTreino(db, id), listarEstados(db)]);
  return { treino, ocupados, exercicios, estados };
}

export default function TelaTreino() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dados, setDados] = useState<Dados | null>(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const novos = await carregarDados(db, id);
    setDados(novos);
    if (novos !== null) {
      setNome(novos.treino.nome);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  if (dados === null) {
    return <Tela>{null}</Tela>;
  }
  const { treino, ocupados, exercicios, estados } = dados;

  // Salva o nome quando o campo perde o foco, sem botão "salvar".
  async function salvarNome() {
    const problema = validarNomeDoTreino(nome);
    setErro(problema);
    if (problema !== null || nome.trim() === treino.nome) {
      return;
    }
    await renomearTreino(db, treino.id, nome.trim());
    await reagendarNotificacoes(db); // o nome do treino vai no título do aviso
    await carregar();
  }

  async function mudarDias(dias: number[]) {
    await salvarDiasDoTreino(db, treino.id, dias);
    await reagendarNotificacoes(db);
    await carregar();
  }

  async function mover(exercicio: Exercicio, direcao: -1 | 1) {
    await moverExercicio(db, treino.id, exercicio.id, direcao);
    await reagendarNotificacoes(db); // a ordem decide quem aparece no aviso
    await carregar();
  }

  function confirmarRemocao(exercicio: Exercicio) {
    Alert.alert(`Tirar ${exercicio.nome} do ${treino.nome}?`, 'O histórico do exercício continua salvo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Tirar',
        style: 'destructive',
        onPress: async () => {
          await desvincularExercicio(db, treino.id, exercicio.id);
          await reagendarNotificacoes(db);
          await carregar();
        },
      },
    ]);
  }

  function confirmarExclusao() {
    Alert.alert(
      `Excluir ${treino.nome}?`,
      'O treino sai da divisão. Os exercícios e todo o histórico de cargas continuam salvos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await excluirTreinoMantendoHistorico(db, treino.id);
            await reagendarNotificacoes(db);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: treino.nome }} />

      <Secao titulo="Nome">
        <TextInput
          value={nome}
          onChangeText={setNome}
          onEndEditing={salvarNome}
          returnKeyType="done"
          style={estilosComuns.campo}
        />
        {erro !== null && <Text style={estilosComuns.erro}>{erro}</Text>}
      </Secao>

      <Secao titulo="Dias">
        <SeletorDeDias dias={treino.dias} onMudar={mudarDias} ocupados={ocupados} nomeDoTreino={treino.nome} />
      </Secao>

      <Secao titulo="Exercícios">
        {exercicios.length === 0 && <Text style={estilosComuns.textoSecundario}>Nenhum exercício ainda.</Text>}
        {exercicios.map((exercicio, indice) => {
          const estado = estados.get(exercicio.id);
          return (
            <View key={exercicio.id} style={[estilosComuns.cartao, styles.linhaExercicio]}>
              <Pressable
                style={styles.infoExercicio}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: exercicio.id } })}
              >
                <Text style={styles.nomeExercicio}>{exercicio.nome}</Text>
                <Text style={estilosComuns.textoSecundario}>
                  {estado === undefined ? 'Sem meta' : textoMeta(estado)} · {textoSeries(exercicio.seriesAlvo)}
                </Text>
              </Pressable>
              <BotaoIcone rotulo={`Subir ${exercicio.nome}`} simbolo="↑" desabilitado={indice === 0} onPress={() => mover(exercicio, -1)} />
              <BotaoIcone
                rotulo={`Descer ${exercicio.nome}`}
                simbolo="↓"
                desabilitado={indice === exercicios.length - 1}
                onPress={() => mover(exercicio, 1)}
              />
              <BotaoIcone rotulo={`Tirar ${exercicio.nome} do treino`} simbolo="✕" onPress={() => confirmarRemocao(exercicio)} />
            </View>
          );
        })}
        <Botao
          titulo="Adicionar exercício"
          variante="secundario"
          onPress={() => router.push({ pathname: '/exercicio/novo', params: { treinoId: treino.id } })}
        />
      </Secao>

      <Secao titulo="Treino">
        <Botao titulo="Excluir treino" variante="perigo" onPress={confirmarExclusao} />
      </Secao>
    </Tela>
  );
}

interface BotaoIconeProps {
  simbolo: string;
  rotulo: string;
  onPress: () => void;
  desabilitado?: boolean;
}

function BotaoIcone({ simbolo, rotulo, onPress, desabilitado = false }: BotaoIconeProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      disabled={desabilitado}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.botaoIcone, (pressed || desabilitado) && styles.apagado]}
    >
      <Text style={styles.simbolo}>{simbolo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linhaExercicio: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoExercicio: { flex: 1, gap: 2 },
  nomeExercicio: { fontSize: 17 },
  botaoIcone: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  simbolo: { fontSize: 18, color: cores.primaria },
  apagado: { opacity: 0.3 },
});
