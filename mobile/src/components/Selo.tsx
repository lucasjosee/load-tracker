import { StyleSheet } from 'react-native';

import type { DirecaoDoSelo, Selo as DadosDoSelo } from '@/domain/textos';

import { cores } from './tema';
import { Texto } from './Texto';

// Selo preenchido: lê melhor de longe do que só o contorno. Só "sobe" usa a
// cor de marca cheia; os outros ficam discretos para ela se destacar.
const COR: Record<DirecaoDoSelo, { fundo: string; texto: string }> = {
  sobe: { fundo: cores.sobe, texto: cores.textoSobrePrimaria },
  desce: { fundo: cores.aviso, texto: cores.desce },
  mantem: { fundo: cores.superficieAlta, texto: cores.mantem },
  inicio: { fundo: cores.superficieAlta, texto: cores.texto },
};

// O selo de mudança do cartão: "↑ +1 rep", "↓ deload", "= mantém".
export function Selo({ selo }: { selo: DadosDoSelo }) {
  return (
    <Texto style={[styles.selo, { color: COR[selo.direcao].texto, backgroundColor: COR[selo.direcao].fundo }]}>
      {selo.texto}
    </Texto>
  );
}

const styles = StyleSheet.create({
  selo: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden', // sem isto o iOS não arredonda o fundo de um Text
  },
});
