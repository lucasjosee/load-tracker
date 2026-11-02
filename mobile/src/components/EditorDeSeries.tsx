import { StyleSheet, Text, View } from 'react-native';

import { Botao } from './Botao';
import { Stepper } from './Stepper';

interface Props {
  reps: number[]; // uma posição por série
  onMudar: (reps: number[]) => void;
}

// Reps de cada série com steppers, e botões para tirar ou pôr uma série.
// Usado no "Ajustar" do check-in e na confirmação do registro rápido.
export function EditorDeSeries({ reps, onMudar }: Props) {
  const mudarSerie = (indice: number, valor: number) => onMudar(reps.map((r, i) => (i === indice ? valor : r)));

  return (
    <View style={styles.lista}>
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
          onPress={() => onMudar(reps.slice(0, -1))}
        />
        {/* A série nova copia a última: quase sempre é o mesmo número. */}
        <Botao titulo="+ Série" variante="secundario" compacto onPress={() => onMudar([...reps, reps[reps.length - 1] ?? 8])} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 8 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { fontSize: 16 },
  botoes: { flexDirection: 'row', gap: 8 },
});
