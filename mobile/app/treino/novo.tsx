import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Text, TextInput } from 'react-native';

import { Botao } from '@/components/Botao';
import { SeletorDeDias } from '@/components/SeletorDeDias';
import { estilosComuns, Secao, Tela } from '@/components/Tela';
import { criarTreino } from '@/db/operacoes';
import { listarTreinos } from '@/db/repositorios/treinos';
import { validarNomeDoTreino } from '@/domain/validacao';

export default function TelaNovoTreino() {
  const db = useSQLiteContext();
  const [nome, setNome] = useState('');
  const [dias, setDias] = useState<number[]>([]);
  const [ocupados, setOcupados] = useState<Map<number, string>>(new Map());
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listarTreinos(db).then((treinos) =>
        setOcupados(new Map(treinos.flatMap((t) => t.dias.map((dia) => [dia, t.nome] as const)))),
      );
    }, [db]),
  );

  async function criar() {
    const problema = validarNomeDoTreino(nome);
    setErro(problema);
    if (problema !== null) {
      return;
    }
    const id = await criarTreino(db, nome, dias);
    // `replace` em vez de `push`: voltar do treino criado leva à Divisão, não
    // a este formulário de novo.
    router.replace({ pathname: '/treino/[id]', params: { id } });
  }

  return (
    <Tela>
      <Secao titulo="Nome">
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Ex.: Push, Peito e tríceps"
          autoFocus
          returnKeyType="done"
          style={estilosComuns.campo}
        />
      </Secao>

      <Secao titulo="Dias">
        <SeletorDeDias dias={dias} onMudar={setDias} ocupados={ocupados} nomeDoTreino={nome.trim()} />
      </Secao>

      {erro !== null && <Text style={estilosComuns.erro}>{erro}</Text>}
      <Botao titulo="Criar treino" onPress={criar} />
    </Tela>
  );
}
