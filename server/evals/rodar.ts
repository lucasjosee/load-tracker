// npm run eval: interpreta cada frase de evals/frases.json com a API DE
// VERDADE (gasta crédito) e mede carga, reps e associação (§8.5).
// Rode a cada mudança no prompt; a meta é ≥ 90% em cada métrica.

import { readFileSync } from 'node:fs';

import { lerVariavel } from '../src/app';
import { criarClienteAnthropic } from '../src/llm/cliente';
import { interpretarRegistro } from '../src/llm/interpretar';

import { arquivoDeFrases, avaliarFrase, META, somarPlacar, type Acertos } from './avaliacao';

const arquivo = arquivoDeFrases.parse(JSON.parse(readFileSync(new URL('./frases.json', import.meta.url), 'utf8')));
const cliente = criarClienteAnthropic(lerVariavel('ANTHROPIC_API_KEY'));
const porcentagem = (fracao: number) => `${Math.round(fracao * 100)}%`;

const resultados: Acertos[] = [];
for (const frase of arquivo.frases) {
  const resultado = await interpretarRegistro(cliente, { texto: frase.texto, exercicios: arquivo.exercicios });
  const obtidos = resultado.ok ? resultado.valor.itens : [];
  const acertos = avaliarFrase(frase.esperado, obtidos);
  resultados.push(acertos);

  const tudoCerto = acertos.carga + acertos.reps + acertos.associacao === 3 * acertos.itens;
  console.log(`${tudoCerto ? '✓' : '✗'} ${frase.texto}`);
  if (!tudoCerto) {
    console.log(`    esperado: ${JSON.stringify(frase.esperado)}`);
    console.log(`    obtido:   ${resultado.ok ? JSON.stringify(obtidos.map(({ exercicioId, cargaKg, reps }) => ({ exercicioId, cargaKg, reps }))) : resultado.motivo}`);
  }
}

const placar = somarPlacar(resultados);
console.log(`\ncarga ${porcentagem(placar.carga)} · reps ${porcentagem(placar.reps)} · associação ${porcentagem(placar.associacao)} (meta ${porcentagem(META)} em cada)`);
process.exitCode = placar.passou ? 0 : 1;
