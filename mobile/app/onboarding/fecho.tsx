import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { estilosComuns, Tela } from '@/components/Tela';
import { cores, espaco } from '@/components/tema';
import { Texto } from '@/components/Texto';
import { carregarPrimeiraMeta, type PrimeiraMeta } from '@/db/consultas';
import { paraDataLocal } from '@/domain/datas';
import { textoDoFecho, textoMeta, textoPrimeiroTreino, textoSeries } from '@/domain/textos';

// Fecho do onboarding (§3.1, passo 4): antes de pedir as notificações, a
// pessoa vê o que o app faz por ela, com os números dela. A divisão já foi
// gravada na revisão; as metas daqui são as que o motor calculou ali.
export default function TelaFecho() {
  const db = useSQLiteContext();
  const [dados, setDados] = useState<PrimeiraMeta | null>(null);

  useEffect(() => {
    carregarPrimeiraMeta(db, paraDataLocal(new Date())).then(setDados);
  }, [db]);

  if (dados === null) {
    return <View style={styles.carregando} />; // a leitura leva milissegundos
  }

  return (
    <Tela titulo={textoDoFecho(dados.nome)}>
      <Texto style={estilosComuns.textoSecundario}>
        A carga que você informou virou o ponto de partida. A cada treino você diz se bateu a meta; se bateu, ela
        sobe: primeiro as reps, depois a carga.
      </Texto>

      {dados.proximo === null ? (
        <Texto style={estilosComuns.textoSecundario}>
          Nenhum treino tem dia da semana ainda. Escolha os dias na aba Divisão para o treino aparecer na aba Hoje.
        </Texto>
      ) : (
        <View style={[estilosComuns.cartao, styles.cartao]}>
          <Texto style={styles.treino}>{textoPrimeiroTreino(dados.proximo)}</Texto>
          {dados.itens.map(({ exercicio, estado }) => (
            <View key={exercicio.id} style={styles.linha}>
              <View style={styles.exercicio}>
                <Texto style={styles.nome}>{exercicio.nome}</Texto>
                <Texto style={styles.series}>{textoSeries(exercicio.seriesAlvo)}</Texto>
              </View>
              {estado !== null && <Texto style={styles.meta}>{textoMeta(estado, exercicio.porLado)}</Texto>}
            </View>
          ))}
          {dados.itens.length === 0 && (
            <Texto style={estilosComuns.textoSecundario}>Este treino ainda não tem exercícios.</Texto>
          )}
        </View>
      )}

      <Botao titulo="Continuar" onPress={() => router.replace('/onboarding/permissao')} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, backgroundColor: cores.fundo },
  cartao: { gap: espaco.medio, marginVertical: espaco.pequeno },
  treino: { fontSize: 17, fontWeight: '700', color: cores.texto },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco.medio },
  exercicio: { flexShrink: 1, gap: 2 },
  nome: { fontSize: 16, color: cores.texto },
  series: { fontSize: 13, color: cores.textoSecundario },
  // A meta é o número que importa: na cor de "subir" e com algarismos de
  // largura fixa, para a coluna ficar alinhada.
  meta: { fontSize: 17, fontWeight: '700', color: cores.sobe, fontVariant: ['tabular-nums'] },
});
