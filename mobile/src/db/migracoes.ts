// Migrações versionadas do banco (§9). A versão aplicada fica gravada no
// próprio arquivo do SQLite, em `PRAGMA user_version` (começa em 0).
//
// Regras para mexer aqui:
// - Nunca edite uma migração que já foi para o iPhone: o aparelho não roda de
//   novo uma versão que já aplicou. Para mudar o schema, acrescente a próxima.
// - As versões são 1, 2, 3... sem buracos, na ordem da lista.

export interface Migracao {
  versao: number;
  sql: string;
}

// Colunas sem `NULL` na §9 são NOT NULL. Os CHECK repetem os valores fixos
// da especificação (§7 e §9), para que um valor inválido seja barrado pelo
// próprio banco mesmo que escape da validação do app.
// ON DELETE CASCADE só nas tabelas de ligação; histórico (registro, evento)
// nunca é apagado em cascata.
const V1_SCHEMA_INICIAL = `
CREATE TABLE treino (
  id         TEXT PRIMARY KEY NOT NULL,
  nome       TEXT NOT NULL,
  criado_em  TEXT NOT NULL
);

CREATE TABLE treino_dia (
  dia_semana INTEGER PRIMARY KEY NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  treino_id  TEXT NOT NULL REFERENCES treino (id) ON DELETE CASCADE
);

CREATE TABLE exercicio (
  id             TEXT PRIMARY KEY NOT NULL,
  nome           TEXT NOT NULL,
  grupo_muscular TEXT NOT NULL CHECK (grupo_muscular IN (
    'peito', 'costas', 'ombros', 'biceps', 'triceps', 'antebraco', 'trapezio',
    'abdomen', 'quadriceps', 'posterior', 'gluteos', 'panturrilha'
  )),
  equipamento    TEXT NOT NULL CHECK (equipamento IN (
    'halter', 'barra', 'maquina', 'polia', 'peso_corporal', 'outro'
  )),
  reps_min       INTEGER NOT NULL CHECK (reps_min >= 1),
  reps_max       INTEGER NOT NULL CHECK (reps_max >= reps_min),
  series_alvo    INTEGER NOT NULL CHECK (series_alvo >= 1),
  incremento_kg  REAL NOT NULL CHECK (incremento_kg >= 0),
  ativo          INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  criado_em      TEXT NOT NULL
);

CREATE TABLE treino_exercicio (
  treino_id    TEXT NOT NULL REFERENCES treino (id) ON DELETE CASCADE,
  exercicio_id TEXT NOT NULL REFERENCES exercicio (id) ON DELETE CASCADE,
  ordem        INTEGER NOT NULL,
  PRIMARY KEY (treino_id, exercicio_id)
);

CREATE TABLE estado_progressao (
  exercicio_id  TEXT PRIMARY KEY NOT NULL REFERENCES exercicio (id),
  carga_kg      REAL NOT NULL CHECK (carga_kg >= 0),
  reps_alvo     INTEGER NOT NULL CHECK (reps_alvo >= 1),
  falhas        INTEGER NOT NULL DEFAULT 0 CHECK (falhas >= 0),
  atualizado_em TEXT NOT NULL
);

CREATE TABLE sessao (
  id            TEXT PRIMARY KEY NOT NULL,
  treino_id     TEXT REFERENCES treino (id),
  data          TEXT NOT NULL,
  iniciada_em   TEXT NOT NULL,
  finalizada_em TEXT
);

CREATE TABLE registro (
  id            TEXT PRIMARY KEY NOT NULL,
  sessao_id     TEXT REFERENCES sessao (id),
  exercicio_id  TEXT NOT NULL REFERENCES exercicio (id),
  carga_kg      REAL NOT NULL CHECK (carga_kg >= 0),
  resultado     TEXT NOT NULL CHECK (resultado IN ('bateu', 'nao_bateu', 'pulou')),
  meta_carga_kg REAL,
  meta_reps     INTEGER,
  origem        TEXT NOT NULL CHECK (origem IN ('checkin', 'texto', 'onboarding')),
  criado_em     TEXT NOT NULL
);

CREATE TABLE serie (
  registro_id TEXT NOT NULL REFERENCES registro (id) ON DELETE CASCADE,
  ordem       INTEGER NOT NULL,
  reps        INTEGER NOT NULL CHECK (reps >= 0),
  PRIMARY KEY (registro_id, ordem)
);

CREATE TABLE evento (
  id           TEXT PRIMARY KEY NOT NULL,
  exercicio_id TEXT NOT NULL REFERENCES exercicio (id),
  registro_id  TEXT NOT NULL REFERENCES registro (id),
  data         TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  carga_de     REAL,
  carga_para   REAL,
  reps_de      INTEGER,
  reps_para    INTEGER
);

CREATE TABLE config (
  chave TEXT PRIMARY KEY NOT NULL,
  valor TEXT NOT NULL
);
`;

