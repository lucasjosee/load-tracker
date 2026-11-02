import { Alert } from 'react-native';

import { DIAS_A_PARTIR_DE_SEGUNDA, NOMES_CURTOS_DOS_DIAS, NOMES_DOS_DIAS, ordenarDias } from '@/domain/datas';

import { Opcoes } from './Opcoes';

interface Props {
  dias: readonly number[];
  onMudar: (dias: number[]) => void;
  // Nome do treino que hoje ocupa cada dia (só os de outros treinos).
  ocupados: ReadonlyMap<number, string>;
  nomeDoTreino: string;
}

const OPCOES = DIAS_A_PARTIR_DE_SEGUNDA.map((dia) => ({ valor: dia, rotulo: NOMES_CURTOS_DOS_DIAS[dia] }));

// Escolha dos dias do treino. Cada dia tem no máximo um treino (§9): marcar
// um dia que já é de outro treino pede confirmação antes de trocar.
export function SeletorDeDias({ dias, onMudar, ocupados, nomeDoTreino }: Props) {
  function alternar(dia: number) {
    if (dias.includes(dia)) {
      onMudar(dias.filter((d) => d !== dia));
      return;
    }
    const dono = ocupados.get(dia);
    if (dono === undefined) {
      onMudar(ordenarDias([...dias, dia]));
      return;
    }
    Alert.alert(
      `${NOMES_DOS_DIAS[dia]} já é do ${dono}`,
      `Cada dia tem um treino só. Passar ${NOMES_DOS_DIAS[dia].toLowerCase()} para ${nomeDoTreino || 'este treino'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Trocar', onPress: () => onMudar(ordenarDias([...dias, dia])) },
      ],
    );
  }

  return <Opcoes opcoes={OPCOES} selecionados={dias} onAlternar={alternar} />;
}
