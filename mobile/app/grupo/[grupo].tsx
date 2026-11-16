import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MiniGrafico } from '@/components/MiniGrafico';
import { estilosComuns, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { carregarEvolucao, type ExercicioNaEvolucao } from '@/db/consultas';
import { paraDataLocal } from '@/domain/datas';
import { formatarPercentual, textoMeta } from '@/domain/textos';
import { ehGrupoMuscular, NOMES_DOS_GRUPOS } from '@/domain/tipos';

// Exercícios de um grupo muscular, com a variação de cada um (§3.6).
export default function TelaGrupo() {
  const db = useSQLiteContext();
  const { grupo } = useLocalSearchParams<{ grupo: string }>();
  const [exercicios, setExercicios] = useState<ExercicioNaEvolucao[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarEvolucao(db, paraDataLocal(new Date())).then((evolucao) =>
        setExercicios(evolucao.exercicios.filter((item) => item.exercicio.grupoMuscular === grupo)),
      );
    }, [db, grupo]),
  );

  // O grupo vem da URL: confere antes de usar como GrupoMuscular.
  const titulo = ehGrupoMuscular(grupo) ? NOMES_DOS_GRUPOS[grupo] : 'Grupo';

  return (
    <Tela>
      <Stack.Screen options={{ title: titulo }} />
      {exercicios?.map(({ exercicio, estado, variacao, sessoes, forcas }) => (
        <Pressable
          key={exercicio.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: exercicio.id } })}
          style={({ pressed }) => [estilosComuns.cartao, styles.linha, pressed && styles.pressionado]}
        >
          <View style={styles.textos}>
            <Text style={styles.nome}>{exercicio.nome}</Text>
            <Text style={estilosComuns.textoSecundario}>
              {estado === null ? 'Sem meta' : `Meta: ${textoMeta(estado, exercicio.porLado)}`} ·{' '}
              {variacao === null ? `${sessoes} ${sessoes === 1 ? 'sessão' : 'sessões'}` : `${formatarPercentual(variacao)} de força`}
            </Text>
          </View>
          <MiniGrafico valores={forcas} />
        </Pressable>
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textos: { flex: 1, gap: 4 },
  nome: { fontSize: 17, fontWeight: '600', color: cores.texto },
  pressionado: { opacity: 0.6 },
});
