import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';

import { formatarDiaMes } from '@/domain/datas';
import type { PontoDeEvolucao } from '@/domain/metricas';
import { formatarPercentual } from '@/domain/textos';

import { escalarPontos, paraPolyline } from './escala';
import { estilosComuns } from './Tela';
import { cores } from './tema';

const ALTURA_COMPACTA = 52;
const ALTURA_GRANDE = 130;
const MARGEM = 5;

interface Props {
  rotulo: string; // "Força no Push", "Força geral"
  periodo: string; // "em 11 sessões"
  pontos: readonly PontoDeEvolucao[]; // em ordem cronológica
  // Compacto (padrão): número à esquerda e linha à direita, para caber acima
  // dos cartões no dia de treino. Grande: a linha embaixo, com as datas, para
  // o dia de descanso, em que há tela sobrando.
  grande?: boolean;
}

// A evolução da força contra o começo (§7): o percentual em destaque e a
// linha de como ele chegou ali.
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

  // A cor segue o número que a pessoa lê, já arredondado: "0%" nunca fica verde.
  const pontosPercentuais = Math.round(ultimo.variacao * 100);
  const cor = pontosPercentuais > 0 ? cores.sobe : pontosPercentuais < 0 ? cores.desce : cores.mantem;

  const numero = (
    <View
      accessible
      accessibilityLabel={`${rotulo}: ${formatarPercentual(ultimo.variacao)} desde o início, ${periodo}`}
    >
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={[styles.percentual, { color: cor }]}>{formatarPercentual(ultimo.variacao)}</Text>
      <Text style={styles.periodo}>desde o início · {periodo}</Text>
    </View>
  );
  const linha = (
    <Linha valores={pontos.map((ponto) => ponto.variacao)} altura={grande ? ALTURA_GRANDE : ALTURA_COMPACTA} cor={cor} />
  );

  if (!grande) {
    return (
      <View style={[estilosComuns.cartao, styles.cartao, styles.compacto]}>
        {numero}
        <View style={styles.linhaCompacta}>{linha}</View>
      </View>
    );
  }
  return (
    <View style={[estilosComuns.cartao, styles.cartao, styles.grande]}>
      {numero}
      {linha}
      <View style={styles.eixo}>
        <Text style={styles.periodo}>{formatarDiaMes(pontos[0]?.data ?? ultimo.data)}</Text>
        <Text style={styles.periodo}>{formatarDiaMes(ultimo.data)}</Text>
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

const styles = StyleSheet.create({
  cartao: { padding: 18 },
  compacto: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  linhaCompacta: { flex: 1 },
  grande: { gap: 14 },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.textoSecundario },
  percentual: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  periodo: { fontSize: 12, color: cores.textoSecundario },
  eixo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
});
