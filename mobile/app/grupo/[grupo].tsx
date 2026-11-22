import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MiniGrafico } from '@/components/MiniGrafico';
import { Selo } from '@/components/Selo';
import { estilosComuns, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { Texto } from '@/components/Texto';
import { carregarEvolucao, type ExercicioNaEvolucao } from '@/db/consultas';
import { paraDataLocal } from '@/domain/datas';
import { formatarPercentual, textoEstagnacao, textoMeta } from '@/domain/textos';
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
      {exercicios?.map(({ exercicio, estado, variacao, sessoes, forcas, estagnacao }) => (
        <Pressable
          key={exercicio.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: exercicio.id } })}
          style={({ pressed }) => [estilosComuns.cartao, styles.linha, pressed && styles.pressionado]}
        >
          <View style={styles.textos}>
            <View style={styles.nomeComSelo}>
              <Texto style={styles.nome}>{exercicio.nome}</Texto>
              {estagnacao !== null && <Selo selo={{ texto: 'estagnado', direcao: 'desce' }} />}
            </View>
            <Texto style={estilosComuns.textoSecundario}>
              {estado === null ? 'Sem meta' : `Meta: ${textoMeta(estado, exercicio.porLado)}`} ·{' '}
              {variacao === null ? `${sessoes} ${sessoes === 1 ? 'sessão' : 'sessões'}` : `${formatarPercentual(variacao)} de força`}
            </Texto>
            {/* O motivo do selo. Só avisa: quem muda a meta é o motor (regra 2). */}
            {estagnacao !== null && <Texto style={styles.alerta}>{textoEstagnacao(exercicio.nome, estagnacao)}</Texto>}
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
  nomeComSelo: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  nome: { fontSize: 17, fontWeight: '600', color: cores.texto, flexShrink: 1 },
  alerta: { fontSize: 14, lineHeight: 20, color: cores.desce },
  pressionado: { opacity: 0.6 },
});
