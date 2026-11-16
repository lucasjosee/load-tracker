import { StyleSheet, Text, View } from 'react-native';

import { LETRAS_DOS_DIAS, NOMES_DOS_DIAS } from '@/domain/datas';
import type { DiaDaFaixa, SituacaoDoDia } from '@/domain/hoje';

import { cores } from './tema';

const DESCRICAO: Record<SituacaoDoDia, string> = {
  treinado: 'treinou',
  perdido: 'treino não registrado',
  planejado: 'dia de treino',
  descanso: 'descanso',
};

// A semana de segunda a domingo (§3.4): um círculo por dia. Cheio = treinou;
// contorno = dia de treino que ainda vem; traço = treino que passou sem
// registro; ponto = descanso.
export function FaixaDaSemana({ dias }: { dias: readonly DiaDaFaixa[] }) {
  return (
    <View style={styles.faixa}>
      {dias.map((dia) => (
        <View
          key={dia.data}
          style={styles.dia}
          accessible
          accessibilityLabel={`${NOMES_DOS_DIAS[dia.diaSemana]}${dia.ehHoje ? ', hoje' : ''}: ${DESCRICAO[dia.situacao]}`}
        >
          <Text style={[styles.letra, dia.ehHoje && styles.letraDeHoje]}>{LETRAS_DOS_DIAS[dia.diaSemana]}</Text>
          <View style={[styles.circulo, styles[dia.situacao]]}>
            {dia.situacao === 'treinado' && <Text style={styles.feito}>✓</Text>}
            {dia.situacao === 'perdido' && <Text style={styles.traco}>–</Text>}
            {dia.situacao === 'descanso' && <View style={styles.ponto} />}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: { flexDirection: 'row', justifyContent: 'space-between' },
  dia: { alignItems: 'center', gap: 8 },
  letra: { fontSize: 13, fontWeight: '600', color: cores.textoSecundario },
  letraDeHoje: { color: cores.texto, fontWeight: '800' },
  circulo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  treinado: { backgroundColor: cores.primaria },
  perdido: { backgroundColor: cores.superficieAlta },
  planejado: { borderWidth: 2, borderColor: cores.borda },
  descanso: {},
  feito: { fontSize: 16, fontWeight: '800', color: cores.textoSobrePrimaria },
  traco: { fontSize: 16, fontWeight: '800', color: cores.textoSecundario },
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: cores.borda },
});
