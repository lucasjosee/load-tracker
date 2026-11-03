# Load Tracker

App iOS de **progressão de carga na academia**. Você registra o que fez e o app calcula a meta da próxima sessão de cada exercício por **dupla progressão**: primeiro sobem as repetições dentro da faixa, depois sobe a carga. Ele abre direto no treino do dia, avisa por notificação local e mostra a evolução por exercício e por grupo muscular.

A IA só transforma texto livre (*"supino inclinado 10kg 3x8"*) em dados estruturados e conduz o cadastro inicial. Quem decide carga e repetições é o motor de regras do app.

> Status: MVP em desenvolvimento.

## Arquitetura

```
iPhone (Expo Go)                                Nuvem
┌───────────────────────────────┐             ┌───────────────────────────┐
│ Telas (Expo Router)           │   HTTPS     │ AWS Lambda + Function URL │
│ Domínio puro: motor, métricas │ ──────────▶ │ Hono + zod                │
│ SQLite (expo-sqlite)          │  só p/ IA   │ SDK Anthropic (Haiku)     │
│ Notificações locais           │             └───────────────────────────┘
└───────────────────────────────┘
```

- **`mobile/src/domain/`**: TypeScript puro, sem React, banco, relógio ou rede. Motor de progressão (`calcularProxima`), métricas, textos e regras das telas, tudo com testes.
- **`mobile/src/db/`**: schema, migrações (`PRAGMA user_version`), repositórios e operações em transação.
- **`mobile/app/`**: rotas do Expo Router (abas Hoje, Evolução e Divisão, mais registro rápido, detalhe do exercício e onboarding).
- **`server/`**: duas rotas de IA (`/v1/registro/interpretar` e `/v1/onboarding/conversa`), com o contrato zod espelhado em `mobile/src/api/contrato.ts`.

## Decisões principais
- **A IA não decide a carga.** Ela só estrutura texto; a meta sai de um motor de regras determinístico, testado com a tabela da especificação e com testes de propriedade. Tudo o que a IA devolve passa pelo zod e por uma tela de confirmação antes de ser gravado.
- **Offline primeiro.** Academia costuma ter sinal ruim: treino, check-in, metas e notificações funcionam sem internet. Sem IA, o registro rápido e o onboarding viram formulários.
- **Notificação local.** O app agenda os avisos dos próximos 7 dias no próprio iPhone, sem servidor de push.
- **Estado derivado.** A meta atual é uma "foto" do motor aplicado ao histórico; `recalcularEstado()` a reconstrói do zero, o que também permite desfazer um check-in.

## Como rodar
```bash
# app (abre no iPhone pelo Expo Go)
cd mobile
npm install
npx expo start --tunnel ngrok   # no SDK 58, --tunnel sozinho exige `npx expo login`

# servidor (local)
cd server
npm install
cp .env.example .env            # preencha ANTHROPIC_API_KEY e APP_TOKEN
npm run dev
```

- Para o app usar a IA, preencha `mobile/.env` a partir do `mobile/.env.example`. Sem ele, o app funciona igual, só que com os formulários manuais.
- `npm run check` (nas duas pastas): lint, tipos, testes e a comparação dos dois `contrato.ts`.
- `npm run eval` e `npm run eval:onboarding` (no servidor): medem a IA com chamadas de verdade (gastam crédito).
- Deploy na Lambda: ver [`server/DEPLOY.md`](server/DEPLOY.md).
