import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { listarTreinosPorDia, type TreinoDoDia } from '@/db/repositorios/treinos';

// Índice = dia da semana (0 = domingo), igual a Date.getDay().
const NOMES_DOS_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Versão mínima: só lista os treinos gravados. A tela de edição é a tarefa 2.1.
export default function TelaDivisao() {
  const db = useSQLiteContext();
  const [treinos, setTreinos] = useState<TreinoDoDia[] | null>(null);

  useEffect(() => {
    listarTreinosPorDia(db).then(setTreinos);
  }, [db]);

  return (
    // `automatic` deixa o iOS calcular as margens da barra de status e da
    // barra de abas, para o conteúdo não ficar escondido atrás delas.
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo} accessibilityRole="header">
        Divisão
      </Text>

      {treinos !== null && treinos.length === 0 && (
        <Text style={styles.vazio}>Nenhum treino cadastrado.</Text>
      )}

      {treinos?.map(({ diaSemana, treino }) => (
        <View key={diaSemana} style={styles.linha}>
          <Text style={styles.dia}>{NOMES_DOS_DIAS[diaSemana]}</Text>
          <Text style={styles.nomeTreino}>{treino.nome}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: 20,
    gap: 12,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  vazio: {
    fontSize: 16,
    color: '#666',
  },
  linha: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
  },
  dia: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  nomeTreino: {
    fontSize: 17,
    marginTop: 2,
  },
});
