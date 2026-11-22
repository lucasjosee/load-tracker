import { cores, fonte } from './tema';

// Opções comuns das Stacks (a raiz e a do onboarding): sem isto o cabeçalho e
// o fundo das telas ficariam nas cores padrão da navegação, claras.
// `contentStyle` é o fundo que aparece durante a animação de troca de tela.
export const OPCOES_DE_NAVEGACAO = {
  headerStyle: { backgroundColor: cores.fundo },
  headerTintColor: cores.texto, // título e seta de voltar
  // O cabeçalho é nativo do iOS e não passa pelo componente `Texto`: a fonte
  // tem de vir aqui. O peso 600 é o mesmo do título padrão do iOS.
  headerTitleStyle: { fontFamily: fonte.normal, fontWeight: '600' },
  headerShadowVisible: false,
  // Só a seta no botão de voltar. O nome da tela anterior (`headerBackTitle`)
  // continua valendo: é o que o iOS mostra no menu ao segurar a seta.
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: cores.fundo },
} as const;
