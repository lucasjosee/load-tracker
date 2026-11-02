import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { obterConfig, salvarConfig } from '@/db/repositorios/config';
import { formatarHorario, HORARIO_PADRAO_DO_AVISO, lerHorario } from '@/domain/horario';
import { abrirAjustes, lerPermissao, type Permissao } from '@/notificacoes/permissao';

import { Botao } from './Botao';
import { Stepper } from './Stepper';
import { estilosComuns, Secao } from './Tela';
import { cores } from './tema';

const ULTIMO_MINUTO = 23 * 60 + 45;

interface Props {
  // Chamado depois de mudar o horário, para reagendar os avisos.
  onMudou: () => void;
}

// Horário do aviso e situação da permissão (§6). Com permissão negada o app
// funciona igual; só mostramos como ligar de novo nos Ajustes.
export function SecaoAvisos({ onMudou }: Props) {
  const db = useSQLiteContext();
  const [permissao, setPermissao] = useState<Permissao | null>(null);
  const [minutos, setMinutos] = useState<number | null>(null); // minutos desde 00:00

  const carregar = useCallback(async () => {
    setPermissao(await lerPermissao());
    const horario = lerHorario((await obterConfig(db, 'horario_notificacao')) ?? '') ?? HORARIO_PADRAO_DO_AVISO;
    setMinutos(horario.hora * 60 + horario.minuto);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // Voltar dos Ajustes do iOS não troca de tela, só traz o app de volta para
  // a frente: AppState avisa quando isso acontece.
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        carregar();
      }
    });
    return () => assinatura.remove();
  }, [carregar]);

  async function mudarHorario(novos: number) {
    setMinutos(novos);
    await salvarConfig(db, 'horario_notificacao', formatarHorario({ hora: Math.floor(novos / 60), minuto: novos % 60 }));
    onMudou();
  }

  if (permissao === null || minutos === null) {
    return null;
  }

  return (
    <Secao titulo="Avisos">
      {permissao === 'nao_perguntada' && (
        <Botao titulo="Ativar avisos do treino" variante="secundario" onPress={() => router.push('/permissao')} />
      )}
      {permissao === 'negada' && (
        <>
          <Text style={estilosComuns.textoSecundario}>
            Os avisos estão desligados nos Ajustes do iPhone. O app funciona igual, só não te lembra.
          </Text>
          <Botao titulo="Abrir Ajustes" variante="secundario" onPress={abrirAjustes} />
        </>
      )}
      <View style={styles.linha}>
        <Text style={styles.rotulo}>Aviso no dia do treino</Text>
        <Stepper
          valor={minutos}
          onMudar={mudarHorario}
          passo={15}
          maximo={ULTIMO_MINUTO}
          formatar={(m) => formatarHorario({ hora: Math.floor(m / 60), minuto: m % 60 })}
          rotulo="horário do aviso"
        />
      </View>
      <Text style={estilosComuns.textoSecundario}>O ideal é uns 30 min antes do horário em que você treina.</Text>
    </Secao>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { fontSize: 17, color: cores.texto, flexShrink: 1 },
});
