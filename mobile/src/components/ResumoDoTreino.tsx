import { StyleSheet, Text, View } from 'react-native';

import type { ResumoDaSessao } from '@/domain/hoje';

import { estilosComuns } from './Tela';
import { cores } from './tema';

// O que aparece no lugar do botão "Finalizar treino" (§3.2): os números da
// sessão em destaque. Só entram as contagens que não são zero, menos as
// progressões, que aparecem sempre: é o número que importa.
interface Props {
  resumo: ResumoDaSessao;
  recordes: number; // exercícios em que a carga de hoje foi a maior do histórico (§7)
}

export function ResumoDoTreino({ resumo, recordes }: Props) {
  const numeros = [
    { valor: resumo.progressoes, rotulo: resumo.progressoes === 1 ? 'progressão' : 'progressões', cor: cores.sobe, sempre: true },
    { valor: resumo.mantidos, rotulo: resumo.mantidos === 1 ? 'mantido' : 'mantidos', cor: cores.texto, sempre: false },
    { valor: resumo.deloads, rotulo: resumo.deloads === 1 ? 'deload' : 'deloads', cor: cores.desce, sempre: false },
    { valor: resumo.pulados, rotulo: resumo.pulados === 1 ? 'pulado' : 'pulados', cor: cores.textoSecundario, sempre: false },
  ].filter((numero) => numero.sempre || numero.valor > 0);

  return (
    <View style={[estilosComuns.cartao, styles.cartao]}>
      <Text style={styles.titulo}>Treino finalizado</Text>
      <View style={styles.numeros}>
        {numeros.map((numero) => (
          <View key={numero.rotulo} style={styles.numero}>
            <Text style={[styles.valor, { color: numero.cor }]}>{numero.valor}</Text>
            <Text style={styles.rotulo}>{numero.rotulo}</Text>
          </View>
        ))}
      </View>
      {recordes > 0 && (
        <Text style={[styles.destaque, styles.recorde]}>
          {recordes === 1 ? '1 recorde de carga hoje.' : `${recordes} recordes de carga hoje.`}
        </Text>
      )}
      {resumo.aumentosDeCarga > 0 && (
        <Text style={styles.destaque}>
          {resumo.aumentosDeCarga === 1
            ? '1 exercício sobe de carga na próxima vez.'
            : `${resumo.aumentosDeCarga} exercícios sobem de carga na próxima vez.`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: 18, gap: 14 },
  titulo: { fontSize: 13, fontWeight: '600', color: cores.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.5 },
  numeros: { flexDirection: 'row', gap: 24 },
  numero: { gap: 2 },
  valor: { fontSize: 40, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  rotulo: { fontSize: 14, color: cores.textoSecundario },
  destaque: { fontSize: 15, color: cores.texto },
  recorde: { color: cores.sobe, fontWeight: '700' },
});
