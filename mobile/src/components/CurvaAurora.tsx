import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { paraCurvaSuave, type Ponto } from './escala';
import { aurora, cores } from './tema';

interface Props {
  pontos: readonly Ponto[]; // já em coordenadas da tela (escalarPontos)
  largura: number;
  altura: number;
  // Uma bolinha em cada sessão, para gráficos em que cada ponto importa (o
  // detalhe do exercício). Sem isto, só a última sessão é marcada.
  marcarSessoes?: boolean;
}

// A linha dos gráficos de força: uma curva suave pelos pontos, no gradiente
// aurora, com a área embaixo dela se apagando até a base, e um ponto branco
// com halo na última sessão.
export function CurvaAurora({ pontos, largura, altura, marcarSessoes = false }: Props) {
  // Cada gráfico precisa dos próprios ids de gradiente. O `useId` do React dá
  // um id único por componente; os sinais que ele usa não valem num id do SVG.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  if (primeiro === undefined || ultimo === undefined) {
    return null;
  }
  const curva = paraCurvaSuave(pontos);
  // A área é a própria curva, fechada até a base do gráfico.
  const area = `${curva} L${ultimo.x} ${altura} L${primeiro.x} ${altura} Z`;

  return (
    <Svg width={largura} height={altura}>
      <Defs>
        {/* Em coordenadas da tela (`userSpaceOnUse`), e não da caixa da
            linha: com todos os valores iguais a linha é reta, a caixa dela
            não tem altura e um gradiente medido por ela não seria desenhado. */}
        <LinearGradient id={`linha${id}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={largura} y2={0}>
          <Stop offset="0" stopColor={aurora.inicio} />
          <Stop offset="1" stopColor={aurora.fim} />
        </LinearGradient>
        <LinearGradient id={`area${id}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={altura}>
          <Stop offset="0" stopColor={aurora.fim} stopOpacity={0.32} />
          <Stop offset="1" stopColor={aurora.fim} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill={`url(#area${id})`} />
      <Path d={curva} fill="none" stroke={`url(#linha${id})`} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {marcarSessoes &&
        pontos.slice(0, -1).map((ponto, indice) => <Circle key={indice} cx={ponto.x} cy={ponto.y} r={2.5} fill={cores.texto} />)}
      <Circle cx={ultimo.x} cy={ultimo.y} r={9} fill={aurora.fim} opacity={0.25} />
      <Circle cx={ultimo.x} cy={ultimo.y} r={4.5} fill="#FFFFFF" />
    </Svg>
  );
}
