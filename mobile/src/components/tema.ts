// Cores, fundo e medidas usadas em todas as telas (identidade Vidro, Fase 11
// do PLANO.md).
//
// A ideia do visual: o app parece parte do iPhone. Os painéis são de vidro
// fosco, como os do iOS 26, sobre um fundo azul-noite com manchas de cor: o
// vidro precisa de algo atrás para parecer vidro. A fonte é a do sistema e os
// números são grandes, para ler de relance entre uma série e outra.
//
// O que cada cor quer dizer:
// - aurora (o gradiente de ciano para índigo, mais abaixo) e `primaria`: a
//   marca. A régua, a barra de progresso, a linha dos gráficos, o que está
//   marcado.
// - `sobe` (hortelã): subiu. O selo de progresso e o percentual positivo.
// - `desce` (âmbar): recuo ou alerta. Deload, estagnado, treino que faltou.
// - `mantem` (cinza): mantém.
// - `perigo` (coral): só para apagar coisas.
// O hortelã é frio e o âmbar é quente: dá para distinguir os dois mesmo sem
// enxergar bem as cores.
//
// Contraste: todo texto passa de 4,5:1 sobre o fundo e sobre um painel de
// vidro, inclusive no meio das manchas (conferido ao escolher os tons). Por
// isso nenhuma cor de texto é translúcida: em cima das manchas, o contraste
// de um texto translúcido mudaria de um ponto da tela para outro.
export const cores = {
  fundo: '#0B1224', // o azul-noite por baixo das manchas
  superficie: 'rgba(255, 255, 255, 0.075)', // o vidro dos painéis
  superficieAlta: 'rgba(255, 255, 255, 0.12)', // o que fica em cima de um painel: chip, stepper, trilho da régua
  campo: 'rgba(4, 8, 20, 0.35)', // campos de texto: mais escuros que o vidro, como um recorte nele
  borda: 'rgba(255, 255, 255, 0.14)', // a borda do vidro
  divisoria: 'rgba(255, 255, 255, 0.08)', // entre as linhas de uma lista
  texto: '#F4F7FB',
  textoSecundario: '#B8C1D2',
  primaria: '#9AA8FF', // o índigo da aurora, mais claro para servir também de texto
  primariaSuave: 'rgba(154, 168, 255, 0.28)', // os tons do calendário de treinos
  primariaMedia: 'rgba(154, 168, 255, 0.6)',
  textoSobrePrimaria: '#0A0F1C', // sobre a `primaria`, o hortelã e o branco do botão principal
  perigo: '#FFA3A3',
  sobe: '#7CF5C8',
  sobeFundo: 'rgba(124, 245, 200, 0.14)', // o fundo do selo "subiu": a cor bem apagada
  desce: '#FFC46B',
  desceFundo: 'rgba(255, 196, 107, 0.15)',
  mantem: '#B8C1D2',
  aviso: 'rgba(255, 196, 107, 0.12)', // fundo dos avisos, um vidro âmbar; o texto por cima é `texto` ou `desce`
};

// O gradiente de marca, de ciano para índigo. Fica no que mostra avanço: o
// trecho já feito da régua, a barra de progresso e a linha dos gráficos.
export const aurora = {
  inicio: '#5CE1E6',
  fim: '#7B8CFF',
};
export const gradienteAurora = `linear-gradient(90deg, ${aurora.inicio} 0%, ${aurora.fim} 100%)`;

// O fundo das telas: azul-noite, com três manchas de cor bem suaves (azul no
// canto de cima, verde-água à direita, violeta embaixo). São elas que fazem
// o vidro dos painéis parecer vidro. Ficam fracas de propósito: mais fortes,
// o texto cinza perderia contraste no meio delas.
//
// Como no CSS, a primeira camada da lista fica por cima. O `backgroundColor`
// fica por baixo de tudo: é o que aparece se o gradiente não for desenhado.
export const fundoDeTela = {
  backgroundColor: cores.fundo,
  backgroundImage: [
    'radial-gradient(120% 55% at 0% 0%, rgba(64, 110, 255, 0.42) 0%, rgba(64, 110, 255, 0) 62%)',
    'radial-gradient(90% 45% at 100% 38%, rgba(0, 196, 180, 0.22) 0%, rgba(0, 196, 180, 0) 62%)',
    'radial-gradient(120% 55% at 50% 106%, rgba(132, 84, 255, 0.34) 0%, rgba(132, 84, 255, 0) 62%)',
    `linear-gradient(180deg, ${cores.fundo} 0%, #070A14 100%)`,
  ].join(', '),
} as const;

// O vidro fosco dos painéis (cartões, listas). Um vidro de verdade desfoca o
// que está atrás dele; atrás destes painéis só existe o fundo, que já é suave,
// então um branco translúcido com borda fica igual e não custa nada para
// desenhar. A sombra tem duas partes: um filete de luz na borda de cima (o
// `inset`, por dentro) e uma sombra larga por fora, que descola o painel do
// fundo. (O vidro de verdade do iOS 26 fica para os botões: Vidro.tsx.)
export const vidro = {
  backgroundColor: cores.superficie,
  borderWidth: 1,
  borderColor: cores.borda,
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 12px 32px rgba(0, 0, 0, 0.3)',
} as const;

// O mesmo vidro em peças pequenas (chip, botão do stepper e os botões de
// vidro antes do iOS 26): um tom mais claro, para não sumir quando fica em
// cima de um painel, e sem a sombra larga.
export const vidroDeControle = {
  backgroundColor: cores.superficieAlta,
  borderWidth: 1,
  borderColor: cores.borda,
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.14)',
} as const;

export const espaco = {
  pequeno: 8,
  medio: 12,
  grande: 20,
};

// Cantos bem redondos, como os do iOS 26. Botões e chips são pílulas: o
// `borderRadius` deles é a metade da altura, escrito em cada um.
export const raio = 16; // campos, avisos e balões da conversa
export const raioDoCartao = 24;

// Os tamanhos de texto que se repetem. A fonte é a do sistema (SF Pro no
// iPhone): nenhum estilo põe `fontFamily`. Os algarismos dela têm larguras
// diferentes; onde há número que muda (tempo, carga), o estilo liga os de
// largura fixa com `fontVariant: ['tabular-nums']`, para o texto não tremer.
export const tipografia = {
  titulo: { fontSize: 34, fontWeight: '800', letterSpacing: -1, color: cores.texto },
  tituloDeSecao: { fontSize: 15, fontWeight: '600', color: cores.textoSecundario },
  corpo: { fontSize: 17, color: cores.texto },
  secundario: { fontSize: 15, color: cores.textoSecundario },
} as const;
