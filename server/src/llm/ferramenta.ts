// Chamada à IA com "tool use forçado" (§8.2): em vez de pedir JSON no texto,
// damos ao modelo uma ferramenta cujo schema é a resposta que queremos e o
// obrigamos a chamá-la. O argumento da chamada é a resposta.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { MODELO, type ClienteLLM } from './cliente';

export type ResultadoDaIA<T> =
  | { ok: true; valor: T }
  | { ok: false; motivo: 'resposta_invalida' | 'indisponivel' };

interface Chamada<T> {
  sistema: string;
  conteudo: string; // mensagem do usuário (dados + texto livre)
  nomeDaFerramenta: string;
  descricao: string;
  schema: z.ZodType<T>;
  maxTokens: number;
}

// O schema da ferramenta sai do próprio contrato zod: uma fonte só para o que
// pedimos ao modelo e para o que validamos depois.
function esquemaDaFerramenta(schema: z.ZodType): Anthropic.Tool['input_schema'] {
  const esquema = z.toJSONSchema(schema);
  delete esquema.$schema; // metadado do JSON Schema que a API não precisa
  return { ...esquema, type: 'object' };
}

function mensagensDoErro(erro: z.ZodError): string {
  return erro.issues.map((issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`).join('\n');
}

// Faz a chamada, valida com zod e, se vier inválido, tenta mais UMA vez
// mostrando ao modelo o que estava errado (§8.2). Falha de rede, timeout ou
// erro da API vira `indisponivel`; o app então oferece o formulário manual.
export async function chamarFerramenta<T>(cliente: ClienteLLM, chamada: Chamada<T>): Promise<ResultadoDaIA<T>> {
  const ferramenta: Anthropic.Tool = {
    name: chamada.nomeDaFerramenta,
    description: chamada.descricao,
    input_schema: esquemaDaFerramenta(chamada.schema),
  };
  const mensagens: Anthropic.MessageParam[] = [{ role: 'user', content: chamada.conteudo }];

  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    let resposta;
    try {
      resposta = await cliente.messages.create({
        model: MODELO,
        max_tokens: chamada.maxTokens,
        system: chamada.sistema,
        tools: [ferramenta],
        // Forçado: o modelo tem que chamar esta ferramenta. Sem `temperature`:
        // o Claude Haiku 5.5 recusa qualquer valor diferente do padrão (400).
        tool_choice: { type: 'tool', name: ferramenta.name },
        messages: mensagens,
      });
    } catch (erro) {
      if (erro instanceof Anthropic.APIError) {
        // Só o código: o corpo pode ecoar o texto do usuário (§8.6).
        console.error(`Anthropic respondeu com erro ${erro.status ?? 'de conexão'}`);
        return { ok: false, motivo: 'indisponivel' };
      }
      throw erro; // não é erro da API: é bug nosso
    }

    // O conteúdo é uma lista de blocos de tipos diferentes; procuramos o da
    // ferramenta pelo tipo, nunca pela posição.
    const chamadaDaFerramenta = resposta.content.find(
      (bloco): bloco is Anthropic.ToolUseBlock => bloco.type === 'tool_use' && bloco.name === ferramenta.name,
    );
    if (resposta.stop_reason === 'refusal' || chamadaDaFerramenta === undefined) {
      return { ok: false, motivo: 'resposta_invalida' };
    }

    const validacao = chamada.schema.safeParse(chamadaDaFerramenta.input);
    if (validacao.success) {
      return { ok: true, valor: validacao.data };
    }

    // Segunda tentativa: devolvemos ao modelo a própria chamada dele, marcada
    // como erro, com o que o zod reclamou.
    mensagens.push(
      { role: 'assistant', content: resposta.content },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: chamadaDaFerramenta.id,
            is_error: true,
            content: `Os dados não passaram na validação. Corrija e chame ${ferramenta.name} de novo:\n${mensagensDoErro(validacao.error)}`,
          },
        ],
      },
    );
  }
  return { ok: false, motivo: 'resposta_invalida' };
}
