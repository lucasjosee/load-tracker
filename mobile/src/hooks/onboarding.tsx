import { createContext, useContext } from 'react';

import type { Rascunho } from '@/api/contrato';

// Contextos do React: um jeito de entregar um valor a telas lá embaixo na
// árvore sem passá-lo de mão em mão por props. Não é um gerenciador de
// estado global, só o recurso que já vem no React.

// Chamado pela última tela do onboarding para liberar as abas (app/_layout.tsx).
export const ContextoFimDoOnboarding = createContext<() => void>(() => undefined);

export function useConcluirOnboarding(): () => void {
  return useContext(ContextoFimDoOnboarding);
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
