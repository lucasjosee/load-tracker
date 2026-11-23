import { StyleSheet, Text, View } from 'react-native';

import type { ItemDoTreino } from '@/db/consultas';
import { textoDuracao } from '@/domain/duracao';
import { situacaoNoResumo, type SituacaoNoResumo } from '@/domain/hoje';
import { seloDaMeta, textoMeta, textoMetasBatidas, textoResumoDaSessao } from '@/domain/textos';
import type { Evento } from '@/domain/tipos';

import { estilosComuns } from './Tela';
import { cores } from './tema';

interface Props {
  itens: ItemDoTreino[]; // todos os exercícios do treino, feitos ou não
  tipos: Evento[]; // um evento por exercício registrado na sessão
  duracaoS: number | null; // do "Iniciar treino" até encerrar
  // Só o cartão de cima, sem a lista do próximo treino. É o da aba Hoje,
  // onde a lista de exercícios logo abaixo já mostra a próxima meta de cada um.
  compacto?: boolean;
}

// O que aparece embaixo do nome de quem não melhorou. Quem melhorou mostra o
// que subiu ("↑ +1 rep").
const NOTA: Record<Exclude<SituacaoNoResumo, 'melhorou'>, string> = {
  manteve: 'repete a meta',
  recuou: '↓ deload',
  pulado: 'pulado hoje',
  nao_feito: 'não feito hoje',
};

// O resumo do treino encerrado (§3.2): quantas metas foram batidas, o que
// melhorou e o que fazer na próxima vez. Só mostra o que o motor já decidiu
// em cada check-in; nada é calculado aqui.
export function ResumoDoTreino({ itens, tipos, duracaoS, compacto = false }: Props) {
  const batidas = itens.filter((item) => item.feitoHoje?.resultado === 'bateu').length;
  const recordes = itens.filter((item) => item.recordeHoje).length;
  const detalhes = [
    textoResumoDaSessao(tipos),
    recordes === 0 ? null : recordes === 1 ? '1 recorde' : `${recordes} recordes`,
    duracaoS === null ? null : textoDuracao(duracaoS),
  ].filter((parte) => parte !== null);

  return (
    <View style={styles.resumo}>
      <View style={[estilosComuns.cartao, styles.cartao]}>
        <Text style={styles.titulo}>Treino finalizado</Text>
        <Text style={styles.batidas}>{textoMetasBatidas(batidas, itens.length)}</Text>
        <Text style={styles.detalhes}>{detalhes.join(' · ')}</Text>
      </View>

      {!compacto && (
        <View style={[estilosComuns.cartao, styles.cartao]}>
          <Text style={styles.titulo}>Próximo treino</Text>
          {itens.map((item) => {
            const situacao = situacaoNoResumo(
              item.feitoHoje?.resultado ?? null,
              item.feitoHoje === null ? null : (item.mudanca?.tipo ?? null),
            );
            const melhorou = situacao === 'melhorou';
            return (
              <View key={item.exercicio.id} style={styles.linha}>
                <View style={styles.textos}>
                  <Text style={styles.nome} numberOfLines={1}>
                    {item.exercicio.nome}
                  </Text>
                  {/* Uma linha só por exercício: o que mudou embaixo do nome, a meta nova à direita. */}
                  <Text style={[styles.nota, melhorou && styles.notaDeMelhora, situacao === 'recuou' && styles.notaDeRecuo]}>
                    {situacao === 'melhorou' ? seloDaMeta(item.mudanca).texto : NOTA[situacao]}
                  </Text>
                </View>
                {item.estado !== null && <Text style={styles.meta}>{textoMeta(item.estado, item.exercicio.porLado)}</Text>}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resumo: { gap: 12 },
  cartao: { padding: 18, gap: 10 },
  titulo: { fontSize: 15, fontWeight: '600', color: cores.textoSecundario },
  batidas: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: cores.texto, fontVariant: ['tabular-nums'] },
  detalhes: { fontSize: 15, color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  textos: { flex: 1, gap: 1 },
  nome: { fontSize: 16, color: cores.texto },
  nota: { fontSize: 13, color: cores.textoSecundario },
  // A cor de marca fica só no que subiu; o resto da lista é neutro.
  notaDeMelhora: { color: cores.sobe, fontWeight: '600' },
  notaDeRecuo: { color: cores.desce },
  meta: { fontSize: 16, fontWeight: '700', color: cores.texto, fontVariant: ['tabular-nums'] },
});
