import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';

export type ResultadoDaGravacao = 'gravou' | 'ocupada' | 'falhou';

export type Gravar = (acao: () => Promise<void>) => Promise<ResultadoDaGravacao>;

// Trava contra toque duplo: enquanto uma gravação não termina, a seguinte é
// ignorada. Sem ela, dois toques rápidos em "Bati" ou "Salvar" gravam o
// exercício duas vezes e o motor avança a meta em dobro.
//
// A falha vira valor ('falhou') em vez de exceção solta: quem chama consegue
// avisar a pessoa, em vez de o botão simplesmente não fazer nada.
//
// Fica fora do React (uma função comum com uma variável guardada no closure)
// para poder ser testada sem montar tela.
export function criarTrava(): Gravar {
  let ocupada = false;
  return async (acao) => {
    if (ocupada) {
      return 'ocupada';
    }
    ocupada = true;
    try {
      await acao();
      return 'gravou';
    } catch (erro) {
      console.warn('Falha ao gravar', erro);
      return 'falhou';
    } finally {
      ocupada = false;
    }
  };
}

// A trava de uma tela, com o aviso de falha. As gravações do app são
// transações (regra 7), então uma falha não deixa nada pela metade.
export function useGravacao(): Gravar {
  // useState com função: a trava é criada uma vez e vale enquanto a tela existir.
  const [trava] = useState(criarTrava);
  return useCallback(
    async (acao) => {
      const resultado = await trava(acao);
      if (resultado === 'falhou') {
        Alert.alert('Não foi possível salvar', 'Nada foi gravado. Tente de novo.');
      }
      return resultado;
    },
    [trava],
  );
}

// Chama `aoVoltar` quando o app volta do segundo plano. O useFocusEffect do
// Expo Router não cobre esse caso: ele só dispara ao trocar de tela, e o iOS
// costuma manter o app aberto de um dia para o outro.
export function useAoVoltarParaFrente(aoVoltar: () => void): void {
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        aoVoltar();
      }
    });
    return () => assinatura.remove();
  }, [aoVoltar]);
}
