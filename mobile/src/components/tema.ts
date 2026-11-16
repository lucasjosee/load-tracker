// Cores e medidas usadas em todas as telas (Fase 7 do PLANO.md).
//
// A ideia do visual: o app é lido em um segundo, entre uma série e outra, num
// lugar de luz ruim. Por isso o fundo é escuro, o número é grande e existe
// uma cor só de marca.
//
// Essa cor (verde-lima) significa "subir": é a do botão "Bati", a do selo de
// progresso e a da linha dos gráficos. Por isso `sobe` e `primaria` são a
// mesma cor, de propósito. Âmbar é recuo ou alerta (deload, estagnado); cinza
// é "mantém"; vermelho fica só para apagar coisas.
export const cores = {
  fundo: '#0E0F11',
  superficie: '#17191C', // cartões e campos, um tom acima do fundo
  superficieAlta: '#23262B', // o que fica em cima de um cartão: botão secundário, chip, stepper
  borda: '#3A3F46',
  texto: '#F4F5F6',
  textoSecundario: '#A0A6AD',
  primaria: '#C8F031',
  primariaSuave: '#374020', // a primária a ~18% sobre o cartão: pontos já feitos da régua
  textoSobrePrimaria: '#0E0F11',
  perigo: '#FF6B5E',
  sobe: '#C8F031',
  desce: '#FFC24D',
  mantem: '#A0A6AD',
  aviso: '#3A2C0E', // fundo dos avisos; o texto por cima é `texto` ou `desce`
};

export const espaco = {
  pequeno: 8,
  medio: 12,
  grande: 20,
};

export const raio = 14; // botões, campos e avisos
export const raioDoCartao = 20;

// Os tamanhos de texto que se repetem. A fonte é a do sistema (San Francisco
// no iPhone): não pesa no app e já tem algarismos de largura fixa, ligados
// com `fontVariant: ['tabular-nums']` onde há número que muda.
export const tipografia = {
  titulo: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, color: cores.texto },
  tituloDeSecao: { fontSize: 13, fontWeight: '600', color: cores.textoSecundario },
  corpo: { fontSize: 17, color: cores.texto },
  secundario: { fontSize: 15, color: cores.textoSecundario },
} as const;
