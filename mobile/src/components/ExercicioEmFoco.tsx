import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { ItemDoTreino } from '@/db/consultas';
import { configDoExercicio } from '@/db/operacoes';
import { reguaDeReps } from '@/domain/regua';
import {
  formatarKg,
  motivoDaMeta,
  seloDaMeta,
  textoEstagnacao,
  textoMeta,
  textoSeries,
  textoUltimaVez,
} from '@/domain/textos';
import type { Realizado } from '@/domain/tipos';

import { Botao } from './Botao';
import { CronometroDeDescanso } from './CronometroDeDescanso';
import { PainelAjuste } from './PainelAjuste';
import { ReguaDeReps } from './ReguaDeReps';
import { Selo } from './Selo';
import { estilosComuns } from './Tela';
import { cores } from './tema';

interface Props {
  item: ItemDoTreino;
  onCheckin: (realizado: Realizado) => void;
  // "Depois": manda o exercício para o fim da fila. null quando ele é o
  // único que falta, e adiar não mudaria nada.
  onAdiar: (() => void) | null;
  onAbrir: () => void; // toque no nome: detalhe do exercício (histórico e gráficos)
  descansoS: number; // duração do cronômetro de descanso
}

// O exercício da vez, na tela do treino (§3.2): um só, grande, com tudo o que
// a pessoa precisa entre uma série e outra. A meta é o herói: número enorme,
// sozinho na linha, para ser lido de relance num lugar de luz ruim. Nome,
// nota, meta e régua ficam num painel de vidro; o motivo, os botões e o
// descanso ficam direto no fundo, embaixo dele.
export function ExercicioEmFoco({ item, onCheckin, onAdiar, onAbrir, descansoS }: Props) {
  const { exercicio, estado, mudanca, estagnacao, ultimaSessao } = item;
  const [ajustando, setAjustando] = useState(false);

  const config = configDoExercicio(exercicio);
  const regua = estado === null ? null : reguaDeReps(estado, config);

  function bati() {
    if (estado === null) {
      return;
    }
    // A vibração responde ao toque na hora, antes de o banco gravar.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 1 toque: todas as séries com a meta (§3.2).
    onCheckin({ cargaKg: estado.cargaKg, reps: Array.from({ length: exercicio.seriesAlvo }, () => estado.repsAlvo) });
  }

  function salvarAjuste(cargaKg: number, reps: number[]) {
    setAjustando(false);
    onCheckin({ cargaKg, reps });
  }

  return (
    <View>
      <View style={[estilosComuns.cartao, styles.painel]}>
        <View style={styles.topo}>
          <Pressable accessibilityRole="link" accessibilityHint="Abre o histórico do exercício" onPress={onAbrir} style={styles.areaDoNome}>
            <Text style={styles.nome}>{exercicio.nome}</Text>
          </Pressable>
          <View style={styles.selos}>
            {estagnacao !== null && <Selo selo={{ texto: '⚠ estagnado', direcao: 'desce' }} />}
            {estado !== null && <Selo selo={seloDaMeta(mudanca)} />}
          </View>
        </View>

        {/* A nota é o lembrete que a pessoa escreveu para a hora do exercício
            ("banco no furo 4"); só existe se ela escreveu. */}
        {exercicio.nota !== null && (
          <View style={styles.nota}>
            <Alfinete />
            <Text style={styles.textoDaNota}>{exercicio.nota}</Text>
          </View>
        )}

        {estado === null ? (
          <Text style={[estilosComuns.textoSecundario, styles.semMeta]}>Sem meta ainda: registre pelo Ajustar.</Text>
        ) : (
          <>
            {/* A meta nunca divide a linha com outro texto: "22,5 kg × 12" já
                ocupa quase toda a largura e, se não couber, a linha encolhe
                inteira (`adjustsFontSizeToFit`), com as partes pequenas junto.
                Os dois números são o que se lê de relance; "kg" e "×" ficam
                menores e em cinza. */}
            <Text
              style={styles.meta}
              numberOfLines={1}
              adjustsFontSizeToFit
              accessibilityLabel={textoMeta(estado, exercicio.porLado)}
            >
              {estado.cargaKg === 0 ? (
                <>
                  {estado.repsAlvo}
                  <Text style={styles.unidade}> reps</Text>
                </>
              ) : (
                <>
                  {formatarKg(estado.cargaKg)}
                  <Text style={styles.unidade}> kg </Text>
                  <Text style={styles.vezes}>× </Text>
                  {estado.repsAlvo}
                </>
              )}
            </Text>
            <Text style={styles.detalheDaMeta}>
              {exercicio.porLado && estado.cargaKg > 0 && (
                <>
                  <Text style={styles.lado}>por lado</Text>,{' '}
                </>
              )}
              {textoSeries(exercicio.seriesAlvo)}
            </Text>
            {regua !== null && (
              <View style={styles.regua}>
                <ReguaDeReps regua={regua} recuo={mudanca?.tipo === 'deload'} />
              </View>
            )}
          </>
        )}
      </View>

      {estado !== null && (
        <>
          <Text style={styles.motivo}>{motivoDaMeta(estado, mudanca, config, exercicio.porLado)}</Text>
          {/* Aqui há espaço para a última sessão ficar sempre à vista, sem abrir o Ajustar. */}
          {ultimaSessao !== null && !ajustando && (
            <Text style={styles.ultimaVez}>{textoUltimaVez(ultimaSessao, exercicio.porLado)}</Text>
          )}
          {estagnacao !== null && (
            // O alerta não muda a meta: quem decide é o motor (regra 2). Só avisa.
            <Text style={styles.alerta}>{textoEstagnacao(exercicio.nome, estagnacao)}</Text>
          )}
        </>
      )}

      {ajustando ? (
        <PainelAjuste
          cargaInicial={estado?.cargaKg ?? 0}
          repsIniciais={Array.from({ length: exercicio.seriesAlvo }, () => estado?.repsAlvo ?? exercicio.repsMin)}
          passoKg={exercicio.incrementoKg > 0 ? exercicio.incrementoKg : 1}
          porLado={exercicio.porLado}
          ultimaVez={ultimaSessao === null ? null : textoUltimaVez(ultimaSessao, exercicio.porLado)}
          onSalvar={salvarAjuste}
          onCancelar={() => setAjustando(false)}
        />
      ) : (
        <View style={styles.botoes}>
          {/* "Bati" é o caso comum (§13: menos de 5 segundos), então é o maior alvo. */}
          <Botao titulo="Bati a meta" desabilitado={estado === null} onPress={bati} />
          <View style={styles.linhaDeBotoes}>
            <Botao titulo="Ajustar" variante="secundario" peso={1} onPress={() => setAjustando(true)} />
            <Botao titulo="Depois" variante="secundario" peso={1} desabilitado={onAdiar === null} onPress={() => onAdiar?.()} />
          </View>
          {/* Menos destacado de propósito: registra o exercício como pulado e ele não volta hoje. */}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: estado === null }}
            disabled={estado === null}
            onPress={() => onCheckin('PULOU')}
            hitSlop={8}
            style={styles.naoVouFazer}
          >
            <Text style={styles.textoNaoVouFazer}>Não vou fazer hoje</Text>
          </Pressable>
        </View>
      )}
      <CronometroDeDescanso duracaoS={descansoS} />
    </View>
  );
}

