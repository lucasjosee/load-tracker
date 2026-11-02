import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Opcoes } from '@/components/Opcoes';
import { SeletorDeDias } from '@/components/SeletorDeDias';
import { Stepper } from '@/components/Stepper';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { salvarDivisaoDoOnboarding } from '@/db/operacoes';
import { paraDataLocal } from '@/domain/datas';
import { formatarHorario, lerHorario } from '@/domain/horario';
import {
  exercicioEmBranco,
  revisaoDoRascunho,
  treinoEmBranco,
  validarDivisao,
  type DivisaoEmRevisao,
  type ExercicioEmRevisao,
  type TreinoEmRevisao,
} from '@/domain/onboarding';
import { EQUIPAMENTOS, GRUPOS_MUSCULARES, NOMES_DOS_EQUIPAMENTOS, NOMES_DOS_GRUPOS } from '@/domain/tipos';
import { useRascunho } from '@/hooks/onboarding';

const OPCOES_DE_GRUPO = GRUPOS_MUSCULARES.map((g) => ({ valor: g, rotulo: NOMES_DOS_GRUPOS[g] }));
const OPCOES_DE_EQUIPAMENTO = EQUIPAMENTOS.map((e) => ({ valor: e, rotulo: NOMES_DOS_EQUIPAMENTOS[e] }));

