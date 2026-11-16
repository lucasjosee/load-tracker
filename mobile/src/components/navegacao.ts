import { cores } from './tema';

// Opções comuns das Stacks (a raiz e a do onboarding): sem isto o cabeçalho e
// o fundo das telas ficariam nas cores padrão da navegação, claras.
// `contentStyle` é o fundo que aparece durante a animação de troca de tela.
export const OPCOES_DE_NAVEGACAO = {
  headerStyle: { backgroundColor: cores.fundo },
  headerTintColor: cores.texto, // título e seta de voltar
  headerShadowVisible: false,
  contentStyle: { backgroundColor: cores.fundo },
} as const;
