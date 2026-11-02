import { Pressable, StyleSheet, Text, View } from 'react-native';

import { arredondarKg } from '@/domain/progressao';

import { cores } from './tema';

interface Props {
  valor: number;
  onMudar: (valor: number) => void;
  passo?: number;
  minimo?: number;
  maximo?: number;
  formatar?: (valor: number) => string;
  rotulo?: string; // lido pelo VoiceOver
}

// Botões − e + em volta de um número, para ajustar sem abrir o teclado.
export function Stepper({
  valor,
  onMudar,
  passo = 1,
  minimo = 0,
  maximo = Number.POSITIVE_INFINITY,
  formatar = String,
  rotulo,
}: Props) {
  // arredondarKg: passos como 2,5 kg somados várias vezes não acumulam resto.
  const mudar = (delta: number) => onMudar(arredondarKg(Math.min(maximo, Math.max(minimo, valor + delta))));

  return (
    <View style={styles.linha} accessibilityLabel={rotulo}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Diminuir ${rotulo ?? ''}`}
        disabled={valor <= minimo}
        onPress={() => mudar(-passo)}
        style={({ pressed }) => [styles.botao, (pressed || valor <= minimo) && styles.apagado]}
      >
        <Text style={styles.sinal}>−</Text>
      </Pressable>
      <Text style={styles.valor}>{formatar(valor)}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${rotulo ?? ''}`}
        disabled={valor >= maximo}
        onPress={() => mudar(passo)}
        style={({ pressed }) => [styles.botao, (pressed || valor >= maximo) && styles.apagado]}
      >
        <Text style={styles.sinal}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apagado: { opacity: 0.4 },
  sinal: { fontSize: 22, color: cores.primaria, fontWeight: '600' },
  valor: { minWidth: 56, textAlign: 'center', fontSize: 17, fontVariant: ['tabular-nums'] },
});
