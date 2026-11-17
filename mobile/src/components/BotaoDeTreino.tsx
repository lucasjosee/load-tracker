import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TemposDaSessao } from '@/domain/duracao';

import { useTempoDoTreino } from './TempoDoTreino';
import { cores } from './tema';

// Espaço que a barra de abas do iOS ocupa acima da área segura de baixo. A
// NativeTabs não informa a própria altura, então é uma medida fixa.
const ALTURA_DA_BARRA_DE_ABAS = 60;
const ALTURA_DO_BOTAO = 64;

// Quanto a tela precisa deixar livre no fim da rolagem para o último item
// não ficar escondido atrás do botão.
export const FOLGA_DO_BOTAO_DE_TREINO = ALTURA_DO_BOTAO + 24;

interface Props {
  titulo: string; // "Iniciar treino", "Continuar treino", "Retomar treino"
  detalhe: string; // "6 exercícios · cerca de 55 min" ou "2 de 6 exercícios"
  // A sessão em andamento, para mostrar o tempo correndo; null = treino por iniciar.
  sessao: TemposDaSessao | null;
  onPress: () => void;
}

// A ação principal da aba Hoje (§3.2): fica presa no rodapé, acima da barra
// de abas, e não acompanha a rolagem. Assim está sempre a um toque, por mais
// longa que seja a lista de exercícios.
export function BotaoDeTreino({ titulo, detalhe, sessao, onPress }: Props) {
  const margens = useSafeAreaInsets();
  return (
    // `box-none`: a faixa em volta do botão não captura toques, só o botão.
    <View pointerEvents="box-none" style={[styles.faixa, { bottom: margens.bottom + ALTURA_DA_BARRA_DE_ABAS }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. ${detalhe}`}
        onPress={onPress}
        style={({ pressed }) => [styles.botao, pressed && styles.apertado]}
      >
        <View style={styles.textos}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.detalhe} numberOfLines={1}>
            {detalhe}
          </Text>
        </View>
        {sessao === null ? <Text style={styles.seta}>▶</Text> : <Tempo sessao={sessao} />}
      </Pressable>
    </View>
  );
}

// Separado para o relógio só existir quando há treino em andamento.
function Tempo({ sessao }: { sessao: TemposDaSessao }) {
  return <Text style={styles.tempo}>{useTempoDoTreino(sessao)}</Text>;
}

const styles = StyleSheet.create({
  faixa: { position: 'absolute', left: 16, right: 16 },
  botao: {
    height: ALTURA_DO_BOTAO,
    borderRadius: ALTURA_DO_BOTAO / 2,
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: cores.primaria,
    // A sombra descola o botão da lista que passa por baixo dele.
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  apertado: { opacity: 0.85 },
  textos: { flexShrink: 1, gap: 1 },
  titulo: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2, color: cores.textoSobrePrimaria },
  detalhe: { fontSize: 13, fontWeight: '600', color: cores.textoSobrePrimaria, opacity: 0.7, fontVariant: ['tabular-nums'] },
  seta: { fontSize: 18, color: cores.textoSobrePrimaria },
  tempo: { fontSize: 20, fontWeight: '800', color: cores.textoSobrePrimaria, fontVariant: ['tabular-nums'] },
});
