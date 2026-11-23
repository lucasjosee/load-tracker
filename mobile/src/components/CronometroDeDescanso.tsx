import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { formatarDescanso, restanteDoDescanso } from '@/domain/descanso';

import { aurora, cores } from './tema';
import { Vidro } from './Vidro';

interface Props {
  duracaoS: number; // configurada na aba Divisão
}

// Descanso entre séries, numa pílula de vidro: um toque começa a contagem,
// outro para, e o iPhone vibra quando ela termina.
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

  const contando = terminaEm !== null;
  const restante = contando ? restanteDoDescanso(terminaEm, agora) : duracaoS;
  // O anel mostra quanto falta: cheio parado, esvaziando enquanto conta.
  const fracao = contando && duracaoS > 0 ? restante / duracaoS : 1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={contando ? 'Para a contagem' : 'Começa a contagem do descanso'}
      onPress={contando ? () => setTerminaEm(null) : comecar}
      style={styles.toque}
    >
      {({ pressed }) => (
        <Vidro apertado={pressed} style={styles.pilula}>
          <Anel fracao={fracao} acabou={acabou} />
          <Text style={[styles.rotulo, acabou && styles.acabou]}>{acabou ? 'Descanso acabou' : 'Descanso'}</Text>
          {/* Acabado, o lado direito diz o que o toque faz agora. */}
          {!acabou ? (
            <Text style={styles.contagem} accessibilityLiveRegion={contando ? 'polite' : 'none'}>
              {formatarDescanso(restante)}
            </Text>
          ) : (
            <Text style={styles.deNovo}>De novo</Text>
          )}
        </Vidro>
      )}
    </Pressable>
  );
}

const RAIO_DO_ANEL = 11;
const VOLTA = 2 * Math.PI * RAIO_DO_ANEL;

// O anel do descanso: um trilho apagado e, por cima, o arco da aurora. O arco
// é o mesmo círculo com o traço tracejado: um traço do tamanho da parte que
// falta e um vão do tamanho da volta inteira.
function Anel({ fracao, acabou }: { fracao: number; acabou: boolean }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id="auroraDoDescanso" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={aurora.inicio} />
          <Stop offset="1" stopColor={aurora.fim} />
        </LinearGradient>
      </Defs>
      <Circle cx={15} cy={15} r={RAIO_DO_ANEL} fill="none" stroke={cores.superficieAlta} strokeWidth={3.5} />
      {fracao > 0 && (
        <Circle
          cx={15}
          cy={15}
          r={RAIO_DO_ANEL}
          fill="none"
          stroke={acabou ? cores.sobe : 'url(#auroraDoDescanso)'}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={`${VOLTA * fracao} ${VOLTA}`}
          // O traço começa às 3 horas; girar -90° leva o começo para o topo.
          transform="rotate(-90 15 15)"
        />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  toque: { marginTop: 12 },
  pilula: { height: 52, borderRadius: 26, paddingLeft: 12, paddingRight: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rotulo: { flex: 1, fontSize: 16, fontWeight: '600', color: cores.texto },
  acabou: { color: cores.sobe },
  contagem: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: cores.texto, fontVariant: ['tabular-nums'] },
  deNovo: { fontSize: 15, fontWeight: '600', color: cores.textoSecundario },
});
