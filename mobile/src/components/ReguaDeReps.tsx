import { StyleSheet, View } from 'react-native';

import type { PontoDaRegua, Regua } from '@/domain/regua';
import { formatarKg } from '@/domain/textos';

import { cores } from './tema';
import { Texto } from './Texto';

interface Props {
  regua: Regua;
  // Depois de um deload a régua fica na cor de recuo (`desce`): recomeçar do
  // início da faixa ali é recuo, não progresso.
  recuo?: boolean;
}

// Medidas da régua, em pontos. Cada número de reps é uma coluna da largura do
// número; o trilho passa pelo meio das marcas, de uma ponta à outra.
const COLUNA = 22;
const PONTEIRO = 10; // a altura do triângulo sobre a meta de hoje
const MARCAS = 22; // a faixa onde ficam as marcas
const TRILHO = 4;

// A faixa de reps como uma régua de medição gravada no aço: um trilho com uma
// marca por número de reps. O trecho até onde a pessoa já chegou fica
// preenchido; a meta de hoje tem o ponteiro; no fim, a carga que vem depois
// do topo da faixa.
export function ReguaDeReps({ regua, recuo = false }: Props) {
  const destaque = recuo ? cores.desce : cores.primaria;
  const { pontos } = regua;
  const metaDeHoje = pontos.find((ponto) => ponto.situacao === 'alvo')?.reps;
  // O preenchimento vai até a marca do último número já feito. A largura é
  // uma fração do trilho, que tem uma marca em cada ponta.
  const ultimoFeito = pontos.findLastIndex((ponto) => ponto.situacao === 'feito');
  const preenchido = pontos.length > 1 && ultimoFeito >= 0 ? (ultimoFeito / (pontos.length - 1)) * 100 : 0;

  return (
    <View
      style={styles.linha}
      accessible
      accessibilityLabel={`Meta de hoje: ${metaDeHoje} reps. Em ${pontos[pontos.length - 1]?.reps} reps a carga sobe para ${formatarKg(regua.proximaCargaKg)} kg.`}
    >
      <View style={styles.escala}>
        <View style={styles.trilho}>
          {preenchido > 0 && <View style={[styles.preenchido, { width: `${preenchido}%` }]} />}
        </View>
        <View style={styles.colunas}>
          {pontos.map((ponto) => (
            <Coluna key={ponto.reps} ponto={ponto} destaque={destaque} />
          ))}
        </View>
      </View>
      <View style={styles.depois}>
        <Texto style={styles.rotuloDepois}>depois</Texto>
        <Texto style={styles.cargaDepois}>{formatarKg(regua.proximaCargaKg)} kg</Texto>
      </View>
    </View>
  );
}

function Coluna({ ponto, destaque }: { ponto: PontoDaRegua; destaque: string }) {
  const alvo = ponto.situacao === 'alvo';
  return (
    <View style={styles.coluna}>
      <View style={styles.areaDoPonteiro}>{alvo && <View style={[styles.ponteiro, { borderTopColor: destaque }]} />}</View>
      <View style={styles.areaDasMarcas}>
        <View style={estiloDaMarca(ponto, destaque)} />
      </View>
      <Texto style={estiloDoNumero(ponto, destaque)}>{ponto.reps}</Texto>
    </View>
  );
}

function estiloDaMarca({ situacao }: PontoDaRegua, destaque: string) {
  switch (situacao) {
    case 'feito':
      return [styles.marca, { backgroundColor: cores.texto }];
    case 'alvo':
      return [styles.marcaDaMeta, { backgroundColor: destaque }];
    case 'falta':
      return [styles.marca, styles.marcaQueFalta];
  }
}

function estiloDoNumero({ situacao }: PontoDaRegua, destaque: string) {
  switch (situacao) {
    case 'feito':
      return [styles.numero, styles.numeroFeito];
    case 'alvo':
      return [styles.numero, styles.numeroDaMeta, { color: destaque }];
    case 'falta':
      return [styles.numero, styles.numeroQueFalta];
  }
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  escala: { flex: 1 },
  // Cavado no painel: escuro por dentro, com um filete de luz embaixo.
  trilho: {
    position: 'absolute',
    left: COLUNA / 2,
    right: COLUNA / 2,
    top: PONTEIRO + MARCAS / 2 - TRILHO / 2,
    height: TRILHO,
    borderRadius: TRILHO / 2,
    backgroundColor: cores.sulco,
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.06)',
  },
  preenchido: { height: TRILHO, borderRadius: TRILHO / 2, backgroundColor: cores.texto },
  colunas: { flexDirection: 'row', justifyContent: 'space-between' },
  coluna: { width: COLUNA, alignItems: 'center' },
  areaDoPonteiro: { height: PONTEIRO, justifyContent: 'flex-end' },
  // Um triângulo feito só de bordas: a de cima colorida, as dos lados
  // transparentes, numa caixa de tamanho zero.
  ponteiro: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: PONTEIRO,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  areaDasMarcas: { height: MARCAS, alignItems: 'center', justifyContent: 'center' },
  marca: { width: 2, height: 12 },
  marcaQueFalta: { backgroundColor: cores.textoSecundario, opacity: 0.55 },
  marcaDaMeta: { width: 4, height: MARCAS, borderRadius: 1 },
  numero: { fontSize: 15, fontVariant: ['tabular-nums'], marginTop: 2 },
  numeroFeito: { fontWeight: '700', color: cores.texto },
  numeroDaMeta: { fontWeight: '800' },
  numeroQueFalta: { fontWeight: '500', color: cores.textoSecundario },
  depois: { alignItems: 'flex-end' },
  rotuloDepois: { fontSize: 13, color: cores.textoSecundario },
  cargaDepois: { fontSize: 17, fontWeight: '700', color: cores.texto, fontVariant: ['tabular-nums'] },
});
