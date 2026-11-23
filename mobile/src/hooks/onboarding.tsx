import { createContext, useContext } from 'react';

import type { Rascunho } from '@/api/contrato';

// Contextos do React: um jeito de entregar um valor a telas lá embaixo na
// árvore sem passá-lo de mão em mão por props. Não é um gerenciador de
// estado global, só o recurso que já vem no React.

// Quem decide se o app mostra o onboarding ou as abas é app/_layout.tsx; as
// telas só avisam. `concluir` é chamado pela última tela do onboarding.
export interface PassagemDoOnboarding {
  concluir: () => void;
}

export const ContextoFimDoOnboarding = createContext<PassagemDoOnboarding>({
  concluir: () => undefined,
});

export function useConcluirOnboarding(): () => void {
  return useContext(ContextoFimDoOnboarding).concluir;
}

// O rascunho da divisão, compartilhado entre a conversa e a revisão.
export interface ValorDoRascunho {
  rascunho: Rascunho | null;
  setRascunho: (rascunho: Rascunho | null) => void;
}

export const ContextoDoRascunho = createContext<ValorDoRascunho | null>(null);

export function useRascunho(): ValorDoRascunho {
  const valor = useContext(ContextoDoRascunho);
  if (valor === null) {
    throw new Error('useRascunho() só funciona dentro de app/onboarding.'); // bug de quem chamou
  }
  return valor;
}
