import Anthropic from '@anthropic-ai/sdk';

// O modelo da §8.2. Rápido e barato para extração estruturada.
export const MODELO = 'claude-haiku-5-5';

// O que o servidor usa do cliente da Anthropic. Depender desta interface (e
// não da classe inteira) deixa os testes passarem um cliente falso com
// `messages.create` simulado, sem rede e sem gastar crédito.
export interface ClienteLLM {
  messages: {
    create(parametros: Anthropic.MessageCreateParamsNonStreaming): Promise<RespostaDoModelo>;
  };
}

export type RespostaDoModelo = Pick<Anthropic.Message, 'content' | 'stop_reason'>;

export function criarClienteAnthropic(apiKey: string): ClienteLLM {
  return new Anthropic({
    apiKey,
    // §8.2: 15 s por chamada. O SDK não tenta de novo sozinho (maxRetries 0):
    // quem decide a única nova tentativa é chamarFerramenta(), e assim o pior
    // caso fica em ~30 s, dentro do tempo que o app espera.
    timeout: 15_000,
    maxRetries: 0,
  });
}
