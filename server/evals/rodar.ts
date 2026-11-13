// npm run eval: interpreta cada frase de evals/frases.json com a API DE
// VERDADE (gasta crédito) e mede carga, reps e associação (§8.5).
// Rode a cada mudança no prompt; a meta é ≥ 90% em cada métrica.
//
//   npm run eval            → frases de ajuste (as que orientam o prompt)
//   npm run eval -- teste   → frases separadas, só para a nota final

import { readFileSync } from 'node:fs';

import { lerVariavel } from '../src/app';
import { criarClienteAnthropic } from '../src/llm/cliente';
import { interpretarRegistro } from '../src/llm/interpretar';

import { arquivoDeFrases, avaliarFrase, META, somarPlacar, type Acertos, type Conjunto } from './avaliacao';
import { comMedidor, resumoDoUso } from './custo';

const conjunto: Conjunto = process.argv[2] === 'teste' ? 'teste' : 'ajuste';
const arquivo = arquivoDeFrases.parse(JSON.parse(readFileSync(new URL('./frases.json', import.meta.url), 'utf8')));
const frases = arquivo.frases.filter((frase) => frase.conjunto === conjunto);
const { cliente, uso } = comMedidor(criarClienteAnthropic(lerVariavel('ANTHROPIC_API_KEY')));
const porcentagem = (fracao: number) => `${Math.round(fracao * 100)}%`;
const emUmaLinha = (texto: string) => texto.replaceAll('\n', ' ⏎ ');

console.log(`Conjunto: ${conjunto} (${frases.length} frases)\n`);

const resultados: Acertos[] = [];
for (const frase of frases) {
  const resultado = await interpretarRegistro(cliente, { texto: frase.texto, exercicios: arquivo.exercicios });
  const obtidos = resultado.ok ? resultado.valor.itens : [];
  const acertos = avaliarFrase(frase.esperado, obtidos);
  resultados.push(acertos);

  const tudoCerto = acertos.carga + acertos.reps + acertos.associacao === 3 * acertos.itens;
  console.log(`${tudoCerto ? '✓' : '✗'} ${emUmaLinha(frase.texto)}`);
  if (!tudoCerto) {
    console.log(`    esperado: ${JSON.stringify(frase.esperado)}`);
    console.log(`    obtido:   ${resultado.ok ? JSON.stringify(obtidos.map(({ exercicioId, cargaKg, reps }) => ({ exercicioId, cargaKg, reps }))) : resultado.motivo}`);
    if (resultado.ok && resultado.valor.naoEntendido.length > 0) {
      console.log(`    não entendido: ${JSON.stringify(resultado.valor.naoEntendido)}`);
    }
  }
}

const placar = somarPlacar(resultados);
console.log(`\ncarga ${porcentagem(placar.carga)} · reps ${porcentagem(placar.reps)} · associação ${porcentagem(placar.associacao)} (meta ${porcentagem(META)} em cada)`);
console.log(resumoDoUso(uso));
process.exitCode = placar.passou ? 0 : 1;
