import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
import { cores, fonte } from './tema';
import { Texto } from './Texto';

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
// sozinho na linha, para ser lido de relance num lugar de luz ruim. Ela e a
// régua ficam no único painel em relevo; o resto fica direto no fundo.
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
      <View style={styles.topo}>
        <Pressable accessibilityRole="link" accessibilityHint="Abre o histórico do exercício" onPress={onAbrir} style={styles.areaDoNome}>
          <Texto style={styles.nome}>{exercicio.nome}</Texto>
        </Pressable>
        <View style={styles.selos}>
          {estagnacao !== null && <Selo selo={{ texto: '⚠ estagnado', direcao: 'desce' }} />}
          {estado !== null && <Selo selo={seloDaMeta(mudanca)} />}
        </View>
      </View>

      {/* A nota é o lembrete que a pessoa escreveu para a hora do exercício
          ("banco no furo 4"); só existe se ela escreveu. */}
      {exercicio.nota !== null && (
        // Contornada, como a plaquinha de ajuste de uma máquina.
        <View style={styles.etiqueta}>
          <Texto style={styles.textoDaEtiqueta}>{exercicio.nota}</Texto>
        </View>
      )}

      {estado === null ? (
        <Texto style={[estilosComuns.textoSecundario, styles.semMeta]}>Sem meta ainda: registre pelo Ajustar.</Texto>
      ) : (
        <>
          <View style={[estilosComuns.cartao, styles.painelDaMeta]}>
            {/* A meta nunca divide a linha com outro texto: "22,5 kg × 12" já
                ocupa quase toda a largura e, se não couber, a linha encolhe
                inteira (`adjustsFontSizeToFit`), com as partes pequenas junto.
                Os dois números são o que se lê de relance; "kg" e "×" ficam
                menores e em cinza. */}
            <Texto
              style={styles.meta}
              numberOfLines={1}
              adjustsFontSizeToFit
              accessibilityLabel={textoMeta(estado, exercicio.porLado)}
            >
              {estado.cargaKg === 0 ? (
                <>
                  {estado.repsAlvo}
                  <Texto style={styles.unidade}> reps</Texto>
                </>
              ) : (
                <>
                  {formatarKg(estado.cargaKg)}
                  <Texto style={styles.unidade}> kg </Texto>
                  <Texto style={styles.vezes}>× </Texto>
                  {estado.repsAlvo}
                </>
              )}
            </Texto>
            <Texto style={styles.detalheDaMeta}>
              {exercicio.porLado && estado.cargaKg > 0 && (
                <>
                  <Texto style={styles.lado}>por lado</Texto>,{' '}
                </>
              )}
              {textoSeries(exercicio.seriesAlvo)}
            </Texto>
            {regua !== null && (
              <>
                <View style={styles.sulco} />
                <ReguaDeReps regua={regua} recuo={mudanca?.tipo === 'deload'} />
              </>
            )}
          </View>
          <Texto style={styles.motivo}>{motivoDaMeta(estado, mudanca, config, exercicio.porLado)}</Texto>
          {/* Aqui há espaço para a última sessão ficar sempre à vista, sem abrir o Ajustar. */}
          {ultimaSessao !== null && !ajustando && (
            <Texto style={styles.motivo}>{textoUltimaVez(ultimaSessao, exercicio.porLado)}</Texto>
          )}
          {estagnacao !== null && (
            // O alerta não muda a meta: quem decide é o motor (regra 2). Só avisa.
            <Texto style={styles.alerta}>{textoEstagnacao(exercicio.nome, estagnacao)}</Texto>
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
            <Texto style={styles.textoNaoVouFazer}>Não vou fazer hoje</Texto>
          </Pressable>
        </View>
      )}
      <CronometroDeDescanso duracaoS={descansoS} />
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  areaDoNome: { flexShrink: 1 },
  nome: { fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3, color: cores.texto },
  selos: { flexDirection: 'row', gap: 4, marginTop: 4 },
  etiqueta: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  textoDaEtiqueta: { fontSize: 15, fontWeight: '500', color: cores.textoSecundario },
  semMeta: { marginTop: 16 },
  painelDaMeta: { marginTop: 16, gap: 0 },
  // A linha bem mais baixa que o natural da Saira (1,57 vez o tamanho): os
  // algarismos ficam no meio dela, sem a sobra de espaço em cima e embaixo.
  meta: {
    fontFamily: fonte.larga,
    fontSize: 80,
    lineHeight: 76,
    fontWeight: '800',
    letterSpacing: -2,
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  unidade: { fontSize: 28, fontWeight: '600', letterSpacing: 0, color: cores.textoSecundario },
  vezes: { fontSize: 34, fontWeight: '400', letterSpacing: 0, color: cores.textoSecundario },
  detalheDaMeta: { fontSize: 17, fontWeight: '500', color: cores.textoSecundario },
  lado: { fontWeight: '700', color: cores.texto },
  // Divisória cavada entre a meta e a régua: escura em cima, com luz embaixo.
  sulco: {
    height: 2,
    marginTop: 14,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: cores.sulco,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  motivo: { fontSize: 15, lineHeight: 21, color: cores.textoSecundario, marginTop: 12 },
  alerta: { fontSize: 15, lineHeight: 21, color: cores.desce, marginTop: 4 },
  botoes: { gap: 8, marginTop: 20 },
  linhaDeBotoes: { flexDirection: 'row', gap: 8 },
  naoVouFazer: { alignSelf: 'center', paddingVertical: 8 },
  textoNaoVouFazer: { fontSize: 14, fontWeight: '600', color: cores.textoSecundario },
});
