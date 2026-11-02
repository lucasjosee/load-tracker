import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { Botao } from '@/components/Botao';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { cores } from '@/components/tema';
import { exportarBackup } from '@/db/backup';
import { listarTreinos, type TreinoComDias } from '@/db/repositorios/treinos';
import { listarDiasPorExtenso, paraDataLocal } from '@/domain/datas';

export default function TelaDivisao() {
  const db = useSQLiteContext();
  const [treinos, setTreinos] = useState<TreinoComDias[] | null>(null);

  // useFocusEffect roda ao abrir a aba e toda vez que ela volta a aparecer
  // (ex.: depois de editar um treino), então a lista nunca fica velha.
  useFocusEffect(
    useCallback(() => {
      listarTreinos(db).then(setTreinos);
    }, [db]),
  );

  if (treinos === null) {
    return <Tela titulo="Divisão">{null}</Tela>;
  }

  async function exportar() {
    try {
      await exportarBackup(db, paraDataLocal(new Date()));
    } catch {
      Alert.alert('Não foi possível exportar', 'Tente de novo. Seus dados continuam no aparelho.');
    }
  }

  const diasComTreino = treinos.flatMap((treino) => treino.dias);
  const diasDeDescanso = [0, 1, 2, 3, 4, 5, 6].filter((dia) => !diasComTreino.includes(dia));

  return (
    <Tela titulo="Divisão">
      <Secao titulo="Treinos">
        {treinos.length === 0 && <Text style={estilosComuns.textoSecundario}>Nenhum treino cadastrado.</Text>}

        {treinos.map((treino) => (
          <Pressable
            key={treino.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/treino/[id]', params: { id: treino.id } })}
            style={({ pressed }) => [estilosComuns.cartao, pressed && styles.pressionado]}
          >
            <Text style={styles.nome}>{treino.nome}</Text>
            <Text style={estilosComuns.textoSecundario}>
              {treino.dias.length > 0 ? listarDiasPorExtenso(treino.dias) : 'Sem dia definido'}
            </Text>
          </Pressable>
        ))}

        {diasDeDescanso.length > 0 && treinos.length > 0 && (
          <Text style={estilosComuns.textoSecundario}>Descanso: {listarDiasPorExtenso(diasDeDescanso).toLowerCase()}</Text>
        )}

        <Botao titulo="Novo treino" variante="secundario" onPress={() => router.push('/treino/novo')} />
      </Secao>

      <Secao titulo="Dados">
        <Text style={estilosComuns.textoSecundario}>
          Tudo fica só neste iPhone. Exporte de vez em quando e salve em Arquivos ou no iCloud.
        </Text>
        <Botao titulo="Exportar backup (JSON)" variante="secundario" onPress={exportar} />
      </Secao>
    </Tela>
  );
}

const styles = StyleSheet.create({
  nome: { fontSize: 17, fontWeight: '600', color: cores.texto },
  pressionado: { opacity: 0.6 },
});
