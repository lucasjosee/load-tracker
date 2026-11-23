import { StyleSheet, Text, View } from 'react-native';

import type { PontoDaRegua, Regua } from '@/domain/regua';
import { formatarKg } from '@/domain/textos';

import { cores, gradienteAurora } from './tema';

interface Props {
  regua: Regua;
  // Depois de um deload a régua fica na cor de recuo (`desce`): recomeçar do
  // início da faixa ali é recuo, não progresso.
  recuo?: boolean;
}

// Medidas da régua, em pontos. Cada número de reps é uma coluna da largura do
// ponto luminoso; o trilho vai do meio da primeira coluna ao meio da última.
const COLUNA = 20;
const TRILHO = 6;
const PONTO = 20;

// A faixa de reps como um trilho fino: o trecho até a meta de hoje fica
// aceso (a aurora) e a meta tem um ponto branco que brilha. Embaixo, os
// números; no fim, a carga que vem depois do topo da faixa.
export function ReguaDeReps({ regua, recuo = false }: Props) {
  const { pontos } = regua;
  const indiceDaMeta = pontos.findIndex((ponto) => ponto.situacao === 'alvo');
  const metaDeHoje = pontos[indiceDaMeta]?.reps;
  // Onde fica a meta no trilho, de 0 (primeira marca) a 100% (última).
  const posicao = pontos.length > 1 && indiceDaMeta >= 0 ? (indiceDaMeta / (pontos.length - 1)) * 100 : 0;

  return (
    <View
      style={styles.linha}
      accessible
      accessibilityLabel={`Meta de hoje: ${metaDeHoje} reps. Em ${pontos[pontos.length - 1]?.reps} reps a carga sobe para ${formatarKg(regua.proximaCargaKg)} kg.`}
    >
      <View style={styles.escala}>
        <View style={styles.trilho}>
          {posicao > 0 && <View style={[styles.aceso, recuo && styles.acesoRecuo, { width: `${posicao}%` }]} />}
          {indiceDaMeta >= 0 && <View style={[styles.ponto, recuo && styles.pontoRecuo, { left: `${posicao}%` }]} />}
        </View>
        <View style={styles.numeros}>
          {pontos.map((ponto) => (
            <Text key={ponto.reps} style={[styles.numero, estiloDoNumero(ponto)]}>
              {ponto.reps}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.depois}>
        <Text style={styles.rotuloDepois}>depois</Text>
        <Text style={styles.cargaDepois}>{formatarKg(regua.proximaCargaKg)} kg</Text>
      </View>
    </View>
  );
}

function estiloDoNumero({ situacao }: PontoDaRegua) {
  switch (situacao) {
    case 'feito':
      return styles.numeroFeito;
    case 'alvo':
      return styles.numeroDaMeta;
    case 'falta':
      return styles.numeroQueFalta;
  }
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  escala: { flex: 1, paddingTop: (PONTO - TRILHO) / 2 },
  trilho: {
    marginHorizontal: COLUNA / 2,
    height: TRILHO,
    borderRadius: TRILHO / 2,
    backgroundColor: cores.superficieAlta,
  },
  aceso: { height: TRILHO, borderRadius: TRILHO / 2, backgroundColor: cores.primaria, backgroundImage: gradienteAurora },
  acesoRecuo: { backgroundColor: cores.desce, backgroundImage: 'none' },
  // O ponto fica centrado na meta: `left` em porcentagem põe a borda
  // esquerda dele lá, e a margem negativa puxa metade da largura de volta.
  // O brilho são duas sombras: um anel índigo colado e um halo ciano largo.
  ponto: {
    position: 'absolute',
    top: (TRILHO - PONTO) / 2,
    width: PONTO,
    height: PONTO,
    marginLeft: -PONTO / 2,
    borderRadius: PONTO / 2,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 0 5px rgba(123, 140, 255, 0.3), 0 0 18px rgba(92, 225, 230, 0.7)',
  },
  pontoRecuo: { boxShadow: '0 0 0 5px rgba(255, 196, 107, 0.3), 0 0 18px rgba(255, 196, 107, 0.6)' },
  numeros: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  numero: { width: COLUNA, textAlign: 'center', fontSize: 14, fontVariant: ['tabular-nums'] },
  numeroFeito: { fontWeight: '600', color: cores.textoSecundario },
  numeroDaMeta: { fontWeight: '800', color: cores.texto },
  numeroQueFalta: { fontWeight: '400', color: cores.textoSecundario, opacity: 0.75 },
  depois: { alignItems: 'flex-end' },
  rotuloDepois: { fontSize: 13, color: cores.textoSecundario },
  cargaDepois: { fontSize: 17, fontWeight: '700', color: cores.texto, fontVariant: ['tabular-nums'] },
});
