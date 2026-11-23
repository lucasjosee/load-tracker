import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { progressoDoTreino } from '@/domain/regua';

import { cores, gradienteAurora } from './tema';

interface Props {
  feitos: boolean[]; // um por exercício, na ordem do treino
  // A posição do exercício da vez, que fica em branco; null = nenhum (aba Hoje).
  atual?: number | null;
  aoLado?: ReactNode; // algo na mesma linha da contagem, à direita (o tempo do treino)
}

// Progresso do treino (§3.2): um segmento por exercício, na ordem do treino.
// Os já registrados ficam acesos com a aurora e o da vez fica branco: dá para
// ver quantos e quais faltam.
export function BarraDeProgresso({ feitos, atual = null, aoLado }: Props) {
  const progresso = progressoDoTreino(feitos);
  if (progresso.total === 0) {
    return null;
  }
  return (
    <View style={styles.progresso}>
      <View style={styles.linha}>
        <Text style={styles.texto} accessibilityLabel={`${progresso.feitos} de ${progresso.total} exercícios feitos`}>
          {progresso.feitos} de {progresso.total} {progresso.total === 1 ? 'exercício' : 'exercícios'}
        </Text>
        {aoLado}
      </View>
      <View style={styles.segmentos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {feitos.map((feito, indice) => (
          <View key={indice} style={[styles.segmento, feito ? styles.segmentoFeito : indice === atual && styles.segmentoAtual]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progresso: { gap: 10 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 20 },
  segmentos: { flexDirection: 'row', gap: 6 },
  segmento: { flex: 1, height: 4, borderRadius: 2, backgroundColor: cores.superficieAlta },
  segmentoFeito: { backgroundColor: cores.primaria, backgroundImage: gradienteAurora },
  segmentoAtual: { backgroundColor: cores.texto },
  texto: { fontSize: 15, fontWeight: '500', color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
});
