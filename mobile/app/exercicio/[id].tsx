import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { GraficoDeLinha } from '@/components/GraficoDeLinha';
import { Opcoes } from '@/components/Opcoes';
import { Selo } from '@/components/Selo';
import { Stepper } from '@/components/Stepper';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { carregarDetalhe, type DetalheDoExercicio } from '@/db/consultas';
import { configDoExercicio } from '@/db/operacoes';
import { atualizarExercicio, definirAtivo } from '@/db/repositorios/exercicios';
import { formatarDiaMes } from '@/domain/datas';
import { forcaDaSessao } from '@/domain/metricas';
import {
  formatarKg,
  formatarNumero,
  lerNumero,
  motivoDaMeta,
  seloDaMeta,
  textoDoEvento,
  textoMeta,
  textoSeries,
} from '@/domain/textos';
import {
  EQUIPAMENTOS,
  GRUPOS_MUSCULARES,
  NOMES_DOS_EQUIPAMENTOS,
  NOMES_DOS_GRUPOS,
  type Equipamento,
  type GrupoMuscular,
} from '@/domain/tipos';
import { validarRegras } from '@/domain/validacao';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

const OPCOES_DE_GRUPO = GRUPOS_MUSCULARES.map((g) => ({ valor: g, rotulo: NOMES_DOS_GRUPOS[g] }));
const OPCOES_DE_EQUIPAMENTO = EQUIPAMENTOS.map((e) => ({ valor: e, rotulo: NOMES_DOS_EQUIPAMENTOS[e] }));

// O formulário de regras enquanto a pessoa edita (o incremento é texto).
interface Formulario {
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  incremento: string;
}

function formularioDe(detalhe: DetalheDoExercicio): Formulario {
  const { exercicio } = detalhe;
  return {
    nome: exercicio.nome,
    grupoMuscular: exercicio.grupoMuscular,
    equipamento: exercicio.equipamento,
    repsMin: exercicio.repsMin,
    repsMax: exercicio.repsMax,
    seriesAlvo: exercicio.seriesAlvo,
    incremento: String(exercicio.incrementoKg).replace('.', ','),
  };
}

