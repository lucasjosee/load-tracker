import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatarDiaMes } from '@/domain/datas';
import type { PontoDeEvolucao } from '@/domain/metricas';
import { formatarPercentual } from '@/domain/textos';

import { CurvaAurora } from './CurvaAurora';
import { escalarPontos } from './escala';
import { estilosComuns } from './Tela';
import { cores } from './tema';

const ALTURA_COMPACTA = 70;
const ALTURA_GRANDE = 130;
const MARGEM = 10; // cabe o halo do último ponto sem ele ser cortado na borda

interface Props {
  rotulo: string; // "Força no Push", "Força geral"
  periodo: string; // "em 11 sessões"
  pontos: readonly PontoDeEvolucao[]; // em ordem cronológica
  // Compacto (padrão): a linha baixa, para caber acima da lista no dia de
  // treino. Grande: a linha alta, para o dia de descanso, em que há tela
  // sobrando.
  grande?: boolean;
}

// A evolução da força contra o começo (§7): o percentual em destaque e a
// linha de como ele chegou ali, com as datas da primeira e da última sessão.
export function CartaoDeEvolucao({ rotulo, periodo, pontos, grande = false }: Props) {
  const ultimo = pontos[pontos.length - 1];
  if (ultimo === undefined || pontos.length < 2) {
    return (
      <View style={[estilosComuns.cartao, styles.cartao]}>
        <Text style={styles.rotulo}>{rotulo}</Text>
        <Text style={estilosComuns.textoSecundario}>O gráfico aparece a partir do segundo treino.</Text>
      </View>
    );
  }

  // A cor do percentual segue o número que a pessoa lê, já arredondado: "0%"
  // nunca fica na cor de subir. A linha fica sempre na aurora (a marca): a
  // direção já está no número e no desenho dela.
  const pontosPercentuais = Math.round(ultimo.variacao * 100);
  const cor = pontosPercentuais > 0 ? cores.sobe : pontosPercentuais < 0 ? cores.desce : cores.mantem;

  return (
    <View style={[estilosComuns.cartao, styles.cartao]}>
      {/* O que o número quer dizer à esquerda, o número à direita: lido de
          relance, o "+6%" vem primeiro; quem quer saber de quê, lê ao lado. */}
      <View
        style={styles.topo}
        accessible
        accessibilityLabel={`${rotulo}: ${formatarPercentual(ultimo.variacao)} desde o início, ${periodo}`}
      >
        <View style={styles.textos}>
          <Text style={styles.rotulo}>{rotulo}</Text>
          <Text style={styles.periodo}>desde o início, {periodo}</Text>
        </View>
        <Text style={[styles.percentual, grande && styles.percentualGrande, { color: cor }]}>
          {formatarPercentual(ultimo.variacao)}
        </Text>
      </View>
      <Linha valores={pontos.map((ponto) => ponto.variacao)} altura={grande ? ALTURA_GRANDE : ALTURA_COMPACTA} />
      <View style={styles.eixo}>
        <Text style={styles.data}>{formatarDiaMes(pontos[0]?.data ?? ultimo.data)}</Text>
        <Text style={styles.data}>{formatarDiaMes(ultimo.data)}</Text>
      </View>
    </View>
  );
}

function Linha({ valores, altura }: { valores: readonly number[]; altura: number }) {
  // A largura só é conhecida depois que a tela é desenhada (onLayout).
  const [largura, setLargura] = useState(0);
  const pontos = escalarPontos(valores, { largura, altura, margem: MARGEM });

  return (
    <View
      style={{ height: altura }}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {largura > 0 && <CurvaAurora pontos={pontos} largura={largura} altura={altura} />}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: 16, paddingBottom: 12, gap: 10 },
  topo: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  textos: { flexShrink: 1 },
  rotulo: { fontSize: 15, fontWeight: '600', color: cores.texto },
  periodo: { fontSize: 13, color: cores.textoSecundario },
  // Com a linha justa, como os outros números grandes.
  percentual: {
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  percentualGrande: { fontSize: 52, lineHeight: 54, letterSpacing: -2 },
  eixo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  data: { fontSize: 12, color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
});