// O alfinete da nota, no traço dos ícones do sistema.
function Alfinete() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={cores.textoSecundario} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <Circle cx={12} cy={9.5} r={2.5} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  painel: { padding: 20, borderRadius: 28, gap: 0 },
  topo: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  areaDoNome: { flexShrink: 1 },
  nome: { fontSize: 22, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4, color: cores.texto },
  selos: { flexDirection: 'row', gap: 4, marginTop: 2 },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  textoDaNota: { flexShrink: 1, fontSize: 15, color: cores.textoSecundario },
  semMeta: { marginTop: 16 },
  // A linha um pouco mais alta que a letra: os algarismos ocupam só uns dois
  // terços dela, e a altura natural da fonte deixaria espaço sobrando.
  meta: {
    marginTop: 18,
    fontSize: 84,
    lineHeight: 88,
    fontWeight: '700',
    letterSpacing: -3,
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  unidade: { fontSize: 26, fontWeight: '600', letterSpacing: 0, color: cores.textoSecundario },
  vezes: { fontSize: 32, fontWeight: '400', letterSpacing: 0, color: cores.textoSecundario },
  detalheDaMeta: { marginTop: 2, fontSize: 17, color: cores.textoSecundario },
  lado: { fontWeight: '600', color: cores.texto },
  regua: { marginTop: 22 },
  motivo: { marginTop: 16, marginHorizontal: 4, fontSize: 17, lineHeight: 23, fontWeight: '500', color: cores.texto },
  ultimaVez: { marginTop: 2, marginHorizontal: 4, fontSize: 15, lineHeight: 20, color: cores.textoSecundario, fontVariant: ['tabular-nums'] },
  alerta: { marginTop: 4, marginHorizontal: 4, fontSize: 15, lineHeight: 20, color: cores.desce },
  botoes: { gap: 8, marginTop: 16 },
  linhaDeBotoes: { flexDirection: 'row', gap: 8 },
  naoVouFazer: { alignSelf: 'center', paddingVertical: 10 },
  textoNaoVouFazer: { fontSize: 15, fontWeight: '600', color: cores.textoSecundario },
});
