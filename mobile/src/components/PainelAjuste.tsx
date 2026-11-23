import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatarCarga } from '@/domain/textos';

import { Botao } from './Botao';
import { EditorDeSeries } from './EditorDeSeries';
import { Stepper } from './Stepper';
import { estilosComuns } from './Tela';
import { cores } from './tema';

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
// preenchidos com a meta, para mudar só o que foi diferente. Abre num painel
// de vidro no lugar dos botões.
export function PainelAjuste({ cargaInicial, repsIniciais, passoKg, porLado, ultimaVez, onSalvar, onCancelar }: Props) {
  const [carga, setCarga] = useState(cargaInicial);
  const [reps, setReps] = useState(repsIniciais);

  return (
    <View style={[estilosComuns.cartao, styles.painel]}>
      {/* Só aqui, e não no cartão: é a hora em que a pessoa decide o que digitar. */}
      {ultimaVez !== null && <Text style={styles.ultimaVez}>{ultimaVez}</Text>}
      <View style={styles.linha}>
        <Text style={styles.rotulo}>Carga</Text>
        {/* A carga também dá para digitar: no primeiro registro ela começa em 0. */}
        <Stepper
          valor={carga}
          onMudar={setCarga}
          passo={passoKg}
          formatar={(kg) => formatarCarga(kg, porLado)}
          rotulo="carga"
          digitavel
          unidade={porLado ? 'kg lado' : 'kg'}
        />
      </View>

      <EditorDeSeries reps={reps} onMudar={setReps} />

      <View style={styles.botoes}>
        <Botao titulo="Cancelar" variante="secundario" compacto peso={1} onPress={onCancelar} />
        <Botao titulo="Salvar" compacto peso={1} onPress={() => onSalvar(carga, reps)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  painel: { gap: 10, marginTop: 16 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ultimaVez: { fontSize: 14, color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
  rotulo: { fontSize: 16, color: cores.texto },
  botoes: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
