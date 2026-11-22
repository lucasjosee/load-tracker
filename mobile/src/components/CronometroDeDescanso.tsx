import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatarDescanso, restanteDoDescanso } from '@/domain/descanso';

import { cores } from './tema';
import { Texto } from './Texto';

interface Props {
  duracaoS: number; // configurada na aba Divisão
}

// Descanso entre séries: um toque começa a contagem, e o iPhone vibra quando
// ela termina. Fica numa linha discreta do cartão; só cresce enquanto conta.
//
// Só funciona com o app aberto. Se ele for para segundo plano, a contagem
// continua certa (ver restanteDoDescanso), mas a vibração só vem ao voltar:
// avisar com o app fechado exigiria agendar notificação, e isso é só pelo
// reagendarNotificacoes() (regra 8).
export function CronometroDeDescanso({ duracaoS }: Props) {
  // Instante (Date.now()) em que o descanso termina; null = parado.
  const [terminaEm, setTerminaEm] = useState<number | null>(null);
  const [agora, setAgora] = useState(0);
  const [acabou, setAcabou] = useState(false);

  useEffect(() => {
    if (terminaEm === null) {
      return;
    }
    // 4 vezes por segundo: a tela nunca fica mais de 250 ms atrasada, mesmo
    // que um tique do relógio do JavaScript atrase.
    const relogio = setInterval(() => {
      const instante = Date.now();
      if (instante >= terminaEm) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTerminaEm(null);
        setAcabou(true);
      } else {
        setAgora(instante);
      }
    }, 250);
    // A função devolvida roda quando o descanso para ou o cartão sai da tela:
    // sem ela o relógio continuaria rodando para sempre.
    return () => clearInterval(relogio);
  }, [terminaEm]);

  function comecar() {
    const instante = Date.now();
    setAcabou(false);
    setAgora(instante);
    setTerminaEm(instante + duracaoS * 1000);
  }

  if (terminaEm !== null) {
    return (
      <View style={styles.linha}>
        <Texto style={styles.rotulo}>Descanso</Texto>
        <Texto style={styles.contagem} accessibilityLiveRegion="polite">
          {formatarDescanso(restanteDoDescanso(terminaEm, agora))}
        </Texto>
        <Pressable accessibilityRole="button" onPress={() => setTerminaEm(null)} hitSlop={8} style={styles.acao}>
          <Texto style={styles.textoDaAcao}>Parar</Texto>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable accessibilityRole="button" onPress={comecar} hitSlop={6} style={styles.linha}>
      <Texto style={[styles.rotulo, acabou && styles.acabou]}>
        {acabou ? 'Descanso acabou' : `Descanso · ${formatarDescanso(duracaoS)}`}
      </Texto>
      <Texto style={styles.textoDaAcao}>{acabou ? 'De novo' : 'Começar'}</Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, minHeight: 32 },
  rotulo: { fontSize: 14, color: cores.textoSecundario },
  acabou: { color: cores.sobe, fontWeight: '700' },
  contagem: { flex: 1, fontSize: 24, fontWeight: '800', color: cores.primaria, fontVariant: ['tabular-nums'] },
  acao: { paddingVertical: 6 },
  textoDaAcao: { fontSize: 14, fontWeight: '600', color: cores.texto },
});
