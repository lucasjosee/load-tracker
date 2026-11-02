import { describe, expect, it } from 'vitest';

import { criarApp, lerVariavel } from './app';

const TOKEN = 'token-de-teste';
const app = criarApp({ appToken: TOKEN });

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

describe('lerVariavel', () => {
  it('devolve o valor configurado', () => {
    expect(lerVariavel('X', { X: 'abc' })).toBe('abc');
  });

  it('variável ausente ou vazia impede o servidor de subir', () => {
    expect(() => lerVariavel('X', {})).toThrow(/X não configurada/);
    expect(() => lerVariavel('X', { X: '  ' })).toThrow();
  });
});
