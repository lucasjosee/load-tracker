import { StyleSheet, Text } from 'react-native';

import type { DirecaoDoSelo, Selo as DadosDoSelo } from '@/domain/textos';

import { cores } from './tema';

const COR: Record<DirecaoDoSelo, string> = {
  sobe: cores.sobe,
  desce: cores.desce,
  mantem: cores.mantem,
  inicio: cores.primaria,
};

// O selo de mudança do cartão: "↑ +1 rep", "↓ deload", "= mantém".
export function Selo({ selo }: { selo: DadosDoSelo }) {
  return (
    <Text style={[styles.selo, { color: COR[selo.direcao], borderColor: COR[selo.direcao] }]}>{selo.texto}</Text>
  );
}

const styles = StyleSheet.create({
  selo: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
