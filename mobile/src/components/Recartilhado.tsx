import { useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { cromo } from './tema';

// Distância entre as linhas da malha, em pontos.
const PASSO = 5;

interface Props {
  // O raio dos cantos do botão: cada faixa arredonda os seus dois cantos de
  // fora, para a malha não vazar do botão.
  raio: number;
  // Quanto da largura do botão cada ponta ocupa, em porcentagem.
  largura: `${number}%`;
}

// O recartilhado da barra: a malha de losangos gravada no aço, onde a mão
// segura. Vai nas duas pontas do botão principal, e só nele: a textura diz
// "é aqui que se pega".
//
// Fica por baixo do texto do botão (vem antes dele no JSX) e não recebe
// toques (`pointerEvents: 'none'`): o toque continua sendo do botão.
export function Recartilhado({ raio, largura }: Props) {
  return (
    <>
      <Faixa style={{ left: 0, width: largura, borderTopLeftRadius: raio, borderBottomLeftRadius: raio }} />
      <Faixa style={{ right: 0, width: largura, borderTopRightRadius: raio, borderBottomRightRadius: raio }} />
    </>
  );
}

function Faixa({ style }: { style: ViewStyle }) {
  // O padrão é achado pelo id (`url(#id)`), e o id precisa ser único na tela:
  // com dois botões cromados, são quatro padrões. O `useId` do React gera um
  // id único, mas com sinais (`:r1:`) que atrapalham dentro do `url(...)`.
  const id = `recartilhado${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[styles.faixa, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          {/* Um ladrilho de 5×5 com as duas diagonais; repetido, vira a malha. */}
          <Pattern id={id} width={PASSO} height={PASSO} patternUnits="userSpaceOnUse">
            <Path d={`M0 0L${PASSO} ${PASSO}M${PASSO} 0L0 ${PASSO}`} stroke={cromo.sulco} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // `overflow: 'hidden'` aqui, e não no botão: no botão, cortaria também a
  // sombra que fica por fora dele.
  faixa: { position: 'absolute', top: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' },
});
