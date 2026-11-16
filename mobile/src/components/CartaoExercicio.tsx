import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ItemDoTreino } from '@/db/consultas';
import { configDoExercicio } from '@/db/operacoes';
import { reguaDeReps } from '@/domain/regua';
import { motivoDaMeta, seloDaMeta, textoEstagnacao, textoMeta, textoRealizado, textoSeries } from '@/domain/textos';
import type { Realizado } from '@/domain/tipos';

import { Botao } from './Botao';
import { PainelAjuste } from './PainelAjuste';
import { ReguaDeReps } from './ReguaDeReps';
import { Selo } from './Selo';
import { estilosComuns } from './Tela';
import { cores } from './tema';

interface Props {
  item: ItemDoTreino;
  onCheckin: (realizado: Realizado) => void;
  onDesfazer: () => void;
  onAbrir: () => void; // toque no nome: detalhe do exercício (histórico e gráficos)
}

// Um exercício na aba Hoje (§3.2). A meta é o herói do cartão: número grande,
// sozinho na linha, para ser lido de relance entre uma série e outra. Depois
// do check-in o cartão encolhe para uma linha e sai do caminho.
export function CartaoExercicio({ item, onCheckin, onDesfazer, onAbrir }: Props) {
  const { exercicio, estado, mudanca, feitoHoje, estagnacao } = item;
  const [ajustando, setAjustando] = useState(false);

  if (feitoHoje !== null) {
    return (
      <CartaoFeito
        nome={exercicio.nome}
        resumo={
          feitoHoje.resultado === 'pulou'
            ? 'Pulado'
            : textoRealizado(feitoHoje.cargaKg, feitoHoje.reps, exercicio.porLado)
        }
        proxima={estado !== null && feitoHoje.resultado !== 'pulou' ? textoMeta(estado, exercicio.porLado) : null}
        pulado={feitoHoje.resultado === 'pulou'}
        onDesfazer={onDesfazer}
        onAbrir={onAbrir}
      />
    );
  }

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
    <View style={[estilosComuns.cartao, styles.cartao]}>
      <View style={styles.topo}>
        <Pressable accessibilityRole="link" accessibilityHint="Abre o histórico do exercício" onPress={onAbrir} style={styles.areaDoNome}>
          <Text style={styles.nome}>{exercicio.nome}</Text>
        </Pressable>
        <View style={styles.selos}>
          {estagnacao !== null && <Selo selo={{ texto: '⚠ estagnado', direcao: 'desce' }} />}
          {estado !== null && <Selo selo={seloDaMeta(mudanca)} />}
        </View>
      </View>

      {estado === null ? (
        <Text style={estilosComuns.textoSecundario}>Sem meta ainda: registre pelo Ajustar.</Text>
      ) : (
        <>
          {/* A meta nunca divide a linha com outro texto: "22,5 kg × 12" já
              ocupa quase toda a largura, e o que viesse ao lado quebraria. */}
          <Text style={styles.meta} numberOfLines={1} adjustsFontSizeToFit>
            {textoMeta(estado)}
          </Text>
          <Text style={styles.detalheDaMeta}>
            {exercicio.porLado && estado.cargaKg > 0 && <Text style={styles.lado}>lado · </Text>}
            {textoSeries(exercicio.seriesAlvo)}
          </Text>
          {regua !== null && (
            <View style={styles.regua}>
              <ReguaDeReps regua={regua} recuo={mudanca?.tipo === 'deload'} />
            </View>
          )}
          <Text style={styles.motivo}>{motivoDaMeta(estado, mudanca, config, exercicio.porLado)}</Text>
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
          onSalvar={salvarAjuste}
          onCancelar={() => setAjustando(false)}
        />
      ) : (
        <View style={styles.botoes}>
          {/* "Bati" é o caso comum (§13: menos de 5 segundos), então é o maior alvo. */}
          <Botao titulo="Bati" peso={2} desabilitado={estado === null} onPress={bati} />
          <Botao titulo="Ajustar" variante="secundario" peso={1} onPress={() => setAjustando(true)} />
          <Botao titulo="Pulei" variante="secundario" peso={1} desabilitado={estado === null} onPress={() => onCheckin('PULOU')} />
        </View>
      )}
    </View>
  );
}

interface FeitoProps {
  nome: string;
  resumo: string;
  proxima: string | null;
  pulado: boolean;
  onDesfazer: () => void;
  onAbrir: () => void;
}

// O cartão depois do check-in: uma linha só, com o que foi feito e a meta que
// o motor acabou de calcular para a próxima vez.
function CartaoFeito({ nome, resumo, proxima, pulado, onDesfazer, onAbrir }: FeitoProps) {
  return (
    <View style={[estilosComuns.cartao, styles.feito]}>
      <View style={[styles.marca, pulado && styles.marcaPulado]}>
        <Text style={[styles.simboloDaMarca, pulado && styles.simboloPulado]}>{pulado ? '–' : '✓'}</Text>
      </View>
      <Pressable accessibilityRole="link" accessibilityHint="Abre o histórico do exercício" onPress={onAbrir} style={styles.textosDoFeito}>
        <Text style={styles.nomeFeito} numberOfLines={1}>
          {nome}
        </Text>
        <Text style={styles.resumo}>{proxima === null ? resumo : `${resumo} · próxima: ${proxima}`}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onDesfazer} hitSlop={8} style={styles.desfazer}>
        <Text style={styles.textoDesfazer}>Desfazer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: 18, gap: 0 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  areaDoNome: { flexShrink: 1 },
  nome: { fontSize: 16, fontWeight: '600', color: cores.textoSecundario },
  selos: { flexDirection: 'row', gap: 4 },
  meta: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    color: cores.texto,
    fontVariant: ['tabular-nums'],
    marginTop: 8,
  },
  detalheDaMeta: { fontSize: 16, fontWeight: '500', color: cores.textoSecundario },
  lado: { fontWeight: '700', color: cores.texto },
  regua: { marginTop: 14 },
  motivo: { fontSize: 14, lineHeight: 20, color: cores.textoSecundario, marginTop: 12 },
  alerta: { fontSize: 14, lineHeight: 20, color: cores.desce, marginTop: 4 },
  botoes: { flexDirection: 'row', gap: 8, marginTop: 16 },

  feito: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  marca: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaPulado: { backgroundColor: cores.superficieAlta },
  simboloDaMarca: { fontSize: 15, fontWeight: '800', color: cores.textoSobrePrimaria },
  simboloPulado: { color: cores.textoSecundario },
  textosDoFeito: { flex: 1, gap: 2 },
  nomeFeito: { fontSize: 16, fontWeight: '600', color: cores.texto },
  resumo: { fontSize: 14, lineHeight: 20, color: cores.textoSecundario },
  desfazer: { paddingVertical: 10, paddingHorizontal: 4 },
  textoDesfazer: { fontSize: 14, fontWeight: '600', color: cores.textoSecundario },
});
