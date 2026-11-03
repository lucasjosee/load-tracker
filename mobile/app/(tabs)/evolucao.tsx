import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { carregarEvolucao, type Evolucao } from '@/db/consultas';
import { paraDataLocal } from '@/domain/datas';
import { frasesDeFeedback, textoDoGrupo, textoEstagnacao } from '@/domain/textos';
import { NOMES_DOS_GRUPOS } from '@/domain/tipos';

// Aba Evolução (§3.6): cada grupo muscular com a variação de força em ~4
// semanas e as séries da semana. Toque no grupo → exercícios do grupo.
export default function TelaEvolucao() {
  const db = useSQLiteContext();
  const [evolucao, setEvolucao] = useState<Evolucao | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarEvolucao(db, paraDataLocal(new Date())).then(setEvolucao);
    }, [db]),
  );

  if (evolucao === null) {
    return <Tela titulo="Evolução">{null}</Tela>;
  }

  const frases = frasesDeFeedback(evolucao.grupos, evolucao.aumentosNoMes);
  const estagnados = evolucao.exercicios.filter((item) => item.estagnacao !== null);

  return (
    <Tela titulo="Evolução">
      {frases.map((frase) => (
        <Text key={frase} style={styles.frase}>
          {frase}
        </Text>
      ))}

      {estagnados.length > 0 && (
        <Secao titulo="Alertas">
          {estagnados.map(({ exercicio, estagnacao }) =>
            estagnacao === null ? null : (
              <Pressable
                key={exercicio.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: exercicio.id } })}
                style={({ pressed }) => [styles.alerta, pressed && styles.pressionado]}
              >
                <Text style={styles.textoAlerta}>⚠ {textoEstagnacao(exercicio.nome, estagnacao)}</Text>
              </Pressable>
            ),
          )}
        </Secao>
      )}

      <Secao titulo="Grupos musculares">
        {evolucao.grupos.length === 0 && (
          <Text style={estilosComuns.textoSecundario}>Cadastre exercícios na aba Divisão para ver a evolução.</Text>
        )}
        {evolucao.grupos.map((resumo) => (
          <Pressable
            key={resumo.grupo}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/grupo/[grupo]', params: { grupo: resumo.grupo } })}
            style={({ pressed }) => [estilosComuns.cartao, pressed && styles.pressionado]}
          >
            <View style={styles.topo}>
              <Text style={styles.nome}>{NOMES_DOS_GRUPOS[resumo.grupo]}</Text>
              <Text style={styles.contagem}>
                {resumo.exercicios} {resumo.exercicios === 1 ? 'exercício' : 'exercícios'}
              </Text>
            </View>
            <Text style={[estilosComuns.textoSecundario, (resumo.variacao ?? 0) > 0 && styles.subiu]}>
              {textoDoGrupo(resumo.variacao, resumo.seriesNaSemana)}
            </Text>
          </Pressable>
        ))}
      </Secao>
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  nome: { fontSize: 17, fontWeight: '600' },
  contagem: { fontSize: 14, color: cores.textoSecundario },
  subiu: { color: cores.sobe },
  pressionado: { opacity: 0.6 },
  frase: { fontSize: 17, fontWeight: '600', color: cores.sobe },
  alerta: { padding: 12, borderRadius: 12, backgroundColor: cores.aviso },
  textoAlerta: { fontSize: 15, color: cores.texto },
});
