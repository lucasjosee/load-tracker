import Svg, { Circle, Polyline } from 'react-native-svg';

import { escalarPontos, paraPolyline } from './escala';
import { cores } from './tema';

const LARGURA = 72;
const ALTURA = 28;

// A linha da força estimada em miniatura, sem eixo nem número: serve só para
// ver a direção de relance numa lista. Cor de marca se a última sessão está
// acima da primeira; cinza se não.
export function MiniGrafico({ valores }: { valores: readonly number[] }) {
  if (valores.length < 2) {
    return null; // com uma sessão só não existe direção
  }
  const pontos = escalarPontos(valores, { largura: LARGURA, altura: ALTURA, margem: 3 });
  const ultimo = pontos[pontos.length - 1];
  const subiu = (valores[valores.length - 1] ?? 0) > (valores[0] ?? 0);
  const cor = subiu ? cores.sobe : cores.mantem;

  return (
    <Svg width={LARGURA} height={ALTURA} accessibilityElementsHidden importantForAccessibility="no">
      <Polyline points={paraPolyline(pontos)} fill="none" stroke={cor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {ultimo !== undefined && <Circle cx={ultimo.x} cy={ultimo.y} r={3} fill={cor} />}
    </Svg>
  );
}
