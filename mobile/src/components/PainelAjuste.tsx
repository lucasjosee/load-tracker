import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatarKg } from '@/domain/textos';

import { Botao } from './Botao';
import { Stepper } from './Stepper';
import { cores } from './tema';

interface Props {
  cargaInicial: number;
  repsIniciais: number[]; // uma posição por série, já com a meta
  passoKg: number;
  onSalvar: (cargaKg: number, reps: number[]) => void;
  onCancelar: () => void;
}

// "Ajustar" (§3.2): steppers da carga e das reps de cada série, já
// preenchidos com a meta, para mudar só o que foi diferente.
export function PainelAjuste({ cargaInicial, repsIniciais, passoKg, onSalvar, onCancelar }: Props) {
  const [carga, setCarga] = useState(cargaInicial);
  const [reps, setReps] = useState(repsIniciais);

  const mudarSerie = (indice: number, valor: number) => setReps(reps.map((r, i) => (i === indice ? valor : r)));

  return (
    <View style={styles.painel}>
      <View style={styles.linha}>
        <Text style={styles.rotulo}>Carga</Text>
        <Stepper valor={carga} onMudar={setCarga} passo={passoKg} formatar={(kg) => `${formatarKg(kg)} kg`} rotulo="carga" />
      </View>

      {reps.map((valor, indice) => (
        <View key={indice} style={styles.linha}>
          <Text style={styles.rotulo}>Série {indice + 1}</Text>
          <Stepper valor={valor} onMudar={(v) => mudarSerie(indice, v)} maximo={100} rotulo={`reps da série ${indice + 1}`} />
        </View>
      ))}

      <View style={styles.botoes}>
        <Botao
          titulo="− Série"
          variante="secundario"
          compacto
          desabilitado={reps.length <= 1}
          onPress={() => setReps(reps.slice(0, -1))}
        />
        <Botao
          titulo="+ Série"
          variante="secundario"
          compacto
          onPress={() => setReps([...reps, reps[reps.length - 1] ?? 0])}
        />
      </View>
      <View style={styles.botoes}>
        <Botao titulo="Cancelar" variante="secundario" compacto onPress={onCancelar} />
        <Botao titulo="Salvar" compacto onPress={() => onSalvar(carga, reps)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  painel: { gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: cores.borda },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { fontSize: 16 },
  botoes: { flexDirection: 'row', gap: 8 },
});
