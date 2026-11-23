// Cores, fonte e medidas usadas em todas as telas (identidade Aço, Fase 10 do
// PLANO.md).
//
// A ideia do visual: o app é lido em um segundo, entre uma série e outra, num
// lugar de luz ruim. Por isso o fundo é escuro, o número é grande e existe
// uma cor só de marca. O escuro é de aço escovado, cinza-azulado, e não preto:
// é o material dos equipamentos de academia.
//
// A cor de marca (latão) significa "subir": é a do selo de progresso, a da
// régua, a da linha dos gráficos e a da aba ativa. Por isso `sobe` e
// `primaria` são a mesma cor, de propósito. O botão principal não é latão: é
// cromado, como a barra (`cromo`, mais abaixo). Azul-aço é recuo ou alerta (deload, estagnado,
// falta); cinza é "mantém"; vermelho fica só para apagar coisas. O latão é
// quente e claro, o azul é frio e mais escuro: dá para distinguir os dois
// mesmo sem enxergar bem as cores.
//
// Contraste: todo texto passa de 4,5:1 sobre `fundo`, `superficie`,
// `superficieAlta` e `aviso` (conferido par a par ao escolher os tons).
export const cores = {
  fundo: '#2B3036',
  superficie: '#353B42', // cartões e campos, um tom acima do fundo
  superficieAlta: '#40464E', // o que fica em cima de um cartão: botão secundário, chip, stepper
  borda: '#59616B',
  texto: '#EEF1F4',
  textoSecundario: '#B5BCC4',
  primaria: '#E3B86A',
  primariaSuave: '#5A5446', // o latão bem apagado sobre o cartão: pontos já feitos da régua
  primariaMedia: '#8F7A52', // entre a suave e a cheia: o tom do meio do calendário de treinos
  textoSobrePrimaria: '#1F2328',
  perigo: '#FFA095',
  sobe: '#E3B86A',
  desce: '#8DB8E8',
  mantem: '#B5BCC4',
  aviso: '#2E3B4A', // fundo dos avisos; o texto por cima é `texto` ou `desce`
  sulco: '#23272C', // o que é cavado no aço: o trilho da régua, a divisória do painel
};

// O fundo escurece de leve para baixo, como metal iluminado de cima. Começa
// no tom do cabeçalho (`cores.fundo`) para não aparecer emenda com ele.
export const gradienteDoFundo = `linear-gradient(180deg, ${cores.fundo} 0%, #25292E 100%)`;

// O volume do aço, escrito uma vez para todas as telas (no formato do CSS,
// que o `boxShadow` do React Native aceita). Uma sombra com `inset` fica por
// dentro da peça; sem `inset`, por fora.
export const relevo = {
  // Cartão: um filete de luz na borda de cima (o chanfro), uma linha escura
  // embaixo e uma sombra larga e fraca que descola o cartão do fundo.
  painel: 'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 1px 0 rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.18)',
  // Botão, chip e stepper: o mesmo chanfro, sem a sombra larga.
  botao: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 0 rgba(0, 0, 0, 0.35)',
  // Campo de texto: o contrário, um sulco. A sombra fica dentro e em cima, e
  // a luz bate na borda de baixo.
  afundado: 'inset 0 2px 3px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255, 255, 255, 0.05)',
};

// O botão principal de cada tela ("Bati a meta", "Iniciar treino", "Salvar")
// é cromado, com o recartilhado da barra nas pontas (Recartilhado.tsx).
export const cromo = {
  // A luz bate em cima e o metal escurece embaixo. Apertado, o gradiente
  // inverte e o botão parece afundar.
  fundo: 'linear-gradient(180deg, #E6EAEE 0%, #C9CFD5 100%)',
  apertado: 'linear-gradient(180deg, #C3C9CF 0%, #DCE1E6 100%)',
  cor: '#D5DADF', // o tom do meio, para quando o gradiente não é desenhado
  texto: '#1F2328', // 10:1 sobre o tom mais escuro do cromo
  sombra: 'inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 2px 0 rgba(0, 0, 0, 0.35)',
  sulco: 'rgba(31, 35, 40, 0.22)', // as linhas do recartilhado
};

export const espaco = {
  pequeno: 8,
  medio: 12,
  grande: 20,
};

// Cantos pequenos, de peça usinada: arredondado demais parece plástico.
export const raio = 12; // botões, campos e avisos
export const raioDoCartao = 14;

// Os tamanhos de texto que se repetem. A fonte é a do sistema (SF Pro no
// iPhone): nenhum estilo põe `fontFamily`. Os algarismos dela têm larguras
// diferentes; onde há número que muda (tempo, carga), o estilo liga os de
// largura fixa com `fontVariant: ['tabular-nums']`, para o texto não tremer.
export const tipografia = {
  titulo: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, color: cores.texto },
  tituloDeSecao: { fontSize: 13, fontWeight: '600', color: cores.textoSecundario },
  corpo: { fontSize: 17, color: cores.texto },
  secundario: { fontSize: 15, color: cores.textoSecundario },
} as const;
