# Deploy na AWS Lambda (tarefa 4.4)

O servidor roda numa Lambda com Function URL (HTTPS, sem API Gateway). Custo perto de zero para um usuário.

## 1. Gerar o pacote

```bash
cd server
npm run build        # dist/index.mjs (tudo num arquivo só) e dist/lambda.zip
```

## 2. Criar a função (console da AWS)

1. **Lambda → Create function → Author from scratch**
   - Nome: `load-tracker`
   - Runtime: **Node.js 22.x** (ou a LTS mais nova que aparecer)
   - Arquitetura: arm64 (mais barata; o pacote não tem código nativo)
2. **Code → Upload from → .zip file** → `dist/lambda.zip`
3. **Runtime settings → Edit → Handler:** `index.handler`
4. **Configuration → General configuration:** memória 256 MB, timeout **35 s** (a IA pode levar 15 s, e há uma nova tentativa)
5. **Configuration → Environment variables:**
   - `ANTHROPIC_API_KEY`: a chave da Anthropic
   - `APP_TOKEN`: uma senha longa e aleatória (`node -e "console.log(crypto.randomUUID())"`)
6. **Configuration → Function URL → Create:** Auth type **NONE**. Quem barra acessos é o `x-app-token`, conferido no código. CORS não é necessário, porque o app nativo não é um navegador.

Para atualizar depois: `npm run build` e envie o novo `lambda.zip` em **Code → Upload**.

### Pela linha de comando (alternativa)

Com a AWS CLI configurada e um papel de execução básico (`AWSLambdaBasicExecutionRole`) já criado:

```bash
aws lambda create-function --function-name load-tracker \
  --runtime nodejs22.x --architectures arm64 --handler index.handler \
  --role arn:aws:iam::<CONTA>:role/<PAPEL> \
  --zip-file fileb://dist/lambda.zip --timeout 35 --memory-size 256 \
  --environment "Variables={ANTHROPIC_API_KEY=...,APP_TOKEN=...}"
aws lambda create-function-url-config --function-name load-tracker --auth-type NONE
aws lambda add-permission --function-name load-tracker --statement-id url-publica \
  --action lambda:InvokeFunctionUrl --principal '*' --function-url-auth-type NONE
# atualizar o código:
aws lambda update-function-code --function-name load-tracker --zip-file fileb://dist/lambda.zip
```

Cuidado: com as variáveis na linha de comando, a chave fica no histórico do shell. Prefira colar pelo console.

## 3. Conferir

```bash
URL=https://<id>.lambda-url.<regiao>.on.aws
curl $URL/saude                                   # {"ok":true}
curl -X POST $URL/v1/registro/interpretar \
  -H "x-app-token: $APP_TOKEN" -H "content-type: application/json" \
  -d '{"texto":"supino reto 20kg 3x10","exercicios":[]}'
```

A tarefa está pronta quando o segundo `curl` devolve os itens interpretados.

## 4. Limite de gastos

No console da Anthropic (**Settings → Limits**), defina um limite mensal baixo. Com o Haiku, cada interpretação custa uma fração de centavo.

## 5. Ligar o app

Em `mobile/.env` (fora do Git, ver `mobile/.env.example`):

```
EXPO_PUBLIC_API_URL=https://<id>.lambda-url.<regiao>.on.aws
EXPO_PUBLIC_APP_TOKEN=<o mesmo APP_TOKEN>
```

Reinicie o `npx expo start --tunnel ngrok` depois de mudar o `.env`.

Os logs ficam no CloudWatch (**Monitor → View CloudWatch logs**). Só aparecem erros, nunca o texto do usuário (§8.6).
