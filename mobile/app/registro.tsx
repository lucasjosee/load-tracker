import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';

import { apiConfigurada, interpretarTexto, mensagemDaFalha } from '@/api/cliente';
import { LIMITE_DO_TEXTO } from '@/api/contrato';
import { Botao } from '@/components/Botao';
import { EditorDeItem } from '@/components/EditorDeItem';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores, raio } from '@/components/tema';
import { registrarItens } from '@/db/operacoes';
import { listarExercicios, type Exercicio } from '@/db/repositorios/exercicios';
import { paraDataLocal } from '@/domain/datas';
import { itemEmBranco, itensDaSugestao, validarItens, type ItemEmEdicao } from '@/domain/registroRapido';
import { reagendarNotificacoes } from '@/notificacoes/agendar';

// Registro rápido (§3.3): texto livre → IA → confirmação editável → motor.
// Sem internet, ou se a IA falhar, a mesma confirmação vira o formulário
// manual: a jornada nunca depende da IA (regra 5).
export default function TelaRegistro() {
  const db = useSQLiteContext();
  // O treino que a aba Hoje está mostrando; vazio em dia de descanso.
  const { treinoId } = useLocalSearchParams<{ treinoId?: string }>();
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [texto, setTexto] = useState('');
  const [itens, setItens] = useState<ItemEmEdicao[] | null>(null); // null = ainda no texto
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [interpretando, setInterpretando] = useState(false);
  const proximaChave = useRef(0);

  useEffect(() => {
    listarExercicios(db).then((todos) => setExercicios(todos.filter((e) => e.ativo)));
  }, [db]);

  function novoItem(): ItemEmEdicao {
    proximaChave.current += 1;
    return itemEmBranco(`manual-${proximaChave.current}`);
  }

  function preencherManualmente(motivo: string | null) {
    setAviso(motivo);
    setItens([novoItem()]);
  }

  async function interpretar() {
    setInterpretando(true);
    const resposta = await interpretarTexto({
      texto,
      exercicios: exercicios.map((e) => ({ id: e.id, nome: e.nome })),
    });
    setInterpretando(false);
    if (!resposta.ok) {
      preencherManualmente(mensagemDaFalha(resposta.falha));
      return;
    }
    const { itens: sugeridos, naoEntendido } = resposta.valor;
    if (sugeridos.length === 0) {
      preencherManualmente('Não achei nenhum exercício no texto. Preencha manualmente.');
      return;
    }
    setAviso(naoEntendido.length > 0 ? `Não entendi: ${naoEntendido.join('; ')}` : null);
    setItens(itensDaSugestao(sugeridos));
  }

  async function salvar() {
    if (itens === null) {
      return;
    }
    const validacao = validarItens(itens);
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }
    await registrarItens(db, validacao.valor, paraDataLocal(new Date()), treinoId || null);
    await reagendarNotificacoes(db); // as metas mudaram: os avisos da semana também
    router.back();
  }

  if (itens === null) {
    return (
      <Tela>
        <Secao titulo="O que você fez?">
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="supino inclinado 10kg 8,8,7 e crucifixo 14 3x12"
            multiline
            autoFocus
            maxLength={LIMITE_DO_TEXTO}
            style={[estilosComuns.campo, styles.texto]}
          />
        </Secao>
        {interpretando ? (
          <ActivityIndicator />
        ) : (
          <>
            <Botao
              titulo="Interpretar"
              desabilitado={texto.trim() === '' || !apiConfigurada()}
              onPress={interpretar}
            />
            <Botao titulo="Preencher manualmente" variante="secundario" onPress={() => preencherManualmente(null)} />
          </>
        )}
        {!apiConfigurada() && <Text style={estilosComuns.textoSecundario}>{mensagemDaFalha('sem_configuracao')}</Text>}
      </Tela>
    );
  }

  return (
    <Tela>
      {aviso !== null && <Text style={styles.aviso}>{aviso}</Text>}
      {itens.map((item) => (
        <EditorDeItem
          key={item.chave}
          item={item}
          exercicios={exercicios}
          onMudar={(novo) => setItens(itens.map((i) => (i.chave === item.chave ? novo : i)))}
          onRemover={() => setItens(itens.filter((i) => i.chave !== item.chave))}
        />
      ))}
      <Botao titulo="+ Outro exercício" variante="secundario" onPress={() => setItens([...itens, novoItem()])} />
      {erro !== null && <Text style={estilosComuns.erro}>{erro}</Text>}
      <Botao titulo="Salvar" desabilitado={itens.length === 0} onPress={salvar} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  texto: { minHeight: 100, textAlignVertical: 'top' },
  aviso: { backgroundColor: cores.aviso, borderRadius: raio, padding: 12, fontSize: 15 },
});
