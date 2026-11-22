import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { escalarPontos, paraPolyline } from './escala';
import { cores, raioDoCartao, relevo } from './tema';
import { Texto } from './Texto';

const ALTURA = 140;
const MARGEM = 8;

interface Props {
  titulo: string;
  valores: readonly number[]; // em ordem cronológica
  rotulos: readonly string[]; // um por valor, ex.: '12/11'
  formatar: (valor: number) => string;
}

// Gráfico de linha simples em SVG: uma bolinha por sessão. Feito à mão em
// vez de uma biblioteca de gráficos: é pouco código e roda no Expo Go.
export function GraficoDeLinha({ titulo, valores, rotulos, formatar }: Props) {
  // A largura só é conhecida depois que a tela é desenhada (onLayout).
  const [largura, setLargura] = useState(0);
  const pontos = escalarPontos(valores, { largura, altura: ALTURA, margem: MARGEM });
  const ultimo = valores[valores.length - 1];

  return (
    <View style={styles.caixa}>
      <View style={styles.topo}>
        <Texto style={styles.titulo}>{titulo}</Texto>
        {ultimo !== undefined && <Texto style={styles.atual}>{formatar(ultimo)}</Texto>}
      </View>
      {valores.length < 2 ? (
        <Texto style={styles.vazio}>O gráfico aparece a partir de duas sessões.</Texto>
      ) : (
        <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)} accessibilityLabel={`${titulo}: de ${formatar(valores[0] ?? 0)} para ${formatar(ultimo ?? 0)}`}>
          {largura > 0 && (
            <Svg width={largura} height={ALTURA}>
              <Polyline points={paraPolyline(pontos)} fill="none" stroke={cores.primaria} strokeWidth={2} />
              {pontos.map((ponto, i) => (
                <Circle key={i} cx={ponto.x} cy={ponto.y} r={3} fill={cores.primaria} />
              ))}
            </Svg>
          )}
          <View style={styles.eixo}>
            <Texto style={styles.rotulo}>{rotulos[0]}</Texto>
            <Texto style={styles.rotulo}>
              mín. {formatar(Math.min(...valores))} · máx. {formatar(Math.max(...valores))}
            </Texto>
            <Texto style={styles.rotulo}>{rotulos[rotulos.length - 1]}</Texto>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { gap: 6, padding: 16, borderRadius: raioDoCartao, backgroundColor: cores.superficie, boxShadow: relevo.painel },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  titulo: { fontSize: 15, fontWeight: '600', color: cores.textoSecundario },
  atual: { fontSize: 20, fontWeight: '700', color: cores.texto },
  vazio: { fontSize: 15, color: cores.textoSecundario },
  eixo: { flexDirection: 'row', justifyContent: 'space-between' },
  rotulo: { fontSize: 12, color: cores.textoSecundario },
});
