import { StyleSheet, Text, View } from 'react-native';

// Placeholder: os gráficos e alertas entram na Fase 5.
export default function TelaEvolucao() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo} accessibilityRole="header">
        Evolução
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: '600',
  },
});
