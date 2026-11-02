import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { apiConfigurada } from '@/api/cliente';
import { Botao } from '@/components/Botao';
import { estilosComuns } from '@/components/Tela';
import { cores, espaco } from '@/components/tema';
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
      <Text style={styles.titulo}>Load Tracker</Text>
      <Text style={styles.frase}>Decide a meta de cada exercício antes de você chegar na academia.</Text>
      <Text style={estilosComuns.textoSecundario}>
        Conte como você treina hoje, em poucas mensagens. Depois é só registrar se bateu a meta.
      </Text>
      <View style={styles.botoes}>
        {apiConfigurada() && <Botao titulo="Começar" onPress={() => router.push('/onboarding/conversa')} />}
        <Botao titulo="Preencher manualmente" variante="secundario" onPress={preencherManualmente} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, padding: espaco.grande, gap: espaco.grande, justifyContent: 'center', backgroundColor: cores.fundo },
  titulo: { fontSize: 34, fontWeight: '800' },
  frase: { fontSize: 22, fontWeight: '600' },
  botoes: { gap: espaco.pequeno, marginTop: espaco.grande },
});
