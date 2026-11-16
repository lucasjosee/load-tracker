# Histórico dos evals

Pontuação de cada versão dos prompts contra a API de verdade (§8.5). Meta: ≥ 90% em cada métrica.
Uma mudança de prompt por versão; cada mudança corrige um padrão de erro, não uma frase.

## Registro rápido (`npm run eval`): 18 itens de ajuste

| Versão | Mudança no prompt | Carga | Reps | Associação | Custo |
|---|---|---|---|---|---|
| v1 | prompt da tarefa 4.2, sem mudança | 78% | 89% | 94% | US$ 0,0048 |
| v2 | carga "por lado" vale o dobro, menos halter | 94% | 89% | 94% | US$ 0,0050 |
| v3 | a carga vem antes das reps; dois números com barra são duas cargas, vale a primeira | 94% | 100% | 94% | US$ 0,0057 |
| v4 | hífen entre nome e número é separador, não sinal de menos | 100% | 100% | 94% | US$ 0,0058 |
| v5 | equipamento, pegada ou variação diferente da lista é outro exercício (id null) | 100% | 100% | 100% | US$ 0,0060 |

| v6 | carga "por lado" fica como escrita, com `porLado: true` (o app não soma os lados) | 100% | 100% | 100% | US$ 0,0058 |

A v6 (15/11/2026) não corrige erro: troca a regra da v2. O Lucas decidiu que ver 40 kg na tela, tendo anotado "20 lado", confunde na hora do treino. A carga agora só conta como certa se a marca `porLado` também vier certa.

Erros que cada versão resolveu:
- v2: "20 lado", "22,5lado" e "25 cada lado" vinham sem dobrar.
- v3: "24,5/23, no Cross 4x10" virava reps [24, 23]; "Unilateral no scoth - 10 10,9,8" virava carga 0 com 4 séries.
- v4: "Flexora -55" oscilava entre 55 e carga 0 (o -55 era recusado pela validação e a nova tentativa zerava).
- v5: "Com a barra triangular para frente" era associado a "Tríceps na barra para frente".

## Teste final (`npm run eval -- teste`): 10 itens separados

| Prompt | Carga | Reps | Associação | Observação |
|---|---|---|---|---|
| v4 | 100% | 100% | 80% | primeira rodada, às cegas. "Pulldown na corda" e "Rosca no Scott com barra ajustável" foram associados a exercícios parecidos da lista |
| v5 | 100% | 100% | 90% | não é mais às cegas: a v5 veio depois de ver a rodada acima (o padrão já aparecia no ajuste). Erro restante: "Na barra para frente - 24,5/23, no Cross" ficou sem associação (id null) |

| v6 | 100% | 100% | 90% | regra nova do "por lado". Erro: "Rosca no Scott com barra ajustável" foi associado a "Rosca scott unilateral" (devia ser id null). Carga e marca vieram certas nos 4 itens com "lado" |

Com 10 itens, cada erro vale 10 pontos e uma rodada só não separa 80% de 90% com segurança. O erro que sobrou é o lado seguro: exercício sem associação aparece na confirmação para o Lucas escolher; associação errada gravaria no exercício errado.

## Onboarding (`npm run eval:onboarding`)

| Versão | Mudança no prompt | Aprovadas | Custo |
|---|---|---|---|
| v1 | prompt da tarefa 4.6, 3 conversas | 3 de 3 | US$ 0,0060 |
| v1 | mesma versão, com a 4ª conversa (anotações reais) | 2 de 4 | US$ 0,0092 |
| v2 | regras de carga do registro rápido (por lado, hífen, dois números) | 4 de 4 | US$ 0,0097 |
| v3 | treinos com nomes diferentes ficam separados | 4 de 4, duas rodadas | US$ 0,0098 e 0,0093 |

| v4 | "por lado" como escrito, com `porLado` (a conversa real confere a marca de cada exercício) | 4 de 4 | US$ 0,0098 |
| v5 | perfil na primeira pergunta (nome, objetivo, tempo de treino), limite de 7 perguntas; cada conversa ganhou a resposta do perfil e o gabarito dele | 4 de 4 | US$ 0,0132 |

Na rodada "2 de 4", além das cargas por lado, a IA juntou Legs e Lower num treino só (dias 3 e 6). Na v1 anterior e na v2 isso não aconteceu: o erro é intermitente, e a v3 existe para ele.

Gasto total das rodadas de 13/11/2026: cerca de US$ 0,08. Rodadas de 15/11/2026: cerca de US$ 0,02.
