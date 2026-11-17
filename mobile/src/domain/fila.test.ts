import { adiarExercicio, filaDoTreino } from './fila';

const ORDEM = ['supino', 'crucifixo', 'triceps', 'desenvolvimento'];

describe('filaDoTreino', () => {
  it('sem nada feito nem adiado, é a ordem do treino', () => {
    expect(filaDoTreino(ORDEM, [], [])).toEqual(ORDEM);
  });

  it('o que já foi feito sai da fila', () => {
    expect(filaDoTreino(ORDEM, ['supino', 'triceps'], [])).toEqual(['crucifixo', 'desenvolvimento']);
  });

  it('o adiado vai para o fim e volta depois dos outros', () => {
    expect(filaDoTreino(ORDEM, [], ['supino'])).toEqual(['crucifixo', 'triceps', 'desenvolvimento', 'supino']);
  });

  it('vários adiados voltam na ordem em que foram adiados', () => {
    expect(filaDoTreino(ORDEM, ['crucifixo'], ['triceps', 'supino'])).toEqual(['desenvolvimento', 'triceps', 'supino']);
  });

  it('adiado que já foi feito não volta', () => {
    expect(filaDoTreino(ORDEM, ['supino'], ['supino'])).toEqual(['crucifixo', 'triceps', 'desenvolvimento']);
  });

  it('se só sobrou o adiado, ele é o da vez', () => {
    expect(filaDoTreino(ORDEM, ['crucifixo', 'triceps', 'desenvolvimento'], ['supino'])).toEqual(['supino']);
  });

  it('tudo feito: fila vazia', () => {
    expect(filaDoTreino(ORDEM, ORDEM, ['supino'])).toEqual([]);
  });
});

describe('adiarExercicio', () => {
  it('põe o exercício no fim dos adiados', () => {
    expect(adiarExercicio(['supino'], 'triceps')).toEqual(['supino', 'triceps']);
  });

  it('adiar de novo leva para trás dos outros, sem repetir', () => {
    expect(adiarExercicio(['supino', 'triceps'], 'supino')).toEqual(['triceps', 'supino']);
  });
});
