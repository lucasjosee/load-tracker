import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Text, TextInput } from 'react-native';

import { Botao } from '@/components/Botao';
import { SeletorDeDias } from '@/components/SeletorDeDias';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { excluirTreinoMantendoHistorico, salvarDiasDoTreino } from '@/db/operacoes';
import { listarTreinos, renomearTreino, type TreinoComDias } from '@/db/repositorios/treinos';
import { validarNomeDoTreino } from '@/domain/validacao';

interface Dados {
  treino: TreinoComDias;
  ocupados: Map<number, string>; // dias de outros treinos → nome do treino
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
  return { treino, ocupados };
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
  const { treino, ocupados } = dados;

  // Salva o nome quando o campo perde o foco, sem botão "salvar".
  async function salvarNome() {
    const problema = validarNomeDoTreino(nome);
    setErro(problema);
    if (problema !== null || nome.trim() === treino.nome) {
      return;
    }
    await renomearTreino(db, treino.id, nome.trim());
    await carregar();
  }

  async function mudarDias(dias: number[]) {
    await salvarDiasDoTreino(db, treino.id, dias);
    await carregar();
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

      <Secao titulo="Treino">
        <Botao titulo="Excluir treino" variante="perigo" onPress={confirmarExclusao} />
      </Secao>
    </Tela>
  );
}
