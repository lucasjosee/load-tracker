import { StyleSheet, Text, View } from 'react-native';

import { progressoDoTreino } from '@/domain/regua';

import { cores } from './tema';

// Progresso do treino (§3.2): um segmento por exercício, na ordem do treino,
// aceso quando ele já foi registrado. Dá para ver quantos e quais faltam.
export function BarraDeProgresso({ feitos }: { feitos: boolean[] }) {
  const progresso = progressoDoTreino(feitos);
  if (progresso.total === 0) {
    return null;
  }
  return (
    <View style={styles.progresso} accessible accessibilityLabel={`${progresso.feitos} de ${progresso.total} exercícios feitos`}>
      <View style={styles.segmentos}>
        {feitos.map((feito, indice) => (
          <View key={indice} style={[styles.segmento, feito && styles.segmentoFeito]} />
        ))}
      </View>
      <Text style={styles.texto}>
        {progresso.feitos} de {progresso.total} {progresso.total === 1 ? 'exercício' : 'exercícios'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progresso: { gap: 6 },
  segmentos: { flexDirection: 'row', gap: 6 },
  segmento: { flex: 1, height: 6, borderRadius: 3, backgroundColor: cores.superficieAlta },
  segmentoFeito: { backgroundColor: cores.primaria },
  texto: { fontSize: 13, fontWeight: '500', color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
});
