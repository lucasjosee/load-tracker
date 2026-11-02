import { StyleSheet, Text, View } from 'react-native';

// Placeholder: a lista de treinos entra na tarefa 0.4 (seed) e na 2.1.
export default function TelaDivisao() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo} accessibilityRole="header">
        Divisão
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
