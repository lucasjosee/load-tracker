import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatarCronometro, segundosDeTreino } from '@/domain/duracao';

import { cores } from './tema';

// Há quanto tempo o treino começou (§3.2). Conta a partir do instante gravado
// na sessão, e não de um contador da tela: fechar a tela, ou o app ir para
// segundo plano, não zera nem atrasa o tempo.
export function TempoDoTreino({ iniciadaEm }: { iniciadaEm: string }) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(relogio); // sem isto o relógio continuaria depois de a tela sair
  }, []);

  const tempo = formatarCronometro(segundosDeTreino(iniciadaEm, agora));
  return (
    <View style={styles.linha} accessible accessibilityRole="timer" accessibilityLabel={`Tempo de treino: ${tempo}`}>
      <Text style={styles.tempo}>{tempo}</Text>
      <Text style={styles.rotulo}>de treino</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  // Algarismos de largura fixa: o texto não treme a cada segundo.
  tempo: { fontSize: 22, fontWeight: '700', color: cores.texto, fontVariant: ['tabular-nums'] },
  rotulo: { fontSize: 14, color: cores.textoSecundario },
});
