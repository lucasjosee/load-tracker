import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BarraDeProgresso } from '@/components/BarraDeProgresso';
import { Botao } from '@/components/Botao';
import { CartaoDeEvolucao } from '@/components/CartaoDeEvolucao';
import { LinhaDoExercicio } from '@/components/LinhaDoExercicio';
import { FaixaDaSemana } from '@/components/FaixaDaSemana';
import { ResumoDoTreino } from '@/components/ResumoDoTreino';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores, raio } from '@/components/tema';
import { carregarHoje, type Hoje, type ItemDoTreino } from '@/db/consultas';
import { desfazerRegistro, iniciarTreino } from '@/db/operacoes';
import { paraDataLocal } from '@/domain/datas';
import { segundosDeTreino } from '@/domain/duracao';
import { avisoDeTreinoPerdidoVisivel, type TreinoIdentificado } from '@/domain/hoje';
import {
  textoDoBotaoDeTreino,
  textoDoDia,
  textoPeriodoDaEvolucao,
  textoProximoTreino,
  textoResumoDaSemana,
  textoTreinoPerdido,
} from '@/domain/textos';
import { useAoVoltarParaFrente, useGravacao } from '@/hooks/gravacao';

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
      await carregar(); // a lista mostra na hora o que mudou
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
          <View style={estilosComuns.cartao}>
            <Text style={styles.rotuloDoProximo}>Próximo treino</Text>
            <Text style={styles.proximo}>{textoProximoTreino(conteudo.proximo)}</Text>
          </View>
        )}
        {/* No descanso não há cartões de exercício, então a evolução geral
            ganha o espaço: gráfico grande, um ponto por semana. */}
        <CartaoDeEvolucao
          grande
          rotulo="Força geral"
          periodo={textoPeriodoDaEvolucao(conteudo.evolucao.length, 'semana')}
          pontos={conteudo.evolucao}
        />
        <View style={[estilosComuns.cartao, styles.semana]}>
          <FaixaDaSemana dias={conteudo.semana} />
          <Text style={estilosComuns.textoSecundario}>
            {textoResumoDaSemana(conteudo.treinosNaSemana, conteudo.seriesNaSemana)}
          </Text>
        </View>
        <Botao titulo="+ Registro rápido" variante="secundario" onPress={() => router.push('/registro')} />
      </Tela>
    );
  }

  const { treino, sessao, treinoDoDia, itens } = conteudo;
  const feitos = itens.filter((item) => item.feitoHoje !== null).length;
  const finalizado = sessao !== null && sessao.finalizadaEm !== null;

  // A sessão nasce aqui, no toque: é dela que o tempo de treino conta.
  const abrirTreino = () =>
    gravar(async () => {
      await iniciarTreino(db, treino.id, data);
      router.push({ pathname: '/sessao', params: { treinoId: treino.id } });
    });

  const desfazer = (item: ItemDoTreino) =>
    gravar(async () => {
      if (item.feitoHoje !== null) {
        await desfazerRegistro(db, item.exercicio, item.feitoHoje.id);
      }
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
      {itens.length > 0 && (
        <CartaoDeEvolucao
          rotulo={`Força no ${treino.nome}`}
          periodo={textoPeriodoDaEvolucao(conteudo.evolucao.length, 'sessao')}
          pontos={conteudo.evolucao}
        />
      )}
      {itens.length === 0 && (
        <Text style={estilosComuns.textoSecundario}>Este treino não tem exercícios. Adicione na aba Divisão.</Text>
      )}

      {sessao !== null && sessao.finalizadaEm !== null && (
        <ResumoDoTreino
          compacto
          itens={itens}
          tipos={conteudo.tiposDaSessao}
          duracaoS={segundosDeTreino(sessao.iniciadaEm, new Date(sessao.finalizadaEm).getTime())}
        />
      )}
      {/* O treino acontece na tela cheia (app/sessao.tsx); aqui fica só a
          porta de entrada. Com tudo feito não há o que abrir. */}
      {feitos < itens.length && (
        <Botao
          titulo={textoDoBotaoDeTreino(sessao !== null, finalizado)}
          variante={finalizado ? 'secundario' : 'primario'}
          onPress={abrirTreino}
        />
      )}

      {/* A lista continua depois de encerrar: é onde dá para desfazer um registro. */}
      {itens.length > 0 && (
        <Secao titulo="Exercícios de hoje">
          <BarraDeProgresso feitos={itens.map((item) => item.feitoHoje !== null)} />
          {itens.map((item) => (
            <LinhaDoExercicio
              key={item.exercicio.id}
              item={item}
              onAbrir={() => router.push({ pathname: '/exercicio/[id]', params: { id: item.exercicio.id } })}
              onDesfazer={() => desfazer(item)}
            />
          ))}
        </Secao>
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
  descanso: { fontSize: 40, fontWeight: '800', letterSpacing: -1, marginTop: 8, color: cores.texto },
  rotuloDoProximo: { fontSize: 13, fontWeight: '600', color: cores.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.5 },
  proximo: { fontSize: 22, fontWeight: '700', color: cores.texto },
  semana: { padding: 18, gap: 16 },
  aviso: { backgroundColor: cores.aviso, borderRadius: raio, padding: 16, gap: 10 },
  textoAviso: { fontSize: 16, color: cores.texto },
  botoesAviso: { flexDirection: 'row', gap: 8 },
});
