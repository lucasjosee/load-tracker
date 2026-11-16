// Contrato entre o app e o servidor (§8.3 e §8.4), em schemas zod.
//
// ESTE ARQUIVO EXISTE EM DOIS LUGARES, IDÊNTICO (regra 6 do CLAUDE.md):
//   server/src/contrato.ts e mobile/src/api/contrato.ts
// Mudou um, copie para o outro na mesma tarefa. O `npm run check` dos dois
// lados compara os arquivos (script `contrato`) e falha se estiverem diferentes.
//
// Por isso ele não importa nada do resto do projeto: só o zod. As listas de
// grupos, equipamentos, objetivos e tempos de treino repetem as do domínio;
// outro teste no app confere que batem com as de mobile/src/domain/tipos.ts.

import { z } from 'zod';

export const LIMITE_DO_TEXTO = 1000; // caracteres (§8.6)
export const LIMITE_DE_MENSAGENS = 20; // por conversa de onboarding (§8.6)
export const LIMITE_DE_EXERCICIOS = 300; // exercícios enviados para associar

export const grupoMuscular = z.enum([
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'antebraco',
  'trapezio',
  'abdomen',
  'quadriceps',
  'posterior',
  'gluteos',
  'panturrilha',
]);

export const equipamento = z.enum(['halter', 'barra', 'maquina', 'polia', 'peso_corporal', 'outro']);

const cargaKg = z.number().min(0).max(1000);
const reps = z.number().int().min(0).max(200);

// ---------- POST /v1/registro/interpretar (§8.3) ----------

export const pedidoInterpretar = z.object({
  texto: z.string().trim().min(1).max(LIMITE_DO_TEXTO),
  // Exercícios já cadastrados, para a IA associar o texto a eles.
  exercicios: z
    .array(z.object({ id: z.string().min(1), nome: z.string().min(1).max(100) }))
    .max(LIMITE_DE_EXERCICIOS),
});

export const itemInterpretado = z.object({
  exercicioId: z.string().nullable(), // null = exercício novo ou sem certeza
  nome: z.string().min(1).max(100),
  grupoMuscular,
  equipamento,
  cargaKg,
  // A anotação diz "lado" / "cada lado": cargaKg é o peso de UM lado, como foi
  // escrito, e o app mostra "20 kg lado" (§5.2). O servidor nunca dobra a carga.
  porLado: z.boolean(),
  reps: z.array(reps).min(1).max(20), // uma posição por série
  confianca: z.enum(['alta', 'media', 'baixa']),
});

export const respostaInterpretar = z.object({
  itens: z.array(itemInterpretado).max(30),
  naoEntendido: z.array(z.string()).max(30),
});

// ---------- POST /v1/onboarding/conversa (§8.4) ----------

// A conversa começa sempre por esta pergunta, mostrada pelo próprio app. Ela
// cobre o perfil (nome, tempo de treino e objetivo); a divisão vem em seguida.
export const PRIMEIRA_PERGUNTA =
  'Para começar: como você se chama, há quanto tempo treina e qual é o seu foco, força ou hipertrofia?';
export const LIMITE_DE_PERGUNTAS = 7; // depois disso, o resto se completa na revisão (§8.4)

// O objetivo define a faixa de reps padrão dos exercícios (§5.1). Quem faz
// essa conta é o app, por uma tabela fixa; a IA só registra a resposta.
export const objetivo = z.enum(['forca', 'hipertrofia']);
export const tempoDeTreino = z.enum(['menos_de_1_ano', 'de_1_a_3_anos', 'mais_de_3_anos']);

export const mensagem = z.object({
  papel: z.enum(['assistente', 'usuario']),
  texto: z.string().trim().min(1).max(LIMITE_DO_TEXTO),
});

export const exercicioDoRascunho = z.object({
  nome: z.string().min(1).max(100),
  grupoMuscular,
  equipamento,
  cargaKg: cargaKg.nullable(),
  porLado: z.boolean(), // como em itemInterpretado
  series: z.number().int().min(1).max(20).nullable(),
  reps: z.number().int().min(1).max(200).nullable(),
});

export const treinoDoRascunho = z.object({
  nome: z.string().min(1).max(60),
  // 0 = domingo … 6 = sábado, como Date.getDay().
  diasSemana: z.array(z.number().int().min(0).max(6)).max(7),
  exercicios: z.array(exercicioDoRascunho).max(30),
});

export const rascunho = z.object({
  // Perfil: cada campo fica null enquanto a pessoa não disser.
  nome: z.string().trim().min(1).max(40).nullable(),
  objetivo: objetivo.nullable(),
  tempoDeTreino: tempoDeTreino.nullable(),
  horarioTreino: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'use HH:MM')
    .nullable(),
  treinos: z.array(treinoDoRascunho).max(7),
});

export const pedidoOnboarding = z.object({
  mensagens: z.array(mensagem).min(1).max(LIMITE_DE_MENSAGENS),
  rascunho: rascunho.nullable(),
});

export const respostaOnboarding = z.object({
  rascunho,
  proximaPergunta: z.string().nullable(), // null quando completo
  completo: z.boolean(),
});

// ---------- Erros ----------

// Corpo de toda resposta de erro (401, 400, 422, 502...).
export const respostaDeErro = z.object({ erro: z.string() });

// Tipos TypeScript tirados dos schemas: uma fonte só para validar e tipar.
export type PedidoInterpretar = z.infer<typeof pedidoInterpretar>;
export type ItemInterpretado = z.infer<typeof itemInterpretado>;
export type RespostaInterpretar = z.infer<typeof respostaInterpretar>;
export type Mensagem = z.infer<typeof mensagem>;
export type ExercicioDoRascunho = z.infer<typeof exercicioDoRascunho>;
export type Objetivo = z.infer<typeof objetivo>;
export type TempoDeTreino = z.infer<typeof tempoDeTreino>;
export type TreinoDoRascunho = z.infer<typeof treinoDoRascunho>;
export type Rascunho = z.infer<typeof rascunho>;
export type PedidoOnboarding = z.infer<typeof pedidoOnboarding>;
export type RespostaOnboarding = z.infer<typeof respostaOnboarding>;
export type RespostaDeErro = z.infer<typeof respostaDeErro>;
