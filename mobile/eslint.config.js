// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Convenção do CLAUDE.md: sem `any`. O modo strict do tsc só proíbe o
    // `any` implícito; um `any` escrito à mão passa, então quem barra é o lint.
    // O filtro de arquivos é o mesmo em que a config do Expo registra o plugin.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Regra inviolável 1: o domínio é TypeScript puro. É isso que permite
    // testar o motor de progressão sem simular aparelho, banco, rede ou relógio.
    files: ['src/domain/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'expo', 'expo-*', '@expo/*'],
              message: 'src/domain/ é TypeScript puro: React e Expo ficam em telas, hooks e serviços.',
            },
            {
              // `@/` aponta para src/; daqui só se importa o próprio domínio.
              // A exceção nega a pasta (`!@/domain`), não o conteúdo dela
              // (`!@/domain/*`): no padrão do .gitignore, um arquivo não pode ser
              // reincluído se a pasta-pai foi excluída por `@/*`.
              // E um `../` saindo de src/domain/ sempre cai em outra camada.
              group: ['@/*', '!@/domain', '../*'],
              message: 'src/domain/ não depende de outras camadas (db, api, notificacoes...).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Sem relógio no domínio: receba a data por parâmetro.',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Sem relógio no domínio: `new Date()` lê a hora atual; receba a data por parâmetro.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Sem rede no domínio: chamadas HTTP ficam em src/api/.' },
      ],
    },
  },
]);
