import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ItemDoTreino } from '@/db/consultas';
import { seloDaMeta, textoMeta, textoRealizado, textoSeries } from '@/domain/textos';

import { Selo } from './Selo';
import { estilosComuns } from './Tela';
import { cores } from './tema';

interface Props {
  item: ItemDoTreino;
  onAbrir: () => void; // toque na linha: detalhe do exercício
  onDesfazer?: () => void; // só para exercício já registrado hoje
}

// Um exercício em uma linha: na lista da aba Hoje e, na tela do treino, nas
// listas "A seguir" e "Feitos" (§3.2). Só mostra; registrar é na tela do treino.
// - por fazer: nome, meta e o selo de mudança;
// - feito: o que foi feito e a meta que o motor calculou para a próxima vez.
export function LinhaDoExercicio({ item, onAbrir, onDesfazer }: Props) {
  const { exercicio, estado, mudanca, feitoHoje, recordeHoje } = item;
  const feito = feitoHoje !== null;
  const pulado = feitoHoje?.resultado === 'pulou';

  let detalhe = estado === null ? 'sem meta ainda' : `${textoMeta(estado, exercicio.porLado)} · ${textoSeries(exercicio.seriesAlvo)}`;
  if (feitoHoje !== null) {
    const realizado = pulado ? 'Pulado' : textoRealizado(feitoHoje.cargaKg, feitoHoje.reps, exercicio.porLado);
    detalhe = estado !== null && !pulado ? `${realizado} · próxima: ${textoMeta(estado, exercicio.porLado)}` : realizado;
  }

  return (
    <View style={[estilosComuns.cartao, styles.linha]}>
      {feito && (
        <View style={[styles.marca, pulado && styles.marcaPulado]}>
          <Text style={[styles.simbolo, pulado && styles.simboloPulado]}>{pulado ? '–' : '✓'}</Text>
        </View>
      )}
      <Pressable accessibilityRole="link" accessibilityHint="Abre o histórico do exercício" onPress={onAbrir} style={styles.textos}>
        <Text style={styles.nome} numberOfLines={1}>
          {exercicio.nome}
        </Text>
        <Text style={styles.detalhe}>{detalhe}</Text>
      </Pressable>
      {feito && recordeHoje && <Selo selo={{ texto: 'recorde', direcao: 'sobe' }} />}
      {!feito && estado !== null && <Selo selo={seloDaMeta(mudanca)} />}
      {feito && onDesfazer !== undefined && (
        <Pressable accessibilityRole="button" onPress={onDesfazer} hitSlop={8} style={styles.desfazer}>
          <Text style={styles.textoDesfazer}>Desfazer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  marca: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaPulado: { backgroundColor: cores.superficieAlta },
  simbolo: { fontSize: 15, fontWeight: '800', color: cores.textoSobrePrimaria },
  simboloPulado: { color: cores.textoSecundario },
  textos: { flex: 1, gap: 2 },
  nome: { fontSize: 16, fontWeight: '600', color: cores.texto },
  detalhe: { fontSize: 14, lineHeight: 20, color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
  desfazer: { paddingVertical: 10, paddingHorizontal: 4 },
  textoDesfazer: { fontSize: 14, fontWeight: '600', color: cores.textoSecundario },
});
