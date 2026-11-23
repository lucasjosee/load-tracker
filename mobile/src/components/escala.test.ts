import { escalarPontos, paraCurvaSuave } from './escala';

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


describe('paraCurvaSuave', () => {
  it('sem pontos, caminho vazio', () => {
    expect(paraCurvaSuave([])).toBe('');
  });

  it('um ponto só é o ponto de partida', () => {
    expect(paraCurvaSuave([{ x: 10, y: 20 }])).toBe('M10 20');
  });

  it('dois pontos: os controles ficam sobre a reta, a um sexto de cada ponta', () => {
    expect(paraCurvaSuave([{ x: 0, y: 0 }, { x: 60, y: 30 }])).toBe('M0 0 C10 5 50 25 60 30');
  });

  it('passa por todos os pontos, um trecho por par', () => {
    const caminho = paraCurvaSuave([
      { x: 0, y: 0 },
      { x: 30, y: 30 },
      { x: 60, y: 60 },
    ]);
    expect(caminho).toBe('M0 0 C5 5 20 20 30 30 C40 40 55 55 60 60');
  });

  it('no ponto do meio, chega e sai na mesma direção (sem bico)', () => {
    // Pico em (30, 0): a direção ali é a de (0, 30) para (60, 30), horizontal.
    const caminho = paraCurvaSuave([
      { x: 0, y: 30 },
      { x: 30, y: 0 },
      { x: 60, y: 30 },
    ]);
    expect(caminho).toBe('M0 30 C5 25 20 0 30 0 C40 0 55 25 60 30');
  });

  it('arredonda para uma casa decimal', () => {
    expect(paraCurvaSuave([{ x: 0.04, y: 1 / 3 }])).toBe('M0 0.3');
  });
});
