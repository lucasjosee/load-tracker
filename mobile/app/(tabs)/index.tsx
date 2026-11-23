import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BarraDeProgresso } from '@/components/BarraDeProgresso';
import { Botao } from '@/components/Botao';
import { BotaoDeTreino, FOLGA_DO_BOTAO_DE_TREINO } from '@/components/BotaoDeTreino';
import { CartaoDeEvolucao } from '@/components/CartaoDeEvolucao';
import { LinhaDoExercicio } from '@/components/LinhaDoExercicio';
import { FaixaDaSemana } from '@/components/FaixaDaSemana';
import { ResumoDoTreino } from '@/components/ResumoDoTreino';
import { estilosComuns, ListaEmPainel, Secao, Tela } from '@/components/Tela';
import { cores, raio } from '@/components/tema';
import { carregarHoje, type Hoje, type ItemDoTreino } from '@/db/consultas';
import { desfazerRegistro, iniciarTreino } from '@/db/operacoes';
import { paraDataLocal } from '@/domain/datas';
import { segundosDeTreino, textoPrevisaoDoTreino } from '@/domain/duracao';
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
      <Tela>
        <Text style={estilosComuns.textoSecundario}>{textoDoDia(data)}</Text>
        <Text style={styles.tituloDoDia} accessibilityRole="header">
          Descanso
        </Text>
        {aviso}
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
  const pendentes = feitos < itens.length;
  const finalizado = sessao !== null && sessao.finalizadaEm !== null;

  // A sessão nasce aqui, no toque: é dela que o tempo de treino conta.
  const abrirTreino = () =>
    gravar(async () => {
      await iniciarTreino(db, treino.id, data);
      if (finalizado) {
        // Retomar reabre a sessão: o lembrete das 21h volta a valer (§6).
        await reagendarNotificacoes(db);
      }
      router.push({ pathname: '/sessao', params: { treinoId: treino.id } });
    });

  const desfazer = (item: ItemDoTreino) =>
    gravar(async () => {
      if (item.feitoHoje !== null) {
        await desfazerRegistro(db, item.exercicio, item.feitoHoje.id);
      }
    });

  return (
    <View style={styles.tela}>
      <Tela folgaNoFim={pendentes ? FOLGA_DO_BOTAO_DE_TREINO : 0}>
        {/* A data vem antes do nome, como numa ficha: o nome do treino é o
            título, grande e largo, e encolhe se não couber numa linha. */}
        <View style={styles.cabecalho}>
          <Text style={estilosComuns.textoSecundario}>{textoDoDia(data)}</Text>
          <Botao
            titulo="+ Registro rápido"
            variante="secundario"
            compacto
            onPress={() =>
              router.push({
                pathname: '/registro',
                params: { treinoId: treino.id },
              })
            }
          />
        </View>
        <Text style={styles.tituloDoDia} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>
          {treino.nome}
        </Text>
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
            duracaoS={segundosDeTreino(sessao, 0)}
          />
        )}
        {/* A lista continua depois de encerrar: é onde dá para desfazer um registro. */}
        {itens.length > 0 && (
          <Secao titulo="Exercícios de hoje">
            <BarraDeProgresso feitos={itens.map((item) => item.feitoHoje !== null)} />
            <ListaEmPainel>
              {itens.map((item) => (
                <LinhaDoExercicio
                  key={item.exercicio.id}
                  item={item}
                  onAbrir={() =>
                    router.push({
                      pathname: '/exercicio/[id]',
                      params: { id: item.exercicio.id },
                    })
                  }
                  onDesfazer={() => desfazer(item)}
                />
              ))}
            </ListaEmPainel>
          </Secao>
        )}
      </Tela>
      {/* O treino acontece em app/sessao.tsx; aqui fica a porta de entrada,
          presa no rodapé. Com tudo feito não há o que abrir. */}
      {pendentes && (
        <BotaoDeTreino
          titulo={textoDoBotaoDeTreino(sessao !== null, finalizado)}
          detalhe={
            sessao === null || finalizado
              ? textoPrevisaoDoTreino(itens.length, conteudo.duracaoTipicaS)
              : `${feitos} de ${itens.length} exercícios`
          }
          sessao={sessao !== null && !finalizado ? sessao : null}
          onPress={abrirTreino}
        />
      )}
    </View>
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
  tela: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  // O nome do treino (ou "Descanso") é o título da aba: o maior texto da
  // tela. A linha fica justa no tamanho da letra, como na meta.
  tituloDoDia: {
    fontSize: 64,
    lineHeight: 64,
    fontWeight: '800',
    letterSpacing: -1,
    color: cores.texto,
  },
  rotuloDoProximo: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proximo: { fontSize: 22, fontWeight: '700', color: cores.texto },
  semana: { padding: 18, gap: 16 },
  aviso: {
    backgroundColor: cores.aviso,
    borderRadius: raio,
    padding: 16,
    gap: 10,
  },
  textoAviso: { fontSize: 16, color: cores.texto },
  botoesAviso: { flexDirection: 'row', gap: 8 },
});
