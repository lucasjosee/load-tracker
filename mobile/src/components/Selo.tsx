import { StyleSheet, Text } from 'react-native';

import type { DirecaoDoSelo, Selo as DadosDoSelo } from '@/domain/textos';

import { cores } from './tema';

// Uma pílula com a cor da direção no texto e a mesma cor, bem apagada, no
// fundo: hortelã para subir, âmbar para recuar, cinza para manter.
const COR: Record<DirecaoDoSelo, { fundo: string; texto: string }> = {
  sobe: { fundo: cores.sobeFundo, texto: cores.sobe },
  desce: { fundo: cores.desceFundo, texto: cores.desce },
  mantem: { fundo: cores.divisoria, texto: cores.mantem },
  inicio: { fundo: cores.divisoria, texto: cores.texto },
};

// O selo de mudança do cartão: "↑ +1 rep", "↓ deload", "= mantém".
export function Selo({ selo }: { selo: DadosDoSelo }) {
  return (
    <Text style={[styles.selo, { color: COR[selo.direcao].texto, backgroundColor: COR[selo.direcao].fundo }]}>
      {selo.texto}
    </Text>
  );
}

const styles = StyleSheet.create({
  selo: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    overflow: 'hidden', // sem isto o iOS não arredonda o fundo de um Text
  },
});
