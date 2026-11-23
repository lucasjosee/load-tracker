import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { arredondarKg } from '@/domain/progressao';
import { formatarNumero, lerNumero } from '@/domain/textos';

import { CampoDeTexto } from './CampoDeTexto';
import { cores, vidroDeControle } from './tema';

interface Props {
  valor: number;
  onMudar: (valor: number) => void;
  passo?: number;
  minimo?: number;
  maximo?: number;
  formatar?: (valor: number) => string;
  rotulo?: string; // lido pelo VoiceOver
  // Tocar no número abre o teclado para digitar o valor. Serve para a carga:
  // ela pode estar longe de onde o stepper começa (de 0 a 80 kg, de 2,5 em
  // 2,5, seriam 32 toques no +).
  digitavel?: boolean;
  unidade?: string; // escrita ao lado do campo enquanto digita: "kg", "kg lado"
}

// Botões − e + em volta de um número, para ajustar sem abrir o teclado.
export function Stepper({
  valor,
  onMudar,
  passo = 1,
  minimo = 0,
  maximo = Number.POSITIVE_INFINITY,
  formatar = String,
  rotulo,
  digitavel = false,
  unidade,
}: Props) {
  // O texto do campo enquanto a pessoa digita; null = mostrando o número.
  const [digitando, setDigitando] = useState<string | null>(null);

  // arredondarKg: passos como 2,5 kg somados várias vezes não acumulam resto.
  const mudar = (delta: number) => {
    const novo = arredondarKg(Math.min(maximo, Math.max(minimo, valor + delta)));
    onMudar(novo);
    // Tocar em − ou + com o teclado aberto: o campo mostra o valor novo.
    if (digitando !== null) {
      setDigitando(formatarNumero(novo));
    }
  };

  function aoDigitar(texto: string) {
    setDigitando(texto);
    // O valor muda a cada tecla, e não só ao fechar o teclado: assim tocar em
    // "Salvar" com o teclado ainda aberto já salva o que foi digitado. Texto
    // que não é número ("22,") ou fora dos limites não muda nada; ao sair do
    // campo ele volta a mostrar o último valor que valeu.
    const numero = lerNumero(texto);
    if (numero !== null && numero >= minimo && numero <= maximo) {
      onMudar(arredondarKg(numero));
    }
  }

  return (
    <View style={styles.linha} accessibilityLabel={rotulo}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Diminuir ${rotulo ?? ''}`}
        disabled={valor <= minimo}
        onPress={() => mudar(-passo)}
        style={({ pressed }) => [styles.botao, (pressed || valor <= minimo) && styles.apagado]}
      >
        <Text style={styles.sinal}>−</Text>
      </Pressable>
      {digitando !== null ? (
        <View style={styles.digitacao}>
          <CampoDeTexto
            value={digitando}
            onChangeText={aoDigitar}
            onBlur={() => setDigitando(null)}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            placeholder="0"
            accessibilityLabel={rotulo}
            style={[styles.valor, styles.caixa, styles.campo]}
          />
          {unidade !== undefined && <Text style={styles.unidade}>{unidade}</Text>}
        </View>
      ) : digitavel ? (
        // Com fundo de campo: é o sinal de que dá para tocar e escrever.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${rotulo ?? ''}: ${formatar(valor)}`}
          accessibilityHint="Toque para digitar"
          // Zero vira campo vazio: é só digitar, sem apagar o 0 antes.
          onPress={() => setDigitando(valor === 0 ? '' : formatarNumero(valor))}
          style={({ pressed }) => [styles.caixa, pressed && styles.caixaApertada]}
        >
          <Text style={styles.valor}>{formatar(valor)}</Text>
        </Pressable>
      ) : (
        <Text style={styles.valor}>{formatar(valor)}</Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${rotulo ?? ''}`}
        disabled={valor >= maximo}
        onPress={() => mudar(passo)}
        style={({ pressed }) => [styles.botao, (pressed || valor >= maximo) && styles.apagado]}
      >
        <Text style={styles.sinal}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    ...vidroDeControle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apagado: { opacity: 0.4 },
  sinal: { fontSize: 22, color: cores.primaria, fontWeight: '600' },
  valor: { minWidth: 56, textAlign: 'center', fontSize: 17, fontVariant: ['tabular-nums'], color: cores.texto },
  // O número que dá para digitar, e o campo que abre no lugar dele: a mesma
  // caixa, para nada pular de lugar ao tocar.
  caixa: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.divisoria,
    backgroundColor: cores.campo,
  },
  caixaApertada: { borderColor: cores.borda },
  campo: { minWidth: 72, paddingVertical: 8, borderColor: cores.primaria },
  digitacao: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unidade: { fontSize: 15, color: cores.textoSecundario },
});