// Revisão (§3.1, passo 3): a divisão montada aparece inteira e editável. É
// também o formulário manual, quando não há rascunho (sem IA ou sem internet).
export default function TelaRevisao() {
  const db = useSQLiteContext();
  const { rascunho } = useRascunho();
  // O rascunho só é lido ao abrir a tela; daqui em diante vale o que a pessoa editar.
  const [divisao, setDivisao] = useState<DivisaoEmRevisao>(() => revisaoDoRascunho(rascunho));
  const [erro, setErro] = useState<string | null>(null);
  const proximaChave = useRef(0);

  function novaChave(prefixo: string) {
    proximaChave.current += 1;
    return `${prefixo}-novo-${proximaChave.current}`;
  }

  function mudarTreino(chave: string, mudanca: Partial<TreinoEmRevisao>) {
    setDivisao({ ...divisao, treinos: divisao.treinos.map((t) => (t.chave === chave ? { ...t, ...mudanca } : t)) });
  }

  function mudarExercicio(treino: TreinoEmRevisao, chave: string, mudanca: Partial<ExercicioEmRevisao>) {
    mudarTreino(treino.chave, {
      exercicios: treino.exercicios.map((e) => (e.chave === chave ? { ...e, ...mudanca } : e)),
    });
  }

  // Minutos desde 00:00, para o stepper do horário andar de 15 em 15.
  const horario = divisao.horarioTreino === null ? null : lerHorario(divisao.horarioTreino);
  const minutos = horario === null ? null : horario.hora * 60 + horario.minuto;

  async function confirmar() {
    const validacao = validarDivisao(divisao);
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }
    await salvarDivisaoDoOnboarding(db, validacao.valor, paraDataLocal(new Date()));
    router.replace('/onboarding/permissao');
  }

  return (
    <Tela>
      <Text style={estilosComuns.textoSecundario}>
        Confira tudo. A carga de agora vira o ponto de partida, e o app calcula a primeira meta de cada exercício.
      </Text>

      <Secao titulo="Horário em que você treina">
        {minutos === null ? (
          <Botao titulo="Informar horário" variante="secundario" onPress={() => setDivisao({ ...divisao, horarioTreino: '18:00' })} />
        ) : (
          <View style={styles.linha}>
            <Stepper
              valor={minutos}
              onMudar={(m) => setDivisao({ ...divisao, horarioTreino: formatarHorario({ hora: Math.floor(m / 60), minuto: m % 60 }) })}
              passo={15}
              maximo={23 * 60 + 45}
              formatar={(m) => formatarHorario({ hora: Math.floor(m / 60), minuto: m % 60 })}
              rotulo="horário do treino"
            />
            <Botao titulo="Sem horário" variante="secundario" compacto onPress={() => setDivisao({ ...divisao, horarioTreino: null })} />
          </View>
        )}
      </Secao>

      {divisao.treinos.map((treino) => {
        const ocupados = new Map(
          divisao.treinos.filter((t) => t.chave !== treino.chave).flatMap((t) => t.diasSemana.map((dia) => [dia, t.nome || 'outro treino'] as const)),
        );
        return (
          <View key={treino.chave} style={[estilosComuns.cartao, styles.treino]}>
            <TextInput
              value={treino.nome}
              onChangeText={(nome) => mudarTreino(treino.chave, { nome })}
              placeholder="Nome do treino (ex.: Push)"
              style={[estilosComuns.campo, styles.nomeTreino]}
            />
            <SeletorDeDias
              dias={treino.diasSemana}
              onMudar={(diasSemana) =>
                // Um dia que passa para este treino sai do treino que o tinha.
                setDivisao({
                  ...divisao,
                  treinos: divisao.treinos.map((t) =>
                    t.chave === treino.chave ? { ...t, diasSemana } : { ...t, diasSemana: t.diasSemana.filter((d) => !diasSemana.includes(d)) },
                  ),
                })
              }
              ocupados={ocupados}
              nomeDoTreino={treino.nome}
            />

            {treino.exercicios.map((exercicio) => (
              <View key={exercicio.chave} style={styles.exercicio}>
                <TextInput
                  value={exercicio.nome}
                  onChangeText={(nome) => mudarExercicio(treino, exercicio.chave, { nome })}
                  placeholder="Exercício (ex.: Supino reto)"
                  style={estilosComuns.campo}
                />
                <Opcoes
                  opcoes={OPCOES_DE_GRUPO}
                  selecionados={exercicio.grupoMuscular === null ? [] : [exercicio.grupoMuscular]}
                  onAlternar={(grupoMuscular) => mudarExercicio(treino, exercicio.chave, { grupoMuscular })}
                />
                <Opcoes
                  opcoes={OPCOES_DE_EQUIPAMENTO}
                  selecionados={exercicio.equipamento === null ? [] : [exercicio.equipamento]}
                  onAlternar={(equipamento) => mudarExercicio(treino, exercicio.chave, { equipamento })}
                />
                <View style={styles.linha}>
                  <Text style={styles.rotulo}>Carga (kg)</Text>
                  <TextInput
                    value={exercicio.carga}
                    onChangeText={(carga) => mudarExercicio(treino, exercicio.chave, { carga })}
                    keyboardType="decimal-pad"
                    placeholder="?"
                    style={[estilosComuns.campo, styles.campoCurto]}
                  />
                </View>
                <View style={styles.linha}>
                  <Text style={styles.rotulo}>Séries</Text>
                  <Stepper valor={exercicio.series} onMudar={(series) => mudarExercicio(treino, exercicio.chave, { series })} minimo={1} maximo={10} rotulo="séries" />
                </View>
                <View style={styles.linha}>
                  <Text style={styles.rotulo}>Reps</Text>
                  <Stepper valor={exercicio.reps} onMudar={(reps) => mudarExercicio(treino, exercicio.chave, { reps })} minimo={1} maximo={50} rotulo="reps" />
                </View>
                <Botao
                  titulo="Tirar exercício"
                  variante="perigo"
                  compacto
                  onPress={() => mudarTreino(treino.chave, { exercicios: treino.exercicios.filter((e) => e.chave !== exercicio.chave) })}
                />
              </View>
            ))}

            <Botao
              titulo="+ Exercício"
              variante="secundario"
              onPress={() => mudarTreino(treino.chave, { exercicios: [...treino.exercicios, exercicioEmBranco(novaChave('exercicio'))] })}
            />
            <Botao
              titulo="Tirar treino"
              variante="perigo"
              compacto
              onPress={() => setDivisao({ ...divisao, treinos: divisao.treinos.filter((t) => t.chave !== treino.chave) })}
            />
          </View>
        );
      })}

      <Botao
        titulo="+ Treino"
        variante="secundario"
        onPress={() => setDivisao({ ...divisao, treinos: [...divisao.treinos, treinoEmBranco(novaChave('treino'))] })}
      />
      {erro !== null && <Text style={estilosComuns.erro}>{erro}</Text>}
      <Botao titulo="Confirmar divisão" onPress={confirmar} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  treino: { gap: 12 },
  nomeTreino: { fontWeight: '600', backgroundColor: cores.fundo },
  exercicio: { gap: 8, padding: 12, borderRadius: 10, backgroundColor: cores.fundo },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rotulo: { fontSize: 16 },
  campoCurto: { minWidth: 96, textAlign: 'right' },
});
