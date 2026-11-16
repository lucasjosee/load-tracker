import type { SQLiteDatabase } from 'expo-sqlite';

import { TABELAS_DO_BACKUP } from '@/domain/backup';
import { diaDaSemana, paraInstanteLocal, somarDias } from '@/domain/datas';
import { CHANCE_DE_FALTAR, realizadoFicticio, sorteador } from '@/domain/ficticio';

import { gravarDivisao } from './banco';
import { aplicarRealizado } from './operacoes';
import { obterEstado } from './repositorios/estadoProgressao';
import { listarExerciciosDoTreino } from './repositorios/exercicios';
import { iniciarSessao } from './repositorios/sessoes';
import { obterTreinoDoDia } from './repositorios/treinos';
import { DIVISAO_SEED } from './seed';
import { emTransacao } from './transacao';

export const SEMANAS_DE_HISTORICO = 12;
// Semente fixa: tocar no botão de novo gera sempre o mesmo histórico.
const SEMENTE = 2026;

// Ferramenta de desenvolvimento: troca tudo o que está no aparelho pela
// divisão do seed com 12 semanas de treinos inventados, até ontem (o treino
// de hoje fica por fazer). Serve para ver gráficos e evolução com dados.
//
// Cada dia passa pelo mesmo caminho do check-in de verdade (`aplicarRealizado`),
// então metas, eventos e deloads são os que o motor calcularia.
export async function preencherDadosFicticios(db: SQLiteDatabase, hoje: string): Promise<void> {
  const inicio = somarDias(hoje, -SEMANAS_DE_HISTORICO * 7);
  const sorteio = sorteador(SEMENTE);

  await emTransacao(db, async (txn) => {
    // Dos filhos para os pais, como no restaurar backup. A config (horário
    // do aviso, descanso) fica: não tem a ver com o histórico.
    for (const tabela of [...TABELAS_DO_BACKUP].reverse()) {
      if (tabela !== 'config') {
        await txn.execAsync(`DELETE FROM ${tabela}`);
      }
    }

    await gravarDivisao(txn, DIVISAO_SEED, inicio);
    // O histórico é ordenado por `criado_em`, que os repositórios preenchem
    // com o relógio. Sem acertar essa coluna, tudo teria acontecido "agora".
    await txn.runAsync('UPDATE registro SET criado_em = ?', instanteDoTreino(inicio));

    for (let data = somarDias(inicio, 1); data < hoje; data = somarDias(data, 1)) {
      const treino = await obterTreinoDoDia(txn, diaDaSemana(data));
      if (treino === null || sorteio() < CHANCE_DE_FALTAR) {
        continue;
      }
      const sessao = await iniciarSessao(txn, treino.id, data);
      const quando = instanteDoTreino(data);

      for (const exercicio of await listarExerciciosDoTreino(txn, treino.id)) {
        const meta = await obterEstado(txn, exercicio.id);
        if (meta === null) {
          continue;
        }
        const realizado = realizadoFicticio(meta, exercicio.seriesAlvo, sorteio());
        const { registro } = await aplicarRealizado(txn, exercicio, realizado, {
          origem: 'checkin',
          sessaoId: sessao.id,
          data,
        });
        await txn.runAsync('UPDATE registro SET criado_em = ? WHERE id = ?', quando, registro.id);
      }
      await txn.runAsync('UPDATE sessao SET iniciada_em = ?, finalizada_em = ? WHERE id = ?', quando, quando, sessao.id);
    }
  });
}

// Todo treino inventado acontece às 18h do dia dele.
function instanteDoTreino(data: string): string {
  return paraInstanteLocal(data, 18, 0).toISOString();
}
