import { StyleSheet, View } from 'react-native';

import type { Regua, SituacaoDoPonto } from '@/domain/regua';
import { formatarKg } from '@/domain/textos';

import { cores } from './tema';
import { Texto } from './Texto';

interface Props {
  regua: Regua;
  // Depois de um deload a régua fica na cor de recuo (`desce`): recomeçar do início da faixa
  // ali é recuo, não progresso.
  recuo?: boolean;
}

// A faixa de reps como uma fileira de pontos: o que já passou, a meta de hoje
// (com contorno) e o que falta até subir a carga, que aparece no fim.
export function ReguaDeReps({ regua, recuo = false }: Props) {
  const destaque = recuo ? cores.desce : cores.primaria;
  const metaDeHoje = regua.pontos.find((ponto) => ponto.situacao === 'alvo')?.reps;

  return (
    <View
      style={styles.linha}
      accessible
      accessibilityLabel={`Meta de hoje: ${metaDeHoje} reps. Em ${regua.pontos[regua.pontos.length - 1]?.reps} reps a carga sobe para ${formatarKg(regua.proximaCargaKg)} kg.`}
    >
      {regua.pontos.map((ponto) => (
        <View key={ponto.reps} style={[styles.ponto, estiloDoPonto(ponto.situacao, recuo)]}>
          <Texto style={[styles.numero, { color: ponto.situacao === 'falta' ? cores.textoSecundario : destaque }]}>
            {ponto.reps}
          </Texto>
        </View>
      ))}
      <Texto style={styles.proxima}>→ {formatarKg(regua.proximaCargaKg)} kg</Texto>
    </View>
  );
}

function estiloDoPonto(situacao: SituacaoDoPonto, recuo: boolean) {
  switch (situacao) {
    case 'feito':
      // A cor de destaque bem apagada, para não disputar com a meta de hoje.
      return { backgroundColor: recuo ? cores.aviso : cores.primariaSuave };
    case 'alvo':
      return { borderWidth: 2, borderColor: recuo ? cores.desce : cores.primaria };
    case 'falta':
      return { backgroundColor: cores.superficieAlta };
  }
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  proxima: { fontSize: 13, fontWeight: '600', color: cores.textoSecundario, marginLeft: 4 },
});
