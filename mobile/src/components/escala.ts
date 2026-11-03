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

// Formato do atributo `points` de uma <Polyline> do SVG: "x1,y1 x2,y2 ...".
export function paraPolyline(pontos: readonly Ponto[]): string {
  return pontos.map(({ x, y }) => `${x},${y}`).join(' ');
}
