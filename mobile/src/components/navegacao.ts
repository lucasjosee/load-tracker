import { cores, fundoDeTela } from './tema';
import { VIDRO_DO_SISTEMA } from './Vidro';

// Opções comuns das Stacks (a raiz e a do onboarding).
//
// O cabeçalho é transparente: o fundo com manchas da tela continua por trás
// dele, sem uma faixa de outra cor em cima. As telas rolam por baixo do
// cabeçalho e a `Tela` (ScrollView com `contentInsetAdjustmentBehavior`)
// já começa o conteúdo abaixo dele. No iOS 26 o próprio sistema desenha o
// cabeçalho em vidro: os botões viram pílulas de vidro e o que rola por baixo
// do título é desfocado sozinho. Antes dele, o cabeçalho ganha um desfoque
// escuro.
//
// `contentStyle` é o fundo que aparece durante a animação de troca de tela.
export const OPCOES_DE_NAVEGACAO = {
  headerTransparent: true,
  headerBlurEffect: VIDRO_DO_SISTEMA ? undefined : 'systemChromeMaterialDark',
  headerTintColor: cores.texto, // título e seta de voltar
  headerShadowVisible: false,
  // Só a seta no botão de voltar. O nome da tela anterior (`headerBackTitle`)
  // continua valendo: é o que o iOS mostra no menu ao segurar a seta.
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: fundoDeTela,
} as const;

// Para a tela que não rola inteira (a conversa do onboarding): com o
// cabeçalho transparente, o que fica no topo dela ficaria escondido atrás
// dele. Opaco, o sistema já começa a tela abaixo do cabeçalho.
export const CABECALHO_OPACO = {
  headerTransparent: false,
  headerStyle: { backgroundColor: cores.fundo },
  contentStyle: { backgroundColor: cores.fundo },
} as const;
