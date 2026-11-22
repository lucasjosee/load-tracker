// Cores, fonte e medidas usadas em todas as telas (identidade Aço, Fase 10 do
// PLANO.md).
//
// A ideia do visual: o app é lido em um segundo, entre uma série e outra, num
// lugar de luz ruim. Por isso o fundo é escuro, o número é grande e existe
// uma cor só de marca. O escuro é de aço escovado, cinza-azulado, e não preto:
// é o material dos equipamentos de academia.
//
// A cor de marca (latão) significa "subir": é a do botão "Bati", a do selo de
// progresso e a da linha dos gráficos. Por isso `sobe` e `primaria` são a
// mesma cor, de propósito. Azul-aço é recuo ou alerta (deload, estagnado,
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
};

// A fonte do app é a Saira (assets/fonte/, carregada em app/_layout.tsx). São
// duas famílias: a normal, para tudo, e a larga, para os números grandes. O
// peso continua vindo do `fontWeight`: cada família tem um arquivo por peso e
// o iOS escolhe o arquivo mais próximo do peso pedido.
//
// Os nomes não são os nomes internos da fonte ("Saira") de propósito: assim o
// iOS só enxerga os arquivos que nós registramos, na ordem que registramos.
export const fonte = {
  normal: 'SairaTexto',
  larga: 'SairaLarga',
};

export const espaco = {
  pequeno: 8,
  medio: 12,
  grande: 20,
};

export const raio = 14; // botões, campos e avisos
export const raioDoCartao = 20;

// Os tamanhos de texto que se repetem. A família vem do componente `Texto`.
// A Saira tem algarismos de largura fixa, ligados com
// `fontVariant: ['tabular-nums']` onde há número que muda.
export const tipografia = {
  titulo: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, color: cores.texto },
  tituloDeSecao: { fontSize: 13, fontWeight: '600', color: cores.textoSecundario },
  corpo: { fontSize: 17, color: cores.texto },
  secundario: { fontSize: 15, color: cores.textoSecundario },
} as const;
