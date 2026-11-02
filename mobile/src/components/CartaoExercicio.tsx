import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ItemDoTreino } from '@/db/consultas';
import { configDoExercicio } from '@/db/operacoes';
import { motivoDaMeta, seloDaMeta, textoMeta, textoRealizado, textoSeries } from '@/domain/textos';
import type { Realizado } from '@/domain/tipos';

import { Botao } from './Botao';
import { PainelAjuste } from './PainelAjuste';
import { Selo } from './Selo';
import { estilosComuns } from './Tela';
import { cores } from './tema';

interface Props {
  item: ItemDoTreino;
  onCheckin: (realizado: Realizado) => void;
  onDesfazer: () => void;
}

// Um exercício na aba Hoje (§3.2): nome, meta, selo de mudança, motivo e o
// check-in. Depois do check-in, o mesmo cartão mostra o que foi feito e a
// meta da próxima vez, que o motor acabou de calcular.
export function CartaoExercicio({ item, onCheckin, onDesfazer }: Props) {
  const { exercicio, estado, mudanca, feitoHoje } = item;
  const [ajustando, setAjustando] = useState(false);

  function bati() {
    if (estado === null) {
      return;
    }
    // 1 toque: todas as séries com a meta (§3.2).
    onCheckin({ cargaKg: estado.cargaKg, reps: Array.from({ length: exercicio.seriesAlvo }, () => estado.repsAlvo) });
  }

  function salvarAjuste(cargaKg: number, reps: number[]) {
    setAjustando(false);
    onCheckin({ cargaKg, reps });
  }

  return (
    <View style={[estilosComuns.cartao, feitoHoje !== null && styles.feito]}>
      <View style={styles.topo}>
        <Text style={styles.nome}>{exercicio.nome}</Text>
        {estado !== null && <Selo selo={seloDaMeta(mudanca)} />}
      </View>

      {feitoHoje !== null ? (
        <>
          <Text style={styles.resultado}>
            {feitoHoje.resultado === 'pulou' ? 'Pulado' : `✓ ${textoRealizado(feitoHoje.cargaKg, feitoHoje.reps)}`}
          </Text>
          {estado !== null && feitoHoje.resultado !== 'pulou' && (
            <Text style={estilosComuns.textoSecundario}>Próxima vez: {textoMeta(estado)}</Text>
          )}
          <View style={styles.botoes}>
            <Botao titulo="Desfazer" variante="secundario" compacto onPress={onDesfazer} />
          </View>
        </>
      ) : estado === null ? (
        <Text style={estilosComuns.textoSecundario}>Sem meta ainda: registre pelo Ajustar.</Text>
      ) : (
        <>
          <Text style={styles.meta}>
            {textoMeta(estado)} <Text style={styles.series}>· {textoSeries(exercicio.seriesAlvo)}</Text>
          </Text>
          <Text style={estilosComuns.textoSecundario}>{motivoDaMeta(estado, mudanca, configDoExercicio(exercicio))}</Text>
        </>
      )}

      {feitoHoje === null && !ajustando && (
        <View style={styles.botoes}>
          <Botao titulo="Bati" compacto desabilitado={estado === null} onPress={bati} />
          <Botao titulo="Ajustar" variante="secundario" compacto onPress={() => setAjustando(true)} />
          <Botao titulo="Pulei" variante="secundario" compacto desabilitado={estado === null} onPress={() => onCheckin('PULOU')} />
        </View>
      )}

      {ajustando && (
        <PainelAjuste
          cargaInicial={estado?.cargaKg ?? 0}
          repsIniciais={Array.from({ length: exercicio.seriesAlvo }, () => estado?.repsAlvo ?? exercicio.repsMin)}
          passoKg={exercicio.incrementoKg > 0 ? exercicio.incrementoKg : 1}
          onSalvar={salvarAjuste}
          onCancelar={() => setAjustando(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  feito: { opacity: 0.85 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nome: { fontSize: 17, fontWeight: '600', flexShrink: 1 },
  meta: { fontSize: 22, fontWeight: '700', color: cores.texto, marginTop: 2 },
  series: { fontSize: 17, fontWeight: '400', color: cores.textoSecundario },
  resultado: { fontSize: 17, fontWeight: '600', color: cores.sobe, marginTop: 2 },
  botoes: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
