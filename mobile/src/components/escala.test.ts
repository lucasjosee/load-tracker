import { escalarPontos, paraPolyline } from './escala';

const AREA = { largura: 120, altura: 60, margem: 10 };

describe('escalarPontos', () => {
  it('espalha no eixo x e põe o maior valor em cima', () => {
    expect(escalarPontos([10, 15, 20], AREA)).toEqual([
      { x: 10, y: 50 },
      { x: 60, y: 30 },
      { x: 110, y: 10 },
    ]);
  });

  it('um ponto só fica no meio', () => {
    expect(escalarPontos([42], AREA)).toEqual([{ x: 60, y: 30 }]);
  });

  it('valores iguais viram uma linha reta no meio', () => {
    expect(escalarPontos([5, 5], AREA).map((p) => p.y)).toEqual([30, 30]);
  });

  it('sem valores, sem pontos', () => {
    expect(escalarPontos([], AREA)).toEqual([]);
  });
});

describe('paraPolyline', () => {
  it('monta o atributo points do SVG', () => {
    expect(paraPolyline([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe('1,2 3,4');
  });
});
