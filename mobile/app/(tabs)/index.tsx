import { StyleSheet, Text, View } from 'react-native';

// Placeholder: o treino do dia entra na tarefa 2.3.
export default function TelaHoje() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo} accessibilityRole="header">
        Hoje
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
