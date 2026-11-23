// Conta do gráfico: transforma valores em coordenadas da tela. Fica separada
// do componente para ter teste (é a parte que mais dá para errar).

export interface Ponto {
  x: number;
  y: number;
}

export interface Area {
  largura: number;
  altura: number;
  margem: number; // espaço livre em volta, para os pontos não ficarem cortados
}

// Valores espalhados de forma igual no eixo x (uma sessão por posição) e
// proporcionais no eixo y. Na tela, y cresce para BAIXO: o maior valor fica
// em cima, por isso a conta inverte o eixo.
export function escalarPontos(valores: readonly number[], area: Area): Ponto[] {
  if (valores.length === 0) {
    return [];
  }
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const larguraUtil = area.largura - 2 * area.margem;
  const alturaUtil = area.altura - 2 * area.margem;
  return valores.map((valor, indice) => ({
    // Um ponto só fica no meio, em vez de grudado na borda.
    x: area.margem + (valores.length === 1 ? larguraUtil / 2 : (indice / (valores.length - 1)) * larguraUtil),
    // Todos iguais: linha reta no meio (evita divisão por zero).
    y: area.margem + (maximo === minimo ? alturaUtil / 2 : ((maximo - valor) / (maximo - minimo)) * alturaUtil),
  }));
}

// A linha que passa por todos os pontos, mas em curva, sem as quinas de uma
// linha reta de ponto a ponto: o atributo `d` de um <Path> do SVG
// ("M x y C ...").
//
// Cada trecho entre dois pontos vira uma curva de Bézier cúbica (o comando
// `C`, que pede dois pontos de controle). O controle que sai de um ponto
// aponta na direção que vai do ponto anterior ao seguinte (o método de
// Catmull-Rom): assim a curva chega e sai de cada ponto na mesma direção e
// não faz bico. Nas pontas, o "anterior" e o "seguinte" que faltam são o
// próprio ponto. Dividir por 6 é o que faz a curva de Bézier ser igual à de
// Catmull-Rom.
export function paraCurvaSuave(pontos: readonly Ponto[]): string {
  const [primeiro] = pontos;
  if (primeiro === undefined) {
    return '';
  }
  let caminho = `M${numero(primeiro.x)} ${numero(primeiro.y)}`;
  for (let i = 0; i < pontos.length - 1; i++) {
    const anterior = pontos[Math.max(i - 1, 0)] ?? primeiro;
    const atual = pontos[i] ?? primeiro;
    const proximo = pontos[i + 1] ?? atual;
    const depois = pontos[Math.min(i + 2, pontos.length - 1)] ?? proximo;
    const saida = { x: atual.x + (proximo.x - anterior.x) / 6, y: atual.y + (proximo.y - anterior.y) / 6 };
    const chegada = { x: proximo.x - (depois.x - atual.x) / 6, y: proximo.y - (depois.y - atual.y) / 6 };
    caminho += ` C${numero(saida.x)} ${numero(saida.y)} ${numero(chegada.x)} ${numero(chegada.y)} ${numero(proximo.x)} ${numero(proximo.y)}`;
  }
  return caminho;
}

// Uma casa decimal basta para a tela e deixa o caminho legível.
function numero(valor: number): string {
  return String(Math.round(valor * 10) / 10);
}
