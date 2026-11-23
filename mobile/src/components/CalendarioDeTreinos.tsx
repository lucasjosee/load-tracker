import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import {
  melhorMes,
  MESES_CURTOS,
  textoDoCalendario,
  textoMelhorMes,
  type Calendario,
  type DiaDoCalendario,
} from '@/domain/calendario';

import { estilosComuns } from './Tela';
import { cores } from './tema';

const LADO = 13; // lado de cada quadrado
const VAO = 3;
const TONS = [cores.primariaSuave, cores.primariaMedia, cores.primaria]; // nivel 0, 1 e 2
const ALTURA_DAS_BARRAS = 70;

// Calendário de treinos (§3.6): um quadrado por dia e uma coluna por semana,
// como o gráfico de contribuições do GitHub. O tom da cor de marca é quantas
// metas foram batidas no treino; o contorno na cor de recuo é um dia de
// treino sem registro.
export function CalendarioDeTreinos({ calendario }: { calendario: Calendario }) {
  const rolagem = useRef<ScrollViewInstance>(null);
  const destaque = melhorMes(calendario.porMes);
  const maximo = Math.max(1, ...calendario.porMes.map((mes) => mes.treinos));
  const fraseDoMes = textoMelhorMes(calendario.porMes);

  return (
    <>
      <View style={[estilosComuns.cartao, styles.cartao]}>
        <View style={[styles.cabecalho, styles.margem]}>
          <Text style={styles.titulo}>Constância</Text>
          <Text style={styles.periodo}>últimos 12 meses</Text>
        </View>

        <View style={[styles.numeros, styles.margem]}>
          <Numero valor={calendario.treinos} rotulo={calendario.treinos === 1 ? 'treino' : 'treinos'} destaque />
          <Numero valor={calendario.sequenciaAtual} rotulo={calendario.sequenciaAtual === 1 ? 'semana seguida' : 'semanas seguidas'} />
          <Numero valor={calendario.maiorSequencia} rotulo="maior sequência" />
        </View>

        {/* O ano não cabe na largura da tela: rola de lado, e abre no fim,
            onde está a semana atual. Sem a barra de rolagem, que polui. */}
        <ScrollView
          ref={rolagem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rolagem}
          onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: false })}
        >
          <View accessible accessibilityRole="image" accessibilityLabel={textoDoCalendario(calendario)}>
            <View style={styles.meses}>
              {calendario.rotulos.map((mes, indice) => (
                <View key={indice} style={styles.espacoDoMes}>
                  {mes !== null && <Text style={styles.mes}>{MESES_CURTOS[mes - 1]}</Text>}
                </View>
              ))}
            </View>
            <View style={styles.semanas}>
              {calendario.semanas.map((semana, indice) => (
                <View key={indice} style={styles.semana}>
                  {semana.map((dia) => (
                    <View key={dia.data} style={[styles.dia, estiloDoDia(dia)]} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.legenda, styles.margem]}>
          <View style={[styles.amostra, { backgroundColor: cores.divisoria }]} />
          <Text style={styles.textoDaLegenda}>descanso</Text>
          <View style={[styles.amostra, styles.faltou]} />
          <Text style={styles.textoDaLegenda}>faltou</Text>
          <View style={styles.escala}>
            <Text style={styles.textoDaLegenda}>menos</Text>
            {TONS.map((tom) => (
              <View key={tom} style={[styles.amostra, { backgroundColor: tom }]} />
            ))}
            <Text style={styles.textoDaLegenda}>metas batidas</Text>
          </View>
        </View>
      </View>

      {fraseDoMes !== null && (
        <View style={[estilosComuns.cartao, styles.cartaoDosMeses]}>
          <Text style={styles.titulo}>Por mês</Text>
          <View style={styles.barras} accessible accessibilityLabel={fraseDoMes}>
            {calendario.porMes.map((mes) => (
              <View key={mes.mes} style={styles.colunaDoMes}>
                <View
                  style={[
                    styles.barra,
                    { height: Math.max(4, Math.round((mes.treinos / maximo) * ALTURA_DAS_BARRAS)) },
                    mes.mes === destaque?.mes && styles.barraDoMelhorMes,
                  ]}
                />
                <Text style={styles.letraDoMes}>{MESES_CURTOS[mes.mes - 1].charAt(0).toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.fraseDoMes}>{fraseDoMes}</Text>
        </View>
      )}
    </>
  );
}

function Numero({ valor, rotulo, destaque = false }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <View style={styles.numero}>
      <Text style={[styles.valor, destaque && styles.valorEmDestaque]}>{valor}</Text>
      <Text style={styles.rotulo}>{rotulo}</Text>
    </View>
  );
}

function estiloDoDia(dia: DiaDoCalendario) {
  switch (dia.situacao) {
    case 'treinou':
      return { backgroundColor: TONS[dia.nivel] };
    case 'faltou':
      return styles.faltou;
    case 'hoje':
      return styles.hoje;
    case 'futuro':
      return styles.futuro;
    default: // 'descanso' e 'antes': o quadrado neutro
      return null;
  }
}

const styles = StyleSheet.create({
  // O cartão não tem margem dos lados: o calendário rola de borda a borda.
  cartao: { paddingVertical: 18, paddingHorizontal: 0, gap: 16 },
  margem: { paddingHorizontal: 18 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  titulo: { fontSize: 15, fontWeight: '600', color: cores.textoSecundario },
  periodo: { fontSize: 13, color: cores.textoSecundario },
  numeros: { flexDirection: 'row', gap: 12 },
  numero: { flex: 1, gap: 2 },
  valor: { fontSize: 34, fontWeight: '800', letterSpacing: -1, color: cores.texto, fontVariant: ['tabular-nums'] },
  valorEmDestaque: { color: cores.primaria },
  rotulo: { fontSize: 13, color: cores.textoSecundario },
  rolagem: { paddingHorizontal: 18 },
  meses: { flexDirection: 'row', gap: VAO, height: 16 },
  espacoDoMes: { width: LADO },
  // Mais largo que a coluna de propósito: o nome do mês passa por cima das vizinhas.
  mes: { position: 'absolute', width: 40, fontSize: 10, color: cores.textoSecundario },
  semanas: { flexDirection: 'row', gap: VAO },
  semana: { gap: VAO },
  dia: { width: LADO, height: LADO, borderRadius: 3, backgroundColor: cores.divisoria },
  faltou: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: cores.desce },
  hoje: { borderWidth: 1.5, borderColor: cores.textoSecundario },
  futuro: { backgroundColor: 'transparent' },
  legenda: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  escala: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' },
  amostra: { width: 12, height: 12, borderRadius: 3 },
  textoDaLegenda: { fontSize: 12, color: cores.textoSecundario, marginRight: 3 },
  cartaoDosMeses: { padding: 18, gap: 14 },
  barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: ALTURA_DAS_BARRAS + 20 },
  colunaDoMes: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barra: { alignSelf: 'stretch', borderRadius: 4, backgroundColor: cores.primariaSuave },
  barraDoMelhorMes: { backgroundColor: cores.primaria },
  letraDoMes: { fontSize: 10, color: cores.textoSecundario },
  fraseDoMes: { fontSize: 14, color: cores.textoSecundario },
});
