import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Opcoes } from '@/components/Opcoes';
import { Stepper } from '@/components/Stepper';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { adicionarExercicioExistente, cadastrarExercicio } from '@/db/operacoes';
import { listarExercicios, listarExerciciosDoTreino, type Exercicio } from '@/db/repositorios/exercicios';
import { paraDataLocal } from '@/domain/datas';
import { calcularProxima } from '@/domain/progressao';
import { lerNumero, textoMeta } from '@/domain/textos';
import {
  EQUIPAMENTOS,
  GRUPOS_MUSCULARES,
  INCREMENTO_PADRAO_KG,
  LIMITE_FALHAS_PADRAO,
  NOMES_DOS_EQUIPAMENTOS,
  NOMES_DOS_GRUPOS,
  REPS_MAX_PADRAO,
  REPS_MIN_PADRAO,
  SERIES_ALVO_PADRAO,
  type Equipamento,
  type GrupoMuscular,
} from '@/domain/tipos';
import { validarExercicio } from '@/domain/validacao';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

const OPCOES_DE_GRUPO = GRUPOS_MUSCULARES.map((g) => ({ valor: g, rotulo: NOMES_DOS_GRUPOS[g] }));
const OPCOES_DE_EQUIPAMENTO = EQUIPAMENTOS.map((e) => ({ valor: e, rotulo: NOMES_DOS_EQUIPAMENTOS[e] }));

export default function TelaNovoExercicio() {
  const db = useSQLiteContext();
  const { treinoId } = useLocalSearchParams<{ treinoId: string }>();

  const [nome, setNome] = useState('');
  const [grupo, setGrupo] = useState<GrupoMuscular | null>(null);
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const [repsMin, setRepsMin] = useState(REPS_MIN_PADRAO);
  const [repsMax, setRepsMax] = useState(REPS_MAX_PADRAO);
  const [series, setSeries] = useState(SERIES_ALVO_PADRAO);
  // Carga e incremento ficam como texto enquanto a pessoa digita ("12," ainda
  // não é número); só viram número na validação.
  const [incremento, setIncremento] = useState('');
  const [carga, setCarga] = useState('');
  const [reps, setReps] = useState(REPS_MIN_PADRAO);
  const [erro, setErro] = useState<string | null>(null);
  const [existentes, setExistentes] = useState<Exercicio[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listarExercicios(db), listarExerciciosDoTreino(db, treinoId)]).then(([todos, doTreino]) => {
        const noTreino = new Set(doTreino.map((e) => e.id));
        setExistentes(todos.filter((e) => e.ativo && !noTreino.has(e.id)));
      });
    }, [db, treinoId]),
  );

  // Trocar o equipamento sugere o incremento padrão dele (§5.2).
  function escolherEquipamento(novo: Equipamento) {
    setEquipamento(novo);
    setIncremento(String(INCREMENTO_PADRAO_KG[novo]).replace('.', ','));
    if (novo === 'peso_corporal') {
      setCarga('0');
    }
  }

  const validacao = validarExercicio({
    nome,
    grupoMuscular: grupo,
    equipamento,
    repsMin,
    repsMax,
    seriesAlvo: series,
    incrementoKg: lerNumero(incremento),
    cargaKg: lerNumero(carga),
    reps,
  });

  // Prévia da primeira meta com o motor de verdade, antes de salvar.
  const primeiraMeta = validacao.ok
    ? calcularProxima(
        null,
        { cargaKg: validacao.valor.cargaKg, reps: Array.from({ length: series }, () => reps) },
        { ...validacao.valor, limiteFalhas: LIMITE_FALHAS_PADRAO },
      ).estado
    : null;

  async function salvar() {
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }
    const { cargaKg, reps: repsAtuais, ...novo } = validacao.valor;
    await cadastrarExercicio(db, treinoId, novo, { cargaKg, reps: repsAtuais }, paraDataLocal(new Date()));
    await reagendarNotificacoes(db);
    router.back();
  }

  async function usarExistente(exercicio: Exercicio) {
    await adicionarExercicioExistente(db, treinoId, exercicio.id);
    await reagendarNotificacoes(db);
    router.back();
  }

  return (
    <Tela>
      <Secao titulo="Nome">
        <TextInput value={nome} onChangeText={setNome} placeholder="Ex.: Supino reto" style={estilosComuns.campo} />
      </Secao>

      <Secao titulo="Grupo muscular">
        <Opcoes opcoes={OPCOES_DE_GRUPO} selecionados={grupo === null ? [] : [grupo]} onAlternar={setGrupo} />
      </Secao>

      <Secao titulo="Equipamento">
        <Opcoes
          opcoes={OPCOES_DE_EQUIPAMENTO}
          selecionados={equipamento === null ? [] : [equipamento]}
          onAlternar={escolherEquipamento}
        />
      </Secao>

      <Secao titulo="Como você faz hoje">
        <Linha rotulo="Carga (kg)">
          <TextInput
            value={carga}
            onChangeText={setCarga}
            placeholder="0"
            keyboardType="decimal-pad"
            style={[estilosComuns.campo, styles.campoCurto]}
          />
        </Linha>
        <Linha rotulo="Reps por série">
          <Stepper valor={reps} onMudar={setReps} minimo={1} maximo={50} rotulo="reps atuais" />
        </Linha>
      </Secao>

      <Secao titulo="Regras de progressão">
        <Linha rotulo="Reps mínimas">
          <Stepper valor={repsMin} onMudar={setRepsMin} minimo={1} maximo={repsMax} rotulo="reps mínimas" />
        </Linha>
        <Linha rotulo="Reps máximas">
          <Stepper valor={repsMax} onMudar={setRepsMax} minimo={repsMin} maximo={50} rotulo="reps máximas" />
        </Linha>
        <Linha rotulo="Séries">
          <Stepper valor={series} onMudar={setSeries} minimo={1} maximo={10} rotulo="séries" />
        </Linha>
        <Linha rotulo="Incremento (kg)">
          <TextInput
            value={incremento}
            onChangeText={setIncremento}
            placeholder="2"
            keyboardType="decimal-pad"
            style={[estilosComuns.campo, styles.campoCurto]}
          />
        </Linha>
        <Text style={estilosComuns.textoSecundario}>
          Anote a carga sempre do mesmo jeito neste exercício: por halter, total da barra ou por lado.
        </Text>
      </Secao>

      {primeiraMeta !== null && (
        <Text style={styles.previa}>
          Primeira meta: {textoMeta(primeiraMeta)} × {series}
        </Text>
      )}
      {erro !== null && <Text style={estilosComuns.erro}>{erro}</Text>}
      <Botao titulo="Salvar exercício" onPress={salvar} />

      {existentes.length > 0 && (
        <Secao titulo="Ou use um que você já tem">
          {existentes.map((exercicio) => (
            <Pressable
              key={exercicio.id}
              accessibilityRole="button"
              onPress={() => usarExistente(exercicio)}
              style={({ pressed }) => [estilosComuns.cartao, pressed && styles.pressionado]}
            >
              <Text style={styles.nomeExistente}>{exercicio.nome}</Text>
              <Text style={estilosComuns.textoSecundario}>{NOMES_DOS_GRUPOS[exercicio.grupoMuscular]}</Text>
            </Pressable>
          ))}
        </Secao>
      )}
    </Tela>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { fontSize: 17, color: cores.texto },
  campoCurto: { minWidth: 96, textAlign: 'right' },
  previa: { fontSize: 17, fontWeight: '600', color: cores.primaria },
  nomeExistente: { fontSize: 17 },
  pressionado: { opacity: 0.6 },
});
