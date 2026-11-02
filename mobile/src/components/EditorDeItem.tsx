import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { Exercicio } from '@/db/repositorios/exercicios';
import type { ItemEmEdicao } from '@/domain/registroRapido';
import {
  EQUIPAMENTOS,
  GRUPOS_MUSCULARES,
  NOMES_DOS_EQUIPAMENTOS,
  NOMES_DOS_GRUPOS,
  type Equipamento,
  type GrupoMuscular,
} from '@/domain/tipos';

import { Botao } from './Botao';
import { EditorDeSeries } from './EditorDeSeries';
import { Opcoes } from './Opcoes';
import { estilosComuns } from './Tela';
import { cores, raio } from './tema';

const NOVO = '__novo__'; // opção "Novo exercício" na lista de escolha

interface Props {
  item: ItemEmEdicao;
  exercicios: readonly Exercicio[];
  onMudar: (item: ItemEmEdicao) => void;
  onRemover: () => void;
}

// Um item da confirmação do registro rápido: qual exercício, carga e reps.
// Tudo editável, porque a IA pode ter errado (§8.1).
export function EditorDeItem({ item, exercicios, onMudar, onRemover }: Props) {
  // Começa com a lista aberta quando ainda não há exercício escolhido.
  const [escolhendo, setEscolhendo] = useState(item.exercicioId === null && item.nome === '');
  const opcoes = [
    ...exercicios.map((e) => ({ valor: e.id, rotulo: e.nome })),
    { valor: NOVO, rotulo: '+ Novo exercício' },
  ];

  function escolher(valor: string) {
    setEscolhendo(false);
    const exercicio = exercicios.find((e) => e.id === valor);
    onMudar(
      exercicio === undefined
        ? { ...item, exercicioId: null }
        : { ...item, exercicioId: exercicio.id, nome: exercicio.nome, grupoMuscular: exercicio.grupoMuscular, equipamento: exercicio.equipamento },
    );
  }

  return (
    <View style={[estilosComuns.cartao, styles.item, item.revisar && styles.revisar]}>
      {item.revisar && <Text style={styles.aviso}>Confira: a IA ficou em dúvida neste.</Text>}

      <View style={styles.topo}>
        <Text style={styles.nome}>
          {item.exercicioId !== null ? item.nome : item.nome === '' ? 'Escolha o exercício' : `Novo: ${item.nome}`}
        </Text>
        <Botao titulo={escolhendo ? 'Fechar' : 'Trocar'} variante="secundario" compacto onPress={() => setEscolhendo(!escolhendo)} />
      </View>

      {escolhendo && (
        <Opcoes opcoes={opcoes} selecionados={[item.exercicioId ?? NOVO]} onAlternar={escolher} />
      )}

      {item.exercicioId === null && !escolhendo && (
        <>
          <TextInput
            value={item.nome}
            onChangeText={(nome) => onMudar({ ...item, nome })}
            placeholder="Nome do exercício novo"
            style={estilosComuns.campo}
          />
          <Opcoes
            opcoes={GRUPOS_MUSCULARES.map((g) => ({ valor: g, rotulo: NOMES_DOS_GRUPOS[g] }))}
            selecionados={item.grupoMuscular === null ? [] : [item.grupoMuscular]}
            onAlternar={(grupoMuscular: GrupoMuscular) => onMudar({ ...item, grupoMuscular })}
          />
          <Opcoes
            opcoes={EQUIPAMENTOS.map((e) => ({ valor: e, rotulo: NOMES_DOS_EQUIPAMENTOS[e] }))}
            selecionados={item.equipamento === null ? [] : [item.equipamento]}
            onAlternar={(equipamento: Equipamento) => onMudar({ ...item, equipamento })}
          />
        </>
      )}

      <View style={styles.linha}>
        <Text style={styles.rotulo}>Carga (kg)</Text>
        <TextInput
          value={item.carga}
          onChangeText={(carga) => onMudar({ ...item, carga })}
          keyboardType="decimal-pad"
          placeholder="0"
          style={[estilosComuns.campo, styles.campoCurto]}
        />
      </View>
      <EditorDeSeries reps={item.reps} onMudar={(reps) => onMudar({ ...item, reps })} />
      <Botao titulo="Remover" variante="perigo" compacto onPress={onRemover} />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { gap: 10 },
  revisar: { borderWidth: 2, borderColor: cores.desce, borderRadius: raio },
  aviso: { fontSize: 14, color: cores.desce, fontWeight: '600' },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nome: { fontSize: 17, fontWeight: '600', flexShrink: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { fontSize: 16 },
  campoCurto: { minWidth: 96, textAlign: 'right' },
});
