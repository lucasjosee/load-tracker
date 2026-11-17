// A ordem dos exercícios durante o treino (§3.2). A pessoa pode adiar um
// exercício (aparelho ocupado) e ele volta depois; aqui só se decide a ordem.
// Tudo trabalha com ids, sem saber o que é um exercício.

// O que ainda falta fazer, na ordem em que vai aparecer: primeiro os
// exercícios na ordem do treino, depois os adiados, na ordem em que foram
// adiados. O primeiro da lista é o exercício da vez.
export function filaDoTreino(
  ordem: readonly string[],
  feitos: readonly string[],
  adiados: readonly string[],
): string[] {
  const pendentes = ordem.filter((id) => !feitos.includes(id));
  const naOrdem = pendentes.filter((id) => !adiados.includes(id));
  const depois = adiados.filter((id) => pendentes.includes(id));
  return [...naOrdem, ...depois];
}

// Manda o exercício para o fim da fila. Adiar de novo um que já estava
// adiado o leva para trás dos outros adiados.
export function adiarExercicio(adiados: readonly string[], id: string): string[] {
  return [...adiados.filter((adiado) => adiado !== id), id];
}
