import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { cores, relevo } from './tema';
import { Texto } from './Texto';

type Papel = 'assistente' | 'usuario';

// Uma fala da conversa do onboarding. Quem fala fica de um lado e o canto do
// balão virado para esse lado é mais reto, como em app de mensagem.
export function Balao({ papel, texto }: { papel: Papel; texto: string }) {
  return (
    <Entrada estilo={[styles.balao, papel === 'usuario' ? styles.usuario : styles.assistente]}>
      <Texto style={[styles.texto, papel === 'usuario' && styles.textoDoUsuario]}>{texto}</Texto>
    </Entrada>
  );
}

// Os três pontos de "digitando", enquanto a resposta da IA não chega.
export function Digitando() {
  // Um valor que vai de 0 a 1 e recomeça; cada ponto acende num trecho dele.
  const [ciclo] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animacao = Animated.loop(Animated.timing(ciclo, { toValue: 1, duration: 1200, useNativeDriver: true }));
    animacao.start();
    return () => animacao.stop(); // sem isto a animação continuaria depois de a tela sair
  }, [ciclo]);

  return (
    <Entrada estilo={[styles.balao, styles.assistente, styles.digitando]} rotulo="A resposta está chegando">
      {[0, 1, 2].map((indice) => (
        <Animated.View
          key={indice}
          style={[
            styles.ponto,
            {
              opacity: ciclo.interpolate({
                // Cada ponto tem o seu pico um pouco depois do anterior.
                inputRange: [0, 0.15 + indice * 0.2, 0.35 + indice * 0.2, 1],
                outputRange: [0.3, 1, 0.3, 0.3],
              }),
            },
          ]}
        />
      ))}
    </Entrada>
  );
}

interface EntradaProps {
  estilo: object[];
  rotulo?: string;
  children: React.ReactNode;
}

// Faz o balão aparecer subindo um pouco, em vez de surgir de uma vez.
function Entrada({ estilo, rotulo, children }: EntradaProps) {
  const [progresso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progresso, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [progresso]);

  return (
    <Animated.View
      accessible={rotulo !== undefined}
      accessibilityLabel={rotulo}
      style={[
        ...estilo,
        {
          opacity: progresso,
          transform: [{ translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  balao: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, maxWidth: '85%' },
  assistente: { alignSelf: 'flex-start', backgroundColor: cores.superficie, borderBottomLeftRadius: 6, boxShadow: relevo.botao },
  usuario: { alignSelf: 'flex-end', backgroundColor: cores.primaria, borderBottomRightRadius: 6 },
  texto: { fontSize: 16, lineHeight: 22, color: cores.texto },
  textoDoUsuario: { color: cores.textoSobrePrimaria },
  digitando: { flexDirection: 'row', gap: 5, paddingVertical: 15 },
  ponto: { width: 7, height: 7, borderRadius: 4, backgroundColor: cores.textoSecundario },
});
