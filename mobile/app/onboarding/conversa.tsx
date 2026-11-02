import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { conversarOnboarding, mensagemDaFalha } from '@/api/cliente';
import { LIMITE_DO_TEXTO, PRIMEIRA_PERGUNTA, type Mensagem } from '@/api/contrato';
import { Botao } from '@/components/Botao';
import { estilosComuns } from '@/components/Tela';
import { cores, espaco, raio } from '@/components/tema';
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

  async function enviar() {
    const conversa: Mensagem[] = [...mensagens, { papel: 'usuario', texto: texto.trim() }];
    setMensagens(conversa);
    setTexto('');
    setEnviando(true);
    const resposta = await conversarOnboarding({ mensagens: conversa, rascunho });
    setEnviando(false);

    if (!resposta.ok) {
      setFalha(mensagemDaFalha(resposta.falha));
      return;
    }
    setRascunho(resposta.valor.rascunho);
    if (resposta.valor.completo || resposta.valor.proximaPergunta === null) {
      router.push('/onboarding/revisao');
      return;
    }
    setMensagens([...conversa, { papel: 'assistente', texto: resposta.valor.proximaPergunta }]);
  }

  return (
    // Sobe o campo de texto junto com o teclado, para ele não ficar escondido.
    <KeyboardAvoidingView style={styles.tela} behavior="padding" keyboardVerticalOffset={100}>
      <ScrollView
        ref={rolagem}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: true })}
      >
        {mensagens.map((mensagem, indice) => (
          <Text key={indice} style={[styles.balao, mensagem.papel === 'usuario' ? styles.usuario : styles.assistente]}>
            {mensagem.texto}
          </Text>
        ))}
        {enviando && <ActivityIndicator style={styles.carregando} />}
        {falha !== null && <Text style={estilosComuns.erro}>{falha}</Text>}
      </ScrollView>

      <View style={styles.rodape}>
        {falha === null ? (
          <View style={styles.entrada}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="seg peito e tríceps: supino reto 20kg 3x10..."
              multiline
              maxLength={LIMITE_DO_TEXTO}
              editable={!enviando}
              style={[estilosComuns.campo, styles.campo]}
            />
            <Botao titulo="Enviar" compacto desabilitado={enviando || texto.trim() === ''} onPress={enviar} />
          </View>
        ) : null}
        {/* Sempre dá para sair da conversa e terminar no formulário. */}
        <Botao
          titulo={rascunho === null ? 'Preencher manualmente' : 'Revisar e completar à mão'}
          variante="secundario"
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
  balao: { fontSize: 16, padding: 12, borderRadius: raio, maxWidth: '85%', overflow: 'hidden' },
  assistente: { alignSelf: 'flex-start', backgroundColor: cores.superficie, color: cores.texto },
  usuario: { alignSelf: 'flex-end', backgroundColor: cores.primaria, color: cores.textoSobrePrimaria },
  carregando: { alignSelf: 'flex-start', margin: 8 },
  rodape: { padding: espaco.medio, gap: espaco.pequeno, borderTopWidth: StyleSheet.hairlineWidth, borderColor: cores.borda },
  entrada: { flexDirection: 'row', alignItems: 'flex-end', gap: espaco.pequeno },
  campo: { flex: 1, maxHeight: 120 },
});
