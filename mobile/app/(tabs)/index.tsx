import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { CartaoExercicio } from '@/components/CartaoExercicio';
import { estilosComuns, Tela } from '@/components/Tela';
import { cores, raio } from '@/components/tema';
import { carregarHoje, type Hoje, type ItemDoTreino } from '@/db/consultas';
import { desfazerRegistro, fazerCheckin, finalizarTreino } from '@/db/operacoes';
import { paraDataLocal } from '@/domain/datas';
import type { TreinoIdentificado } from '@/domain/hoje';
import {
  textoDoDia,
  textoProximoTreino,
  textoResumoDaSemana,
  textoResumoDaSessao,
  textoTreinoPerdido,
} from '@/domain/textos';
import type { Realizado } from '@/domain/tipos';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

export default function TelaHoje() {
  const db = useSQLiteContext();
  const [hoje, setHoje] = useState<{ data: string; conteudo: Hoje } | null>(null);
  // Treino escolhido na hora pelo "Fazer hoje?" (§3.5); null = o normal do
  // dia. Guarda a data junto para a escolha não valer no dia seguinte, se o
  // app ficar aberto de um dia para o outro.
  const [escolhido, setEscolhido] = useState<{ data: string; treinoId: string } | null>(null);
  const [avisoDispensado, setAvisoDispensado] = useState(false);
  // Trava contra toque duplo: enquanto uma gravação não termina, outro toque
  // em "Bati" não grava o exercício de novo. useRef porque mudar a trava não
  // precisa redesenhar a tela.
  const gravando = useRef(false);

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

  async function gravar(acao: () => Promise<void>) {
    if (gravando.current) {
      return;
    }
    gravando.current = true;
    try {
      await acao();
      await carregar(); // o cartão mostra na hora o que foi feito e a meta nova
    } finally {
      gravando.current = false;
    }
  }

  if (hoje === null) {
    return <Tela titulo="Hoje">{null}</Tela>;
  }
  const { data, conteudo } = hoje;

  const aviso =
    conteudo.perdido !== null && !avisoDispensado ? (
      <AvisoTreinoPerdido
        treino={conteudo.perdido}
        onFazer={(treinoId) => setEscolhido({ data, treinoId })}
        onDispensar={() => setAvisoDispensado(true)}
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

  const { treino, sessao } = conteudo;

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
  descanso: { fontSize: 28, fontWeight: '700', marginTop: 16 },
  proximo: { fontSize: 17, color: cores.texto },
  finalizado: { fontSize: 16, color: cores.sobe, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  aviso: { backgroundColor: cores.aviso, borderRadius: raio, padding: 16, gap: 10 },
  textoAviso: { fontSize: 16, color: cores.texto },
  botoesAviso: { flexDirection: 'row', gap: 8 },
});
