import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from './tema';

export interface Opcao<T> {
  valor: T;
  rotulo: string;
}

interface Props<T> {
  opcoes: readonly Opcao<T>[];
  // Quais estão marcadas. Para escolha única, passe um array com um item.
  selecionados: readonly T[];
  onAlternar: (valor: T) => void;
}

// Lista de "chips" que quebram linha. É genérica (<T>) para servir a dias da
// semana (number), grupos musculares e equipamentos (string) com o mesmo código.
export function Opcoes<T extends string | number>({ opcoes, selecionados, onAlternar }: Props<T>) {
  return (
    <View style={styles.lista}>
      {opcoes.map((opcao) => {
        const marcado = selecionados.includes(opcao.valor);
        return (
          <Pressable
            key={opcao.valor}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marcado }}
            onPress={() => onAlternar(opcao.valor)}
            style={[styles.chip, marcado && styles.chipMarcado]}
          >
            <Text style={[styles.texto, marcado && styles.textoMarcado]}>{opcao.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: cores.superficie,
  },
  chipMarcado: { backgroundColor: cores.primaria },
  texto: { fontSize: 15, color: cores.texto },
  textoMarcado: { color: cores.textoSobrePrimaria, fontWeight: '600' },
});
