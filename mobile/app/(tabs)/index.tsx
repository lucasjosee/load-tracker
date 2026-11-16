import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { CartaoExercicio } from '@/components/CartaoExercicio';
import { estilosComuns, Tela } from '@/components/Tela';
import { cores, raio } from '@/components/tema';
import { carregarHoje, type Hoje, type ItemDoTreino } from '@/db/consultas';
import { desfazerRegistro, fazerCheckin, finalizarTreino } from '@/db/operacoes';
import { paraDataLocal } from '@/domain/datas';
import { avisoDeTreinoPerdidoVisivel, type TreinoIdentificado } from '@/domain/hoje';
import {
  textoDoDia,
  textoProximoTreino,
  textoResumoDaSemana,
  textoResumoDaSessao,
  textoTreinoPerdido,
} from '@/domain/textos';
import type { Realizado } from '@/domain/tipos';
import { useAoVoltarParaFrente, useGravacao } from '@/hooks/gravacao';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

export default function TelaHoje() {
  const db = useSQLiteContext();
  const [hoje, setHoje] = useState<{ data: string; conteudo: Hoje } | null>(null);
  // Treino escolhido na hora pelo "Fazer hoje?" (§3.5); null = o normal do
  // dia. Guarda a data junto para a escolha não valer no dia seguinte, se o
  // app ficar aberto de um dia para o outro.
  const [escolhido, setEscolhido] = useState<{ data: string; treinoId: string } | null>(null);
  // O dia em que a pessoa tocou "Agora não" no aviso de treino perdido: a
  // dispensa vale só naquele dia, não até o app ser encerrado.
  const [avisoDispensadoEm, setAvisoDispensadoEm] = useState<string | null>(null);
  // Trava contra toque duplo, com aviso se a gravação falhar.
  const gravarComTrava = useGravacao();

  const carregar = useCallback(async () => {
    // A data é lida a cada carga: se o app ficou aberto de um dia para o
    // outro, voltar para a aba já mostra o treino do dia novo.
    const data = paraDataLocal(new Date());
    const treinoEscolhido = escolhido?.data === data ? escolhido.treinoId : null;
    setHoje({ data, conteudo: await carregarHoje(db, data, treinoEscolhido) });
  }, [db, escolhido]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // Sem isto, abrir o app no dia seguinte (ele costuma ficar em segundo plano)
  // mostraria o treino de ontem, e o check-in iria para a data de ontem.
  useAoVoltarParaFrente(carregar);

  const gravar = (acao: () => Promise<void>) =>
    gravarComTrava(async () => {
      await acao();
      await carregar(); // o cartão mostra na hora o que foi feito e a meta nova
    });

  if (hoje === null) {
    return <Tela titulo="Hoje">{null}</Tela>;
  }
  const { data, conteudo } = hoje;

  const aviso =
    conteudo.perdido !== null && avisoDeTreinoPerdidoVisivel(avisoDispensadoEm, data) ? (
      <AvisoTreinoPerdido
        treino={conteudo.perdido}
        onFazer={(treinoId) => setEscolhido({ data, treinoId })}
        onDispensar={() => setAvisoDispensadoEm(data)}
      />
    ) : null;

  if (conteudo.tipo === 'descanso') {
    return (
      <Tela titulo="Hoje">
        <Text style={estilosComuns.textoSecundario}>{textoDoDia(data)}</Text>
        {aviso}
        <Text style={styles.descanso}>Descanso</Text>
        {conteudo.proximo !== null && (
          <Text style={styles.proximo}>Próximo treino · {textoProximoTreino(conteudo.proximo)}</Text>
        )}
        <Text style={estilosComuns.textoSecundario}>
          {textoResumoDaSemana(conteudo.treinosNaSemana, conteudo.seriesNaSemana)}
        </Text>
        <Botao titulo="+ Registro rápido" variante="secundario" onPress={() => router.push('/registro')} />
      </Tela>
    );
  }

  const { treino, sessao, treinoDoDia } = conteudo;

  const checkin = (item: ItemDoTreino, realizado: Realizado) =>
    gravar(() => fazerCheckin(db, item.exercicio, realizado, treino.id, data));

  const desfazer = (item: ItemDoTreino) =>
    gravar(async () => {
      if (item.feitoHoje !== null) {
        await desfazerRegistro(db, item.exercicio, item.feitoHoje.id);
      }
    });

  const finalizar = () =>
    gravar(async () => {
      if (sessao === null) {
        return;
      }
      await finalizarTreino(db, sessao.id);
      // Reagendar com o treino finalizado já tira o lembrete das 21h de hoje
      // e atualiza os textos dos próximos dias com as metas novas (§6).
      await reagendarNotificacoes(db);
      Alert.alert('Treino finalizado', textoResumoDaSessao(conteudo.tiposDaSessao));
    });

  return (
    <Tela titulo={treino.nome}>
      <View style={styles.cabecalho}>
        <Text style={estilosComuns.textoSecundario}>{textoDoDia(data)}</Text>
        <Botao
          titulo="+ Registro rápido"
          variante="secundario"
          compacto
          onPress={() => router.push({ pathname: '/registro', params: { treinoId: treino.id } })}
        />
      </View>
      {aviso}
      {treinoDoDia !== null && (
        // A aba está em outro treino (ex.: o perdido de ontem): o do dia fica a um toque.
        <Botao
          titulo={`Ir para ${treinoDoDia.nome} (treino de hoje)`}
          variante="secundario"
          compacto
          onPress={() => setEscolhido({ data, treinoId: treinoDoDia.id })}
        />
      )}
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

      {sessao !== null && sessao.finalizadaEm !== null ? (
        <Text style={styles.finalizado}>Treino finalizado · {textoResumoDaSessao(conteudo.tiposDaSessao)}</Text>
      ) : (
        conteudo.itens.length > 0 && (
          // Sem nenhum check-in ainda não existe sessão para finalizar.
          <Botao titulo="Finalizar treino" desabilitado={sessao === null} onPress={finalizar} />
        )
      )}
    </Tela>
  );
}

interface AvisoProps {
  treino: TreinoIdentificado;
  onFazer: (treinoId: string) => void;
  onDispensar: () => void;
}

function AvisoTreinoPerdido({ treino, onFazer, onDispensar }: AvisoProps) {
  return (
    <View style={styles.aviso}>
      <Text style={styles.textoAviso}>{textoTreinoPerdido(treino.nome)}</Text>
      <View style={styles.botoesAviso}>
        <Botao titulo={`Fazer ${treino.nome}`} compacto onPress={() => onFazer(treino.id)} />
        <Botao titulo="Agora não" variante="secundario" compacto onPress={onDispensar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  descanso: { fontSize: 28, fontWeight: '700', marginTop: 16, color: cores.texto },
  proximo: { fontSize: 17, color: cores.texto },
  finalizado: { fontSize: 16, color: cores.sobe, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  aviso: { backgroundColor: cores.aviso, borderRadius: raio, padding: 16, gap: 10 },
  textoAviso: { fontSize: 16, color: cores.texto },
  botoesAviso: { flexDirection: 'row', gap: 8 },
});
