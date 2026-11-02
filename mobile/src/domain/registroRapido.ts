// Tela de confirmação do registro rápido (§3.3): o que a IA (ou a pessoa, no
// formulário manual) propôs vira itens editáveis, e só depois de validados
// eles podem ser gravados (regra 3).

import { lerNumero } from './textos';
import type { Equipamento, GrupoMuscular } from './tipos';
import type { Validacao } from './validacao';

// O formato de um item que o servidor devolve (contrato §8.3). Repetido aqui
// porque o domínio não importa de outras camadas.
export interface ItemSugerido {
  exercicioId: string | null;
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  cargaKg: number;
  reps: number[];
  confianca: 'alta' | 'media' | 'baixa';
}

// Um item como está na tela, enquanto a pessoa edita.
export interface ItemEmEdicao {
  chave: string; // identifica o item na lista da tela
  exercicioId: string | null; // null = exercício novo
  nome: string;
  grupoMuscular: GrupoMuscular | null;
  equipamento: Equipamento | null;
  carga: string; // texto digitado: "12,5"
  reps: number[]; // uma posição por série
  revisar: boolean; // a IA teve pouca confiança: a tela destaca
}

export type ItemConfirmado =
  | { tipo: 'existente'; exercicioId: string; cargaKg: number; reps: number[] }
  | {
      tipo: 'novo';
      nome: string;
      grupoMuscular: GrupoMuscular;
      equipamento: Equipamento;
      cargaKg: number;
      reps: number[];
    };

export function itensDaSugestao(itens: readonly ItemSugerido[]): ItemEmEdicao[] {
  return itens.map((item, indice) => ({
    chave: `sugerido-${indice}`,
    exercicioId: item.exercicioId,
    nome: item.nome,
    grupoMuscular: item.grupoMuscular,
    equipamento: item.equipamento,
    carga: String(item.cargaKg).replace('.', ','),
    reps: [...item.reps],
    revisar: item.confianca === 'baixa',
  }));
}

// Item em branco, para o formulário manual (sem internet ou IA com erro).
export function itemEmBranco(chave: string): ItemEmEdicao {
  return {
    chave,
    exercicioId: null,
    nome: '',
    grupoMuscular: null,
    equipamento: null,
    carga: '',
    reps: [8, 8, 8],
    revisar: false,
  };
}

function validarItem(item: ItemEmEdicao, posicao: number): Validacao<ItemConfirmado> {
  const onde = `Exercício ${posicao}`;
  const cargaKg = lerNumero(item.carga);
  if (cargaKg === null) {
    return { ok: false, erro: `${onde}: carga inválida. Use só números, como 20 ou 12,5.` };
  }
  if (item.reps.length === 0 || item.reps.every((r) => r === 0)) {
    return { ok: false, erro: `${onde}: informe as reps de pelo menos uma série.` };
  }
  if (item.exercicioId !== null) {
    return { ok: true, valor: { tipo: 'existente', exercicioId: item.exercicioId, cargaKg, reps: item.reps } };
  }
  const nome = item.nome.trim();
  if (nome === '') {
    return { ok: false, erro: `${onde}: escolha um exercício ou dê nome ao novo.` };
  }
  if (item.grupoMuscular === null || item.equipamento === null) {
    return { ok: false, erro: `${onde}: escolha o grupo muscular e o equipamento do exercício novo.` };
  }
  return {
    ok: true,
    valor: { tipo: 'novo', nome, grupoMuscular: item.grupoMuscular, equipamento: item.equipamento, cargaKg, reps: item.reps },
  };
}

export function validarItens(itens: readonly ItemEmEdicao[]): Validacao<ItemConfirmado[]> {
  if (itens.length === 0) {
    return { ok: false, erro: 'Não há nada para salvar.' };
  }
  const confirmados: ItemConfirmado[] = [];
  for (const [indice, item] of itens.entries()) {
    const validacao = validarItem(item, indice + 1);
    if (!validacao.ok) {
      return validacao;
    }
    confirmados.push(validacao.valor);
  }
  return { ok: true, valor: confirmados };
}
