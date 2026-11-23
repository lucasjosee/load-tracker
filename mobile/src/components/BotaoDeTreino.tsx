import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { TemposDaSessao } from '@/domain/duracao';

import { useTempoDoTreino } from './TempoDoTreino';
import { aurora, cores } from './tema';

// Espaço que a barra de abas do iOS ocupa acima da área segura de baixo. A
// NativeTabs não informa a própria altura, então é uma medida fixa.
const ALTURA_DA_BARRA_DE_ABAS = 60;
const ALTURA_DO_BOTAO = 62;
const CIRCULO = 46;

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

// A ação principal da aba Hoje (§3.2): uma pílula branca presa no rodapé,
// acima da barra de abas, que não acompanha a rolagem. Assim está sempre a um
// toque, por mais longa que seja a lista de exercícios. O círculo da aurora
// com o "play" diz o que o botão faz antes de a pessoa ler o texto.
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
        <View style={styles.circulo}>
          {/* Um triângulo de cantos redondos, um pouco à direita do centro:
              é assim que o "play" parece centralizado a olho. */}
          <Svg width={16} height={16} viewBox="0 0 16 16" style={styles.play}>
            <Path d="M4 2.5v11a1 1 0 0 0 1.5.86l9-5.5a1 1 0 0 0 0-1.72l-9-5.5A1 1 0 0 0 4 2.5z" fill="#FFFFFF" />
          </Svg>
        </View>
        <View style={styles.textos}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.detalhe} numberOfLines={1}>
            {detalhe}
          </Text>
        </View>
        {sessao !== null && <Tempo sessao={sessao} />}
      </Pressable>
    </View>
  );
}

// Separado para o relógio só existir quando há treino em andamento.
function Tempo({ sessao }: { sessao: TemposDaSessao }) {
  return <Text style={styles.tempo}>{useTempoDoTreino(sessao)}</Text>;
}

const styles = StyleSheet.create({
  faixa: { position: 'absolute', left: 20, right: 20 },
  botao: {
    height: ALTURA_DO_BOTAO,
    borderRadius: ALTURA_DO_BOTAO / 2,
    paddingLeft: (ALTURA_DO_BOTAO - CIRCULO) / 2, // o círculo fica à mesma distância da borda em cima, embaixo e à esquerda
    paddingRight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    // A sombra larga descola o botão da lista que passa por baixo dele.
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.35)',
  },
  apertado: { backgroundColor: '#D9E0EC' },
  circulo: {
    width: CIRCULO,
    height: CIRCULO,
    borderRadius: CIRCULO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.fim, // por baixo do gradiente, se ele não for desenhado
    backgroundImage: `linear-gradient(135deg, ${aurora.inicio} 0%, ${aurora.fim} 100%)`,
  },
  play: { marginLeft: 2 },
  textos: { flex: 1, gap: 1 },
  titulo: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, color: cores.textoSobrePrimaria },
  detalhe: { fontSize: 13, fontWeight: '500', color: cores.textoSobrePrimaria, opacity: 0.62, fontVariant: ['tabular-nums'] },
  tempo: { fontSize: 17, fontWeight: '700', color: cores.textoSobrePrimaria, fontVariant: ['tabular-nums'] },
});
