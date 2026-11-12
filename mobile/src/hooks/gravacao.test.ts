import { criarTrava } from './gravacao';

// Uma promessa que só termina quando o teste mandar: simula uma gravação
// ainda em andamento no momento do segundo toque.
function criarPendente() {
  let terminar: () => void = () => undefined;
  const promessa = new Promise<void>((resolve) => {
    terminar = resolve;
  });
  return { promessa, terminar };
}

describe('criarTrava', () => {
  it('ignora o segundo toque enquanto a primeira gravação não termina', async () => {
    const gravar = criarTrava();
    const pendente = criarPendente();
    let gravacoes = 0;
    const acao = async () => {
      gravacoes += 1;
      await pendente.promessa;
    };

    const primeiro = gravar(acao);
    const segundo = gravar(acao);
    pendente.terminar();

    expect(await segundo).toBe('ocupada');
    expect(await primeiro).toBe('gravou');
    expect(gravacoes).toBe(1);
  });

  it('libera a trava depois que a gravação termina', async () => {
    const gravar = criarTrava();
    let gravacoes = 0;
    const acao = async () => {
      gravacoes += 1;
    };

    await gravar(acao);
    expect(await gravar(acao)).toBe('gravou');
    expect(gravacoes).toBe(2);
  });

  it('devolve "falhou" quando a gravação lança erro, e libera a trava', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const gravar = criarTrava();

    const resultado = await gravar(async () => {
      throw new Error('database is locked');
    });

    expect(resultado).toBe('falhou');
    expect(await gravar(async () => undefined)).toBe('gravou');
    aviso.mockRestore();
  });
});
