import { itemEmBranco, itensDaSugestao, validarItens, type ItemEmEdicao, type ItemSugerido } from './registroRapido';

const SUGERIDOS: ItemSugerido[] = [
  { exercicioId: 'ex_01', nome: 'Supino inclinado com halteres', grupoMuscular: 'peito', equipamento: 'halter', cargaKg: 12.5, reps: [8, 8, 7], confianca: 'alta' },
  { exercicioId: null, nome: 'Crucifixo com halteres', grupoMuscular: 'peito', equipamento: 'halter', cargaKg: 14, reps: [12], confianca: 'baixa' },
];

describe('itensDaSugestao', () => {
  it('vira itens editáveis, com a carga em texto e destaque na confiança baixa', () => {
    const itens = itensDaSugestao(SUGERIDOS);
    expect(itens[0]).toMatchObject({ exercicioId: 'ex_01', carga: '12,5', reps: [8, 8, 7], revisar: false });
    expect(itens[1]).toMatchObject({ exercicioId: null, revisar: true });
    expect(new Set(itens.map((i) => i.chave)).size).toBe(2);
  });
});

describe('validarItens', () => {
  const [existente, novo] = itensDaSugestao(SUGERIDOS) as [ItemEmEdicao, ItemEmEdicao];

  it('confirma exercício existente e novo', () => {
    expect(validarItens([existente, novo])).toEqual({
      ok: true,
      valor: [
        { tipo: 'existente', exercicioId: 'ex_01', cargaKg: 12.5, reps: [8, 8, 7] },
        { tipo: 'novo', nome: 'Crucifixo com halteres', grupoMuscular: 'peito', equipamento: 'halter', cargaKg: 14, reps: [12] },
      ],
    });
  });

  it('diz qual item tem problema', () => {
    expect(validarItens([existente, { ...novo, carga: 'catorze' }])).toEqual({
      ok: false,
      erro: 'Exercício 2: carga inválida. Use só números, como 20 ou 12,5.',
    });
  });

  it('recusa item sem séries ou só com zeros', () => {
    expect(validarItens([{ ...existente, reps: [] }]).ok).toBe(false);
    expect(validarItens([{ ...existente, reps: [0, 0] }]).ok).toBe(false);
  });

  it('item em branco (formulário manual) pede exercício e depois grupo e equipamento', () => {
    const branco = { ...itemEmBranco('m1'), carga: '20' };
    expect(validarItens([branco])).toMatchObject({ ok: false, erro: expect.stringMatching(/escolha um exercício/) });
    expect(validarItens([{ ...branco, nome: 'Remada' }])).toMatchObject({ ok: false, erro: expect.stringMatching(/grupo/) });
  });

  it('lista vazia não tem o que salvar', () => {
    expect(validarItens([])).toEqual({ ok: false, erro: 'Não há nada para salvar.' });
  });
});
