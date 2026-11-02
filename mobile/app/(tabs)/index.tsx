import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { CartaoExercicio } from '@/components/CartaoExercicio';
import { estilosComuns, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { carregarHoje, type Hoje, type ItemDoTreino } from '@/db/consultas';
import { desfazerRegistro, fazerCheckin } from '@/db/operacoes';
import { paraDataLocal } from '@/domain/datas';
import { textoDoDia, textoProximoTreino, textoResumoDaSemana } from '@/domain/textos';
import type { Realizado } from '@/domain/tipos';

export default function TelaHoje() {
  const db = useSQLiteContext();
  const [hoje, setHoje] = useState<{ data: string; conteudo: Hoje } | null>(null);
  // Trava contra toque duplo: enquanto uma gravação não termina, outro toque
  // em "Bati" não grava o exercício de novo. useRef porque mudar a trava não
  // precisa redesenhar a tela.
  const gravando = useRef(false);

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

  async function gravar(acao: () => Promise<void>) {
    if (gravando.current) {
      return;
    }
    gravando.current = true;
    try {
      await acao();
      await carregar(); // o cartão mostra na hora o que foi feito e a meta nova
    } finally {
      gravando.current = false;
    }
  }

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

  const { treino } = conteudo;

  const checkin = (item: ItemDoTreino, realizado: Realizado) =>
    gravar(() => fazerCheckin(db, item.exercicio, realizado, treino.id, data));

  const desfazer = (item: ItemDoTreino) =>
    gravar(async () => {
      if (item.feitoHoje !== null) {
        await desfazerRegistro(db, item.exercicio, item.feitoHoje.id);
      }
    });

  return (
    <Tela titulo={treino.nome}>
      <Text style={estilosComuns.textoSecundario}>{textoDoDia(data)}</Text>
      {conteudo.itens.length === 0 && (
        <Text style={estilosComuns.textoSecundario}>Este treino não tem exercícios. Adicione na aba Divisão.</Text>
      )}
      {conteudo.itens.map((item) => (
        <CartaoExercicio
          key={item.exercicio.id}
          item={item}
          onCheckin={(realizado) => checkin(item, realizado)}
          onDesfazer={() => desfazer(item)}
        />
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  descanso: { fontSize: 28, fontWeight: '700', marginTop: 16 },
  proximo: { fontSize: 17, color: cores.texto },
});
