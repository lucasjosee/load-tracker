import { describe, expect, it, vi } from 'vitest';

import { criarApp, lerVariavel, type Dependencias } from './app';
import type { RespostaInterpretar } from './contrato';

const TOKEN = 'token-de-teste';
const RESPOSTA: RespostaInterpretar = {
  itens: [
    { exercicioId: 'ex_01', nome: 'Supino reto', grupoMuscular: 'peito', equipamento: 'barra', cargaKg: 20, reps: [10, 10, 10], confianca: 'alta' },
  ],
  naoEntendido: [],
};

function criarAppDeTeste(interpretarRegistro: Dependencias['interpretarRegistro'] = vi.fn()) {
  return criarApp({ appToken: TOKEN, interpretarRegistro });
}

const app = criarAppDeTeste();

function postar(aplicacao: ReturnType<typeof criarApp>, corpo: unknown) {
  return aplicacao.request('/v1/registro/interpretar', {
    method: 'POST',
    headers: { 'x-app-token': TOKEN, 'content-type': 'application/json' },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });
}

describe('GET /saude', () => {
  it('responde sem token', async () => {
    const resposta = await app.request('/saude');
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ ok: true });
  });
});

describe('token do app em /v1', () => {
  it('sem o header x-app-token: 401', async () => {
    const resposta = await app.request('/v1/qualquer-coisa', { method: 'POST' });
    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toEqual({ erro: 'Token inválido.' });
  });

  it('com token errado (mesmo do mesmo tamanho): 401', async () => {
    const resposta = await app.request('/v1/qualquer-coisa', {
      method: 'POST',
      headers: { 'x-app-token': 'token-de-testX' },
    });
    expect(resposta.status).toBe(401);
  });

  it('com o token certo passa da checagem (aqui cai no 404 de rota inexistente)', async () => {
    const resposta = await app.request('/v1/qualquer-coisa', {
      method: 'POST',
      headers: { 'x-app-token': TOKEN },
    });
    expect(resposta.status).toBe(404);
  });
});

describe('POST /v1/registro/interpretar', () => {
  const pedido = { texto: 'supino 20kg 3x10', exercicios: [{ id: 'ex_01', nome: 'Supino reto' }] };

  it('resposta válida da IA: 200 com os itens', async () => {
    const interpretar = vi.fn().mockResolvedValue({ ok: true, valor: RESPOSTA });
    const resposta = await postar(criarAppDeTeste(interpretar), pedido);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual(RESPOSTA);
    expect(interpretar).toHaveBeenCalledWith(pedido);
  });

  it('IA sem resposta aproveitável: 422', async () => {
    const interpretar = vi.fn().mockResolvedValue({ ok: false, motivo: 'resposta_invalida' });
    const resposta = await postar(criarAppDeTeste(interpretar), pedido);
    expect(resposta.status).toBe(422);
  });

  it('IA fora do ar: 502', async () => {
    const interpretar = vi.fn().mockResolvedValue({ ok: false, motivo: 'indisponivel' });
    expect((await postar(criarAppDeTeste(interpretar), pedido)).status).toBe(502);
  });

  it('pedido fora do contrato ou que não é JSON: 400, sem chamar a IA', async () => {
    const interpretar = vi.fn();
    const aplicacao = criarAppDeTeste(interpretar);
    expect((await postar(aplicacao, { texto: '' , exercicios: [] })).status).toBe(400);
    expect((await postar(aplicacao, { texto: 'a'.repeat(1001), exercicios: [] })).status).toBe(400);
    expect((await postar(aplicacao, 'isto não é json')).status).toBe(400);
    expect(interpretar).not.toHaveBeenCalled();
  });
});

describe('lerVariavel', () => {
  it('devolve o valor configurado', () => {
    expect(lerVariavel('X', { X: 'abc' })).toBe('abc');
  });

  it('variável ausente ou vazia impede o servidor de subir', () => {
    expect(() => lerVariavel('X', {})).toThrow(/X não configurada/);
    expect(() => lerVariavel('X', { X: '  ' })).toThrow();
  });
});
