# Load Tracker

App iOS de **progressão de carga na academia**. Você registra o que fez e o app calcula a meta da próxima sessão de cada exercício por **dupla progressão**: primeiro sobem as repetições dentro da faixa, depois sobe a carga. Ele abre direto no treino do dia, avisa por notificação local e mostra a evolução por exercício e por grupo muscular.

A IA só transforma texto livre (*"supino inclinado 10kg 3x8"*) em dados estruturados. Quem decide carga e repetições é o motor de regras do app.

> Status: em desenvolvimento (MVP).

## Stack
- **`mobile/`**: Expo + React Native + TypeScript + Expo Router, `expo-sqlite`, `expo-notifications`, `zod`. Testes com Jest (`jest-expo`).
- **`server/`**: Node.js + TypeScript + Hono + `@anthropic-ai/sdk` + `zod`, publicado como AWS Lambda com Function URL. Testes com Vitest.

Os dados de treino ficam no aparelho. O servidor existe só para chamar a IA, e a jornada de treino funciona offline.

## Como rodar
```bash
# app (abre no iPhone pelo Expo Go)
cd mobile
npm install
npx expo start        # use --tunnel se a Wi-Fi bloquear

# servidor
cd server
npm install
cp .env.example .env  # preencha ANTHROPIC_API_KEY e APP_TOKEN
npm run dev
```

Nas duas pastas, `npm run check` roda lint, checagem de tipos e testes.
