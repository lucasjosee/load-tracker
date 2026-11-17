// Tempo de treino (§3.2): quanto tempo passou desde o "Iniciar treino". Só as
// contas; quem lê o relógio é a tela. Como em todo o domínio, o "agora" entra
// por parâmetro.

// Segundos desde o início da sessão. `iniciadaEm` é o timestamp ISO guardado
// na sessão; `ate`, em milissegundos, como Date.now(). Nunca negativo: se o
// relógio do aparelho for atrasado no meio do treino, mostra zero.
export function segundosDeTreino(iniciadaEm: string, ate: number): number {
  return Math.max(0, Math.floor((ate - new Date(iniciadaEm).getTime()) / 1000));
}

// O cronômetro da tela do treino: 725 → '12:05'; 3725 → '1:02:05'.
export function formatarCronometro(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return horas > 0
    ? `${horas}:${doisDigitos(minutos)}:${doisDigitos(segundos % 60)}`
    : `${minutos}:${doisDigitos(segundos % 60)}`;
}

// A duração no resumo do treino: '52 min', '1 h 05 min'. Arredonda para
// baixo; menos de um minuto vira null (não vale mostrar).
export function textoDuracao(segundos: number): string | null {
  const minutos = Math.floor(segundos / 60);
  if (minutos < 1) {
    return null;
  }
  return minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`;
}
