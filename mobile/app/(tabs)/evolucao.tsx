import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CalendarioDeTreinos } from '@/components/CalendarioDeTreinos';
import { Selo } from '@/components/Selo';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { Texto } from '@/components/Texto';
import { carregarEvolucao, type Evolucao } from '@/db/consultas';
import { paraDataLocal } from '@/domain/datas';
import { formatarPercentual, frasesDeFeedback, textoDoGrupo, textoEstagnados } from '@/domain/textos';
import type { GrupoMuscular } from '@/domain/tipos';
import { NOMES_DOS_GRUPOS } from '@/domain/tipos';

// Aba Evolução (§3.6): o calendário de treinos do ano e cada grupo muscular
// com a variação de força em ~4 semanas e as séries da semana. Toque no grupo → exercícios do grupo.
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
  // Estagnação não tem seção própria: aparece como selo no grupo em que está
  // (§3.6) e, dentro do grupo, no exercício.
  const estagnadosDo = (grupo: GrupoMuscular) =>
    evolucao.exercicios.filter((item) => item.exercicio.grupoMuscular === grupo && item.estagnacao !== null).length;

  return (
    <Tela titulo="Evolução">
      {frases.map((frase) => (
        <Texto key={frase} style={styles.frase}>
          {frase}
        </Texto>
      ))}

      <CalendarioDeTreinos calendario={evolucao.calendario} />

      <Secao titulo="Grupos musculares">
        {evolucao.grupos.length === 0 && (
          <Texto style={estilosComuns.textoSecundario}>Cadastre exercícios na aba Divisão para ver a evolução.</Texto>
        )}
        {evolucao.grupos.map((resumo) => (
          <Pressable
            key={resumo.grupo}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/grupo/[grupo]', params: { grupo: resumo.grupo } })}
            accessibilityLabel={`${NOMES_DOS_GRUPOS[resumo.grupo]}: ${textoDoGrupo(resumo.variacao, resumo.seriesNaSemana)}${
              estagnadosDo(resumo.grupo) > 0 ? `, ${textoEstagnados(estagnadosDo(resumo.grupo))}` : ''
            }`}
            style={({ pressed }) => [estilosComuns.cartao, styles.grupo, pressed && styles.pressionado]}
          >
            <View style={styles.textosDoGrupo}>
              <View style={styles.nomeComSelo}>
                <Texto style={styles.nome}>{NOMES_DOS_GRUPOS[resumo.grupo]}</Texto>
                {estagnadosDo(resumo.grupo) > 0 && (
                  <Selo selo={{ texto: textoEstagnados(estagnadosDo(resumo.grupo)), direcao: 'desce' }} />
                )}
              </View>
              <Texto style={estilosComuns.textoSecundario}>
                {resumo.exercicios} {resumo.exercicios === 1 ? 'exercício' : 'exercícios'} · {resumo.seriesNaSemana}{' '}
                {resumo.seriesNaSemana === 1 ? 'série' : 'séries'} esta semana
              </Texto>
            </View>
            {/* A variação é o número da tela: grande, à direita, com a cor dizendo a direção. */}
            <View style={styles.variacao}>
              <Texto style={[styles.percentual, { color: corDaVariacao(resumo.variacao) }]}>
                {resumo.variacao === null ? '—' : formatarPercentual(resumo.variacao)}
              </Texto>
              <Texto style={styles.periodo}>{resumo.variacao === null ? 'sem histórico' : '4 semanas'}</Texto>
            </View>
          </Pressable>
        ))}
      </Secao>
    </Tela>
  );
}

// Subiu = cor de marca; caiu = cor de recuo; parado ou sem histórico = cinza.
function corDaVariacao(variacao: number | null): string {
  const pontos = variacao === null ? 0 : Math.round(variacao * 100);
  return pontos > 0 ? cores.sobe : pontos < 0 ? cores.desce : cores.mantem;
}

const styles = StyleSheet.create({
  grupo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  textosDoGrupo: { flex: 1, gap: 2 },
  nomeComSelo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nome: { fontSize: 17, fontWeight: '600', color: cores.texto },
  variacao: { alignItems: 'flex-end' },
  percentual: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  periodo: { fontSize: 12, color: cores.textoSecundario },
  pressionado: { opacity: 0.6 },
  frase: { fontSize: 17, fontWeight: '600', color: cores.sobe },
});