// As falhas que o exercício tinha antes do registro. Com meta_carga_kg e
// meta_reps (que já existiam), o registro passa a guardar a meta inteira de
// antes dele, e "Desfazer" consegue voltar exatamente a ela. Registros
// antigos ficam com NULL; para eles o desfazer recalcula pelo histórico.
const V2_FALHAS_ANTES_DO_REGISTRO = `
ALTER TABLE registro ADD COLUMN meta_falhas INTEGER;
`;

// A carga passa a ser guardada como a pessoa anota: num exercício "por lado",
// 20 é o que vai em cada lado da barra, e o app mostra "20 kg lado" em vez de
// somar os dois (§5.2). A coluna só marca quais exercícios são assim.
//
// Até a v2 essas cargas estavam gravadas em dobro (o total). Não dá para
// saber, só pelo banco, quais linhas dividir por dois; como o uso real ainda
// não tinha começado, esta migração apaga os dados e o seed recria a divisão
// com os valores por lado. A ordem dos DELETE vai dos filhos para os pais,
// por causa das chaves estrangeiras.
const V3_CARGA_POR_LADO = `
ALTER TABLE exercicio ADD COLUMN carga_por_lado INTEGER NOT NULL DEFAULT 0 CHECK (carga_por_lado IN (0, 1));

DELETE FROM evento;
DELETE FROM serie;
DELETE FROM registro;
DELETE FROM sessao;
DELETE FROM estado_progressao;
DELETE FROM treino_exercicio;
DELETE FROM treino_dia;
DELETE FROM exercicio;
DELETE FROM treino;
DELETE FROM config;
`;

// Nota livre do exercício ("banco no furo 4", "barra triangular"): o tipo de
// lembrete que ficava no bloco de notas. NULL = sem nota. Só acrescenta a
// coluna; nenhum dado é tocado.
const V4_NOTA_DO_EXERCICIO = `
ALTER TABLE exercicio ADD COLUMN nota TEXT;
`;

// Pausa do treino (§3.2). `pausada_em` é o começo da pausa em curso (NULL =
// não está pausada) e `pausado_s`, a soma das pausas que já terminaram. Com
// as duas dá para saber o tempo de treino sem contar as paradas. Só
// acrescenta colunas; as sessões antigas ficam com zero segundos pausados.
const V5_PAUSA_DA_SESSAO = `
ALTER TABLE sessao ADD COLUMN pausada_em TEXT;
ALTER TABLE sessao ADD COLUMN pausado_s INTEGER NOT NULL DEFAULT 0;
`;

export const MIGRACOES: readonly Migracao[] = [
  { versao: 1, sql: V1_SCHEMA_INICIAL },
  { versao: 2, sql: V2_FALHAS_ANTES_DO_REGISTRO },
  { versao: 3, sql: V3_CARGA_POR_LADO },
  { versao: 4, sql: V4_NOTA_DO_EXERCICIO },
  { versao: 5, sql: V5_PAUSA_DA_SESSAO },
];

// Devolve, em ordem, as migrações que ainda não foram aplicadas no aparelho.
// Uma lista mal numerada é bug de quem escreveu a migração, por isso `throw`.
export function migracoesPendentes(versaoAtual: number, migracoes: readonly Migracao[]): Migracao[] {
  migracoes.forEach((migracao, indice) => {
    if (migracao.versao !== indice + 1) {
      throw new Error(
        `Migração na posição ${indice} tem versão ${migracao.versao}; esperado ${indice + 1}.`,
      );
    }
  });
  return migracoes.filter((migracao) => migracao.versao > versaoAtual);
}
