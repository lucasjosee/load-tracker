import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { CartaoExercicio } from '@/components/CartaoExercicio';
import { estilosComuns, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { carregarHoje, type Hoje } from '@/db/consultas';
import { paraDataLocal } from '@/domain/datas';
import { textoDoDia, textoProximoTreino, textoResumoDaSemana } from '@/domain/textos';

export default function TelaHoje() {
  const db = useSQLiteContext();
  const [hoje, setHoje] = useState<{ data: string; conteudo: Hoje } | null>(null);

  const carregar = useCallback(async () => {
    // A data é lida a cada carga: se o app ficou aberto de um dia para o
    // outro, voltar para a aba já mostra o treino do dia novo.
    const data = paraDataLocal(new Date());
    setHoje({ data, conteudo: await carregarHoje(db, data, null) });
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  if (hoje === null) {
    return <Tela titulo="Hoje">{null}</Tela>;
  }
  const { data, conteudo } = hoje;

  if (conteudo.tipo === 'descanso') {
    return (
      <Tela titulo="Hoje">
        <Text style={estilosComuns.textoSecundario}>{textoDoDia(data)}</Text>
        <Text style={styles.descanso}>Descanso</Text>
        {conteudo.proximo !== null && (
          <Text style={styles.proximo}>Próximo treino · {textoProximoTreino(conteudo.proximo)}</Text>
        )}
        <Text style={estilosComuns.textoSecundario}>
          {textoResumoDaSemana(conteudo.treinosNaSemana, conteudo.seriesNaSemana)}
        </Text>
      </Tela>
    );
  }

  return (
    <Tela titulo={conteudo.treino.nome}>
      <Text style={estilosComuns.textoSecundario}>{textoDoDia(data)}</Text>
      {conteudo.itens.length === 0 && (
        <Text style={estilosComuns.textoSecundario}>Este treino não tem exercícios. Adicione na aba Divisão.</Text>
      )}
      {conteudo.itens.map((item) => (
        <CartaoExercicio key={item.exercicio.id} item={item} />
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  descanso: { fontSize: 28, fontWeight: '700', marginTop: 16 },
  proximo: { fontSize: 17, color: cores.texto },
});
