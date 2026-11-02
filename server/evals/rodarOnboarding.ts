// npm run eval:onboarding: simula as 3 conversas de evals/onboarding.json com
// a API DE VERDADE (gasta crédito) e confere o rascunho final de cada uma.

import { readFileSync } from 'node:fs';

import { lerVariavel } from '../src/app';
import { PRIMEIRA_PERGUNTA, type Mensagem, type Rascunho } from '../src/contrato';
import { criarClienteAnthropic } from '../src/llm/cliente';
import { conversarOnboarding } from '../src/llm/onboarding';

import { arquivoDeConversas, avaliarConversa } from './avaliacao';

const arquivo = arquivoDeConversas.parse(JSON.parse(readFileSync(new URL('./onboarding.json', import.meta.url), 'utf8')));
const cliente = criarClienteAnthropic(lerVariavel('ANTHROPIC_API_KEY'));

let aprovadas = 0;
for (const conversa of arquivo.conversas) {
  const mensagens: Mensagem[] = [{ papel: 'assistente', texto: PRIMEIRA_PERGUNTA }];
  let rascunho: Rascunho | null = null;

  for (const resposta of conversa.respostas) {
    mensagens.push({ papel: 'usuario', texto: resposta });
    const turno = await conversarOnboarding(cliente, { mensagens, rascunho });
    if (!turno.ok) {
      console.log(`  (turno falhou: ${turno.motivo})`);
      break;
    }
    rascunho = turno.valor.rascunho;
    if (turno.valor.completo || turno.valor.proximaPergunta === null) {
      break;
    }
    mensagens.push({ papel: 'assistente', texto: turno.valor.proximaPergunta });
  }

  const problemas = avaliarConversa(conversa.esperado, rascunho);
  aprovadas += Number(problemas.length === 0);
  console.log(`${problemas.length === 0 ? '✓' : '✗'} ${conversa.nome}`);
  problemas.forEach((p) => console.log(`    ${p}`));
}

console.log(`\n${aprovadas} de ${arquivo.conversas.length} conversas aprovadas`);
process.exitCode = aprovadas === arquivo.conversas.length ? 0 : 1;
