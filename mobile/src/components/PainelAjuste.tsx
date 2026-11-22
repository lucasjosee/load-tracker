import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatarCarga } from '@/domain/textos';

import { Botao } from './Botao';
import { EditorDeSeries } from './EditorDeSeries';
import { Stepper } from './Stepper';
import { cores } from './tema';
import { Texto } from './Texto';

interface Props {
  cargaInicial: number;
  repsIniciais: number[]; // uma posição por série, já com a meta
  passoKg: number;
  porLado: boolean; // o stepper mostra "20 kg lado" (§5.2)
  ultimaVez: string | null; // linha de referência; null = sem histórico
  onSalvar: (cargaKg: number, reps: number[]) => void;
  onCancelar: () => void;
}

// "Ajustar" (§3.2): steppers da carga e das reps de cada série, já
// preenchidos com a meta, para mudar só o que foi diferente.
export function PainelAjuste({ cargaInicial, repsIniciais, passoKg, porLado, ultimaVez, onSalvar, onCancelar }: Props) {
  const [carga, setCarga] = useState(cargaInicial);
  const [reps, setReps] = useState(repsIniciais);

  return (
    <View style={styles.painel}>
      {/* Só aqui, e não no cartão: é a hora em que a pessoa decide o que digitar. */}
      {ultimaVez !== null && <Texto style={styles.ultimaVez}>{ultimaVez}</Texto>}
      <View style={styles.linha}>
        <Texto style={styles.rotulo}>Carga</Texto>
        <Stepper valor={carga} onMudar={setCarga} passo={passoKg} formatar={(kg) => formatarCarga(kg, porLado)} rotulo="carga" />
      </View>

      <EditorDeSeries reps={reps} onMudar={setReps} />

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
  ultimaVez: { fontSize: 14, color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
  rotulo: { fontSize: 16, color: cores.texto },
  botoes: { flexDirection: 'row', gap: 8 },
});
