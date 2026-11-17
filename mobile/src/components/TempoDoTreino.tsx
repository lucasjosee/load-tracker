import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatarCronometro, segundosDeTreino, type TemposDaSessao } from '@/domain/duracao';

import { cores } from './tema';

// O tempo de treino, atualizado a cada segundo (§3.2). A conta é sempre feita
// a partir dos instantes gravados na sessão, e não de um contador da tela:
// fechar a tela, ou o app ir para segundo plano, não zera nem atrasa o tempo.
export function useTempoDoTreino(sessao: TemposDaSessao): string {
  const [agora, setAgora] = useState(() => Date.now());
  const parado = sessao.pausadaEm !== null || sessao.finalizadaEm !== null;

  useEffect(() => {
    if (parado) {
      return; // pausado ou encerrado: o tempo não anda, não precisa de relógio
    }
    const tique = () => setAgora(Date.now());
    // O primeiro tique vem na hora: depois de uma pausa o `agora` guardado
    // está velho, e esperar um segundo mostraria um tempo errado.
    const primeiro = setTimeout(tique, 0);
    const relogio = setInterval(tique, 1000);
    // Sem a limpeza o relógio continuaria depois de a tela sair.
    return () => {
      clearTimeout(primeiro);
      clearInterval(relogio);
    };
  }, [parado]);

  // Com o relógio parado, `agora` fica velho. Não importa: nesse caso
  // segundosDeTreino usa o instante da pausa ou do fim.
  return formatarCronometro(segundosDeTreino(sessao, agora));
}

export function TempoDoTreino({ sessao }: { sessao: TemposDaSessao }) {
  const tempo = useTempoDoTreino(sessao);
  const pausado = sessao.pausadaEm !== null;
  return (
    <View style={styles.linha} accessible accessibilityRole="timer" accessibilityLabel={`Tempo de treino: ${tempo}${pausado ? ', pausado' : ''}`}>
      <Text style={[styles.tempo, pausado && styles.tempoPausado]}>{tempo}</Text>
      <Text style={styles.rotulo}>{pausado ? 'pausado' : 'de treino'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  // Algarismos de largura fixa: o texto não treme a cada segundo.
  tempo: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: cores.texto, fontVariant: ['tabular-nums'] },
  tempoPausado: { color: cores.desce },
  rotulo: { fontSize: 14, color: cores.textoSecundario },
});
