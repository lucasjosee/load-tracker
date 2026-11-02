import { StyleSheet, Text, View } from 'react-native';

import type { ItemDoTreino } from '@/db/consultas';
import { configDoExercicio } from '@/db/operacoes';
import { motivoDaMeta, seloDaMeta, textoMeta, textoSeries } from '@/domain/textos';

import { Selo } from './Selo';
import { estilosComuns } from './Tela';
import { cores } from './tema';

interface Props {
  item: ItemDoTreino;
}

// Um exercício na aba Hoje (§3.2): nome, meta, selo de mudança e o motivo.
export function CartaoExercicio({ item }: Props) {
  const { exercicio, estado, mudanca } = item;

  return (
    <View style={estilosComuns.cartao}>
      <View style={styles.topo}>
        <Text style={styles.nome}>{exercicio.nome}</Text>
        {estado !== null && <Selo selo={seloDaMeta(mudanca)} />}
      </View>

      {estado === null ? (
        <Text style={estilosComuns.textoSecundario}>Sem meta ainda.</Text>
      ) : (
        <>
          <Text style={styles.meta}>
            {textoMeta(estado)} <Text style={styles.series}>· {textoSeries(exercicio.seriesAlvo)}</Text>
          </Text>
          <Text style={estilosComuns.textoSecundario}>{motivoDaMeta(estado, mudanca, configDoExercicio(exercicio))}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nome: { fontSize: 17, fontWeight: '600', flexShrink: 1 },
  meta: { fontSize: 22, fontWeight: '700', color: cores.texto, marginTop: 2 },
  series: { fontSize: 17, fontWeight: '400', color: cores.textoSecundario },
});
