import { cores } from './tema';

// Opções comuns das Stacks (a raiz e a do onboarding): sem isto o cabeçalho e
// o fundo das telas ficariam nas cores padrão da navegação, claras.
// `contentStyle` é o fundo que aparece durante a animação de troca de tela.
export const OPCOES_DE_NAVEGACAO = {
  headerStyle: { backgroundColor: cores.fundo },
  headerTintColor: cores.texto, // título e seta de voltar
  headerShadowVisible: false,
  // Só a seta no botão de voltar. O nome da tela anterior (`headerBackTitle`)
  // continua valendo: é o que o iOS mostra no menu ao segurar a seta.
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: cores.fundo },
} as const;
