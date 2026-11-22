import { Fragment, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';

import { formatarDiaMes } from '@/domain/datas';
import type { PontoDeEvolucao } from '@/domain/metricas';
import { formatarPercentual } from '@/domain/textos';

import { escalarPontos, paraPolyline } from './escala';
import { estilosComuns } from './Tela';
import { cores, fonte } from './tema';
import { Texto } from './Texto';

const ALTURA_COMPACTA = 64;
const ALTURA_GRANDE = 130;
const MARGEM = 5;

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
        <Texto style={styles.rotulo}>{rotulo}</Texto>
        <Texto style={estilosComuns.textoSecundario}>O gráfico aparece a partir do segundo treino.</Texto>
      </View>
    );
  }

  // A cor segue o número que a pessoa lê, já arredondado: "0%" nunca fica na cor de subir.
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
          <Texto style={styles.rotulo}>{rotulo}</Texto>
          <Texto style={styles.periodo}>desde o início, {periodo}</Texto>
        </View>
        <Texto style={[styles.percentual, grande && styles.percentualGrande, { color: cor }]}>
          {formatarPercentual(ultimo.variacao)}
        </Texto>
      </View>
      <Linha valores={pontos.map((ponto) => ponto.variacao)} altura={grande ? ALTURA_GRANDE : ALTURA_COMPACTA} cor={cor} />
      <View style={styles.eixo}>
        <Texto style={styles.data}>{formatarDiaMes(pontos[0]?.data ?? ultimo.data)}</Texto>
        <Texto style={styles.data}>{formatarDiaMes(ultimo.data)}</Texto>
      </View>
    </View>
  );
}

function Linha({ valores, altura, cor }: { valores: readonly number[]; altura: number; cor: string }) {
  // A largura só é conhecida depois que a tela é desenhada (onLayout).
  const [largura, setLargura] = useState(0);
  const pontos = escalarPontos(valores, { largura, altura, margem: MARGEM });
  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];

  return (
    <View
      style={{ height: altura }}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {largura > 0 && primeiro !== undefined && ultimo !== undefined && (
        <Svg width={largura} height={altura}>
          {/* Três guias gravadas no painel (em cima, no meio e embaixo), como
              as marcas de uma escala: cada uma é um risco escuro com um
              filete de luz logo abaixo. */}
          {guias(altura).map((y) => (
            <Fragment key={y}>
              <Line x1={0} y1={y} x2={largura} y2={y} stroke={cores.sulco} strokeWidth={1} />
              <Line x1={0} y1={y + 1} x2={largura} y2={y + 1} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={1} />
            </Fragment>
          ))}
          {/* A área embaixo da linha, bem apagada: a linha fechada até a base. */}
          <Polygon
            points={`${paraPolyline(pontos)} ${ultimo.x},${altura} ${primeiro.x},${altura}`}
            fill={cor}
            opacity={0.12}
          />
          <Polyline points={paraPolyline(pontos)} fill="none" stroke={cor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={ultimo.x} cy={ultimo.y} r={4} fill={cor} />
        </Svg>
      )}
    </View>
  );
}

// As alturas das três guias: as bordas e o meio da área onde a linha corre.
function guias(altura: number): number[] {
  const meio = altura / 2;
  return [MARGEM, meio, altura - MARGEM].map(Math.round);
}

const styles = StyleSheet.create({
  cartao: { padding: 16, gap: 10 },
  topo: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  textos: { flexShrink: 1 },
  rotulo: { fontSize: 15, fontWeight: '700', color: cores.texto },
  periodo: { fontSize: 14, color: cores.textoSecundario },
  // Na Saira larga, como os outros números grandes, com a linha justa.
  percentual: {
    fontFamily: fonte.larga,
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  percentualGrande: { fontSize: 52, lineHeight: 54 },
  eixo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  data: { fontSize: 13, color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
});
