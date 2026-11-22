import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { conversarOnboarding, mensagemDaFalha } from '@/api/cliente';
import { LIMITE_DE_PERGUNTAS, LIMITE_DO_TEXTO, PRIMEIRA_PERGUNTA, type Mensagem } from '@/api/contrato';
import { Balao, Digitando } from '@/components/Balao';
import { Botao } from '@/components/Botao';
import { RascunhoAoVivo } from '@/components/RascunhoAoVivo';
import { estilosComuns } from '@/components/Tela';
import { cores, espaco } from '@/components/tema';
import { CampoDeTexto, Texto } from '@/components/Texto';
import { resumirRascunho } from '@/domain/onboarding';
import { useRascunho } from '@/hooks/onboarding';

// Conversa com a IA (§3.1, passo 2). A cada resposta, o servidor devolve o
// rascunho atualizado e a próxima pergunta; a conversa inteira vai em cada
// pedido, porque o servidor não guarda nada (§8.4).
export default function TelaConversa() {
  const { rascunho, setRascunho } = useRascunho();
  const [mensagens, setMensagens] = useState<Mensagem[]>([{ papel: 'assistente', texto: PRIMEIRA_PERGUNTA }]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const rolagem = useRef<ScrollViewInstance>(null);

  const perguntas = mensagens.filter((mensagem) => mensagem.papel === 'assistente').length;

  // Separado do "enviar" para o "Tentar de novo" reenviar a mesma conversa,
  // sem a pessoa digitar a resposta outra vez.
  async function pedirProximaPergunta(conversa: Mensagem[]) {
    setFalha(null);
    setEnviando(true);
    const resposta = await conversarOnboarding({ mensagens: conversa, rascunho });
    setEnviando(false);

    if (!resposta.ok) {
      setFalha(mensagemDaFalha(resposta.falha));
      return;
    }
    Haptics.selectionAsync(); // um toque leve: a resposta chegou
    setRascunho(resposta.valor.rascunho);
    if (resposta.valor.completo || resposta.valor.proximaPergunta === null) {
      router.push('/onboarding/revisao');
      return;
    }
    setMensagens([...conversa, { papel: 'assistente', texto: resposta.valor.proximaPergunta }]);
  }

  function enviar() {
    const conversa: Mensagem[] = [...mensagens, { papel: 'usuario', texto: texto.trim() }];
    setMensagens(conversa);
    setTexto('');
    pedirProximaPergunta(conversa);
  }

  const podeEnviar = !enviando && texto.trim() !== '';

  return (
    // Sobe o campo de texto junto com o teclado, para ele não ficar escondido.
    <KeyboardAvoidingView style={styles.tela} behavior="padding" keyboardVerticalOffset={100}>
      <RascunhoAoVivo resumo={resumirRascunho(rascunho)} />
      <ScrollView
        ref={rolagem}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: true })}
      >
        <Texto style={styles.contagem}>
          Pergunta {perguntas} de até {LIMITE_DE_PERGUNTAS}
        </Texto>
        {mensagens.map((mensagem, indice) => (
          <Balao key={indice} papel={mensagem.papel} texto={mensagem.texto} />
        ))}
        {enviando && <Digitando />}
        {falha !== null && (
          <View style={styles.falha}>
            <Texto style={estilosComuns.erro}>{falha}</Texto>
            <Botao titulo="Tentar de novo" variante="secundario" compacto onPress={() => pedirProximaPergunta(mensagens)} />
          </View>
        )}
      </ScrollView>

      <View style={styles.rodape}>
        {falha === null && (
          <View style={styles.entrada}>
            <CampoDeTexto
              value={texto}
              onChangeText={setTexto}
              // A primeira pergunta é a do perfil; as seguintes, sobre o treino.
              placeholder={perguntas === 1 ? 'Lucas, 2 anos, hipertrofia' : 'seg peito e tríceps: supino reto 20kg 3x10...'}
              placeholderTextColor={cores.textoSecundario}
              multiline
              maxLength={LIMITE_DO_TEXTO}
              editable={!enviando}
              style={[estilosComuns.campo, styles.campo]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar"
              accessibilityState={{ disabled: !podeEnviar }}
              disabled={!podeEnviar}
              onPress={enviar}
              hitSlop={6}
              style={({ pressed }) => [styles.enviar, (pressed || !podeEnviar) && styles.enviarApagado]}
            >
              <Texto style={styles.setaDeEnviar}>↑</Texto>
            </Pressable>
          </View>
        )}
        {/* Sempre dá para sair da conversa e terminar no formulário. */}
        <Botao
          titulo={rascunho === null ? 'Preencher manualmente' : 'Revisar e completar à mão'}
          variante="secundario"
          compacto
          desabilitado={enviando}
          onPress={() => router.push('/onboarding/revisao')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: espaco.grande, gap: espaco.pequeno },
  contagem: { alignSelf: 'center', fontSize: 12, color: cores.textoSecundario, marginBottom: 4, fontVariant: ['tabular-nums'] },
  falha: { gap: espaco.pequeno, alignItems: 'flex-start' },
  rodape: { padding: espaco.medio, gap: espaco.pequeno, borderTopWidth: StyleSheet.hairlineWidth, borderColor: cores.borda },
  entrada: { flexDirection: 'row', alignItems: 'flex-end', gap: espaco.pequeno },
  campo: { flex: 1, maxHeight: 120, borderRadius: 22 },
  enviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.primaria,
  },
  enviarApagado: { opacity: 0.4 },
  setaDeEnviar: { fontSize: 22, fontWeight: '800', color: cores.textoSobrePrimaria },
});