// Detalhe do exercício (§3.6, tarefa 5.2): gráficos de força e de carga,
// linha do tempo dos eventos e a configuração do exercício.
export default function TelaExercicio() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detalhe, setDetalhe] = useState<DetalheDoExercicio | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null);

  const carregar = useCallback(async () => {
    const novo = await carregarDetalhe(db, id);
    setDetalhe(novo);
    setFormulario(novo === null ? null : formularioDe(novo));
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  if (detalhe === null || formulario === null) {
    return <Tela>{null}</Tela>;
  }
  const { exercicio, estado, sessoes, eventos } = detalhe;
  const pesoCorporal = exercicio.equipamento === 'peso_corporal';
  const ultimaMudanca = eventos[eventos.length - 1] ?? null;
  const datas = sessoes.map((sessao) => formatarDiaMes(sessao.data));

  async function salvar() {
    if (formulario === null) {
      return;
    }
    const validacao = validarRegras({ ...formulario, incrementoKg: lerNumero(formulario.incremento) });
    if (!validacao.ok) {
      setMensagem({ texto: validacao.erro, erro: true });
      return;
    }
    await atualizarExercicio(db, exercicio.id, validacao.valor);
    await reagendarNotificacoes(db); // o nome vai no texto do aviso
    setMensagem({ texto: 'Salvo. As regras novas valem a partir do próximo registro.', erro: false });
    await carregar();
  }

  function alternarArquivado() {
    if (!exercicio.ativo) {
      definirAtivo(db, exercicio.id, true).then(carregar);
      return;
    }
    Alert.alert(
      `Arquivar ${exercicio.nome}?`,
      'Ele sai da aba Hoje e da Evolução. O histórico continua salvo, e dá para reativar aqui.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: async () => {
            await definirAtivo(db, exercicio.id, false);
            await reagendarNotificacoes(db);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: exercicio.nome }} />

      {estado !== null && (
        <View style={estilosComuns.cartao}>
          <View style={styles.topo}>
            <Text style={styles.meta}>
              {textoMeta(estado)} <Text style={styles.series}>· {textoSeries(exercicio.seriesAlvo)}</Text>
            </Text>
            <Selo selo={seloDaMeta(ultimaMudanca)} />
          </View>
          <Text style={estilosComuns.textoSecundario}>
            {motivoDaMeta(estado, ultimaMudanca, configDoExercicio(exercicio))}
          </Text>
        </View>
      )}
      {!exercicio.ativo && <Text style={styles.arquivado}>Exercício arquivado.</Text>}

      <GraficoDeLinha
        titulo={pesoCorporal ? 'Total de reps por sessão' : 'Força estimada (e1RM)'}
        valores={sessoes.map((sessao) => forcaDaSessao(sessao, pesoCorporal))}
        rotulos={datas}
        formatar={(v) => (pesoCorporal ? `${v} reps` : `${formatarNumero(v, 1)} kg`)}
      />
      {!pesoCorporal && (
        <GraficoDeLinha
          titulo="Carga"
          valores={sessoes.map((sessao) => sessao.cargaKg)}
          rotulos={datas}
          formatar={(v) => `${formatarKg(v)} kg`}
        />
      )}

      <Secao titulo="Linha do tempo">
        {eventos.length === 0 && <Text style={estilosComuns.textoSecundario}>Nenhum evento ainda.</Text>}
        {[...eventos].reverse().map((evento) => (
          <View key={evento.id} style={styles.evento}>
            <Text style={styles.dataDoEvento}>{formatarDiaMes(evento.data)}</Text>
            <Text style={styles.textoDoEvento}>{textoDoEvento(evento)}</Text>
          </View>
        ))}
      </Secao>

      <Secao titulo="Configuração">
        <TextInput
          value={formulario.nome}
          onChangeText={(nome) => setFormulario({ ...formulario, nome })}
          style={estilosComuns.campo}
        />
        <Opcoes
          opcoes={OPCOES_DE_GRUPO}
          selecionados={[formulario.grupoMuscular]}
          onAlternar={(grupoMuscular) => setFormulario({ ...formulario, grupoMuscular })}
        />
        <Opcoes
          opcoes={OPCOES_DE_EQUIPAMENTO}
          selecionados={[formulario.equipamento]}
          onAlternar={(equipamento) => setFormulario({ ...formulario, equipamento })}
        />
        <View style={styles.linha}>
          <Text style={styles.rotulo}>Reps mínimas</Text>
          <Stepper
            valor={formulario.repsMin}
            onMudar={(repsMin) => setFormulario({ ...formulario, repsMin })}
            minimo={1}
            maximo={formulario.repsMax}
            rotulo="reps mínimas"
          />
        </View>
        <View style={styles.linha}>
          <Text style={styles.rotulo}>Reps máximas</Text>
          <Stepper
            valor={formulario.repsMax}
            onMudar={(repsMax) => setFormulario({ ...formulario, repsMax })}
            minimo={formulario.repsMin}
            maximo={50}
            rotulo="reps máximas"
          />
        </View>
        <View style={styles.linha}>
          <Text style={styles.rotulo}>Séries</Text>
          <Stepper
            valor={formulario.seriesAlvo}
            onMudar={(seriesAlvo) => setFormulario({ ...formulario, seriesAlvo })}
            minimo={1}
            maximo={10}
            rotulo="séries"
          />
        </View>
        <View style={styles.linha}>
          <Text style={styles.rotulo}>Incremento (kg)</Text>
          <TextInput
            value={formulario.incremento}
            onChangeText={(incremento) => setFormulario({ ...formulario, incremento })}
            keyboardType="decimal-pad"
            style={[estilosComuns.campo, styles.campoCurto]}
          />
        </View>
        {mensagem !== null && (
          <Text style={mensagem.erro ? estilosComuns.erro : styles.salvo}>{mensagem.texto}</Text>
        )}
        <Botao titulo="Salvar configuração" onPress={salvar} />
        <Botao
          titulo={exercicio.ativo ? 'Arquivar exercício' : 'Reativar exercício'}
          variante={exercicio.ativo ? 'perigo' : 'secundario'}
          onPress={alternarArquivado}
        />
      </Secao>
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { fontSize: 22, fontWeight: '700', color: cores.texto, flexShrink: 1 },
  series: { fontSize: 17, fontWeight: '400', color: cores.textoSecundario },
  arquivado: { fontSize: 15, color: cores.desce, fontWeight: '600' },
  evento: { flexDirection: 'row', gap: 12 },
  dataDoEvento: { fontSize: 15, color: cores.textoSecundario, fontVariant: ['tabular-nums'], width: 48 },
  textoDoEvento: { fontSize: 15, color: cores.texto, flexShrink: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { fontSize: 17, color: cores.texto },
  campoCurto: { minWidth: 96, textAlign: 'right' },
  salvo: { fontSize: 15, color: cores.sobe },
});
