import { ConteudoPermissao } from '@/components/ConteudoPermissao';
import { useConcluirOnboarding } from '@/hooks/onboarding';

// Último passo do onboarding (§3.1, passo 4). A divisão já foi gravada na
// revisão; aqui só falta liberar as abas, e o app abre na aba Hoje.
export default function TelaPermissaoDoOnboarding() {
  const concluir = useConcluirOnboarding();
  return <ConteudoPermissao onTerminar={concluir} />;
}
