import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DIAS_A_PARTIR_DE_SEGUNDA, LETRAS_DOS_DIAS } from '@/domain/datas';
import { textoDoResumoDoRascunho, textoDoTreinoNoResumo, type ResumoDoRascunho } from '@/domain/onboarding';

import { cores, relevo } from './tema';
import { Texto } from './Texto';

// O que a conversa do onboarding já montou, fixo no topo da tela: a semana
// (um círculo por dia, aceso quando o dia já tem treino) e uma linha de
// resumo. Tocar abre a lista dos treinos. Fica fechado por padrão porque,
// com o teclado aberto, sobra pouca tela para a conversa.
export function RascunhoAoVivo({ resumo }: { resumo: ResumoDoRascunho }) {
  const [aberto, setAberto] = useState(false);
  const temTreinos = resumo.treinos.length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: aberto }}
      accessibilityLabel={`Sua divisão até agora: ${textoDoResumoDoRascunho(resumo)}`}
      disabled={!temTreinos}
      onPress={() => setAberto(!aberto)}
      style={styles.painel}
    >
      <View style={styles.semana}>
        {DIAS_A_PARTIR_DE_SEGUNDA.map((dia) => {
          const comTreino = resumo.diasComTreino.includes(dia);
          return (
            <View key={dia} style={[styles.dia, comTreino && styles.diaComTreino]}>
              <Texto style={[styles.letra, comTreino && styles.letraComTreino]}>{LETRAS_DOS_DIAS[dia]}</Texto>
            </View>
          );
        })}
      </View>
      <View style={styles.linhaDoResumo}>
        <Texto style={styles.resumo}>{textoDoResumoDoRascunho(resumo)}</Texto>
        {temTreinos && <Texto style={styles.seta}>{aberto ? '▲' : '▼'}</Texto>}
      </View>
      {aberto &&
        resumo.treinos.map((treino, indice) => (
          <View key={indice} style={styles.treino}>
            <Texto style={styles.nomeDoTreino}>{treino.nome}</Texto>
            <Texto style={styles.detalheDoTreino}>{textoDoTreinoNoResumo(treino)}</Texto>
          </View>
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  painel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: cores.superficie,
    // Em relevo, e não com uma linha embaixo: a conversa passa por baixo dele.
    boxShadow: relevo.painel,
  },
  semana: { flexDirection: 'row', justifyContent: 'space-between' },
  dia: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficieAlta,
  },
  diaComTreino: { backgroundColor: cores.primaria },
  letra: { fontSize: 13, fontWeight: '700', color: cores.textoSecundario },
  letraComTreino: { color: cores.textoSobrePrimaria },
  linhaDoResumo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resumo: { fontSize: 14, color: cores.textoSecundario, flexShrink: 1, fontVariant: ['tabular-nums'] },
  seta: { fontSize: 10, color: cores.textoSecundario },
  treino: { gap: 1 },
  nomeDoTreino: { fontSize: 15, fontWeight: '600', color: cores.texto },
  detalheDoTreino: { fontSize: 13, color: cores.textoSecundario },
});
