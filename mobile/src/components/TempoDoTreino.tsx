import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatarCronometro, segundosDeTreino, type TemposDaSessao } from '@/domain/duracao';

import { cores } from './tema';
import { Vidro } from './Vidro';

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

interface Props {
  sessao: TemposDaSessao;
  onPausar: (() => void) | null; // null = sem botão de pausar (já pausado)
}

// O tempo de treino numa pílula de vidro, com o botão redondo de pausar
// colado nele: os dois falam do mesmo relógio.
export function TempoDoTreino({ sessao, onPausar }: Props) {
  const tempo = useTempoDoTreino(sessao);
  const pausado = sessao.pausadaEm !== null;
  return (
    <Vidro style={[styles.pilula, onPausar !== null && styles.pilulaComBotao]}>
      <Text
        accessibilityRole="timer"
        accessibilityLabel={`Tempo de treino: ${tempo}${pausado ? ', pausado' : ''}`}
        style={[styles.tempo, pausado && styles.tempoPausado]}
      >
        {tempo}
        {pausado && <Text style={styles.rotulo}> pausado</Text>}
      </Text>
      {onPausar !== null && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pausar o treino"
          onPress={onPausar}
          hitSlop={6}
          style={({ pressed }) => [styles.pausar, pressed && styles.pausarApertado]}
        >
          {/* As duas barras do símbolo de pausa. */}
          <View style={styles.barra} />
          <View style={styles.barra} />
        </Pressable>
      )}
    </Vidro>
  );
}

const styles = StyleSheet.create({
  pilula: { height: 40, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pilulaComBotao: { paddingRight: 4 },
  // Algarismos de largura fixa: o texto não treme a cada segundo.
  tempo: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, color: cores.texto, fontVariant: ['tabular-nums'] },
  tempoPausado: { color: cores.desce },
  rotulo: { fontSize: 14, fontWeight: '500', letterSpacing: 0 },
  pausar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: cores.superficieAlta,
  },
  pausarApertado: { backgroundColor: cores.borda },
  barra: { width: 3, height: 11, borderRadius: 1, backgroundColor: cores.texto },
});
