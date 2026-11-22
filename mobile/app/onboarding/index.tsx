import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { apiConfigurada } from '@/api/cliente';
import { Botao } from '@/components/Botao';
import { estilosComuns } from '@/components/Tela';
import { cores, espaco } from '@/components/tema';
import { Texto } from '@/components/Texto';
import { useRascunho } from '@/hooks/onboarding';

// Boas-vindas (§3.1, passo 1).
export default function TelaBoasVindas() {
  const { setRascunho } = useRascunho();

  function preencherManualmente() {
    setRascunho(null);
    router.push('/onboarding/revisao');
  }

  return (
    <View style={styles.tela}>
      <Texto style={styles.titulo}>Load Tracker</Texto>
      <Texto style={styles.frase}>Decide a meta de cada exercício antes de você chegar na academia.</Texto>
      <Texto style={estilosComuns.textoSecundario}>
        Conte como você treina hoje, em poucas mensagens. Depois é só registrar se bateu a meta.
      </Texto>
      <View style={styles.botoes}>
        {apiConfigurada() && <Botao titulo="Começar" onPress={() => router.push('/onboarding/conversa')} />}
        <Botao titulo="Preencher manualmente" variante="secundario" onPress={preencherManualmente} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, padding: espaco.grande, gap: espaco.grande, justifyContent: 'center', backgroundColor: cores.fundo },
  titulo: { fontSize: 34, fontWeight: '800', color: cores.texto },
  frase: { fontSize: 22, fontWeight: '600', color: cores.texto },
  botoes: { gap: espaco.pequeno, marginTop: espaco.grande },
});
