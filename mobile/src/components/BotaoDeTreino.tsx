import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TemposDaSessao } from '@/domain/duracao';

import { Recartilhado } from './Recartilhado';
import { useTempoDoTreino } from './TempoDoTreino';
import { cromo, raio } from './tema';
import { Texto } from './Texto';

// Espaço que a barra de abas do iOS ocupa acima da área segura de baixo. A
// NativeTabs não informa a própria altura, então é uma medida fixa.
const ALTURA_DA_BARRA_DE_ABAS = 60;
const ALTURA_DO_BOTAO = 64;
const RAIO = raio + 2; // um pouco mais que o dos botões comuns, por ser maior

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
        {/* Mais estreito que no Botao: aqui o texto e o tempo dividem a linha. */}
        <Recartilhado raio={RAIO} largura="13%" />
        <View style={styles.textos}>
          <Texto style={styles.titulo}>{titulo}</Texto>
          <Texto style={styles.detalhe} numberOfLines={1}>
            {detalhe}
          </Texto>
        </View>
        {sessao === null ? <Texto style={styles.seta}>▶</Texto> : <Tempo sessao={sessao} />}
      </Pressable>
    </View>
  );
}

// Separado para o relógio só existir quando há treino em andamento.
function Tempo({ sessao }: { sessao: TemposDaSessao }) {
  return <Texto style={styles.tempo}>{useTempoDoTreino(sessao)}</Texto>;
}

const styles = StyleSheet.create({
  faixa: { position: 'absolute', left: 16, right: 16 },
  botao: {
    height: ALTURA_DO_BOTAO,
    borderRadius: RAIO,
    // O texto começa depois do recartilhado (13% de cada lado).
    paddingHorizontal: '16%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: cromo.cor,
    backgroundImage: cromo.fundo,
    // A sombra larga descola o botão da lista que passa por baixo dele.
    boxShadow: `${cromo.sombra}, 0 10px 24px rgba(0, 0, 0, 0.45)`,
  },
  apertado: { backgroundImage: cromo.apertado },
  textos: { flexShrink: 1, gap: 1 },
  titulo: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2, color: cromo.texto },
  detalhe: { fontSize: 13, fontWeight: '600', color: cromo.texto, opacity: 0.75, fontVariant: ['tabular-nums'] },
  seta: { fontSize: 18, color: cromo.texto },
  tempo: { fontSize: 20, fontWeight: '800', color: cromo.texto, fontVariant: ['tabular-nums'] },
});
