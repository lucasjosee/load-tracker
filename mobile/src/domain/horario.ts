// Horários do dia no formato 'HH:MM' (como a §8.4 guarda `horarioTreino`).

export interface Horario {
  hora: number; // 0–23
  minuto: number; // 0–59
}

const MINUTOS_NO_DIA = 24 * 60;

// '07:30' → { hora: 7, minuto: 30 }. Aceita '7:30'. Inválido → null.
export function lerHorario(texto: string): Horario | null {
  const partes = /^(\d{1,2}):(\d{2})$/.exec(texto.trim());
  if (partes === null) {
    return null;
  }
  const hora = Number(partes[1]);
  const minuto = Number(partes[2]);
  if (hora > 23 || minuto > 59) {
    return null;
  }
  return { hora, minuto };
}

export function formatarHorario({ hora, minuto }: Horario): string {
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

// Soma minutos dando a volta na meia-noite: 23:45 + 30 min = 00:15.
export function somarMinutos({ hora, minuto }: Horario, minutos: number): Horario {
  const total = (((hora * 60 + minuto + minutos) % MINUTOS_NO_DIA) + MINUTOS_NO_DIA) % MINUTOS_NO_DIA;
  return { hora: Math.floor(total / 60), minuto: total % 60 };
}

// Sem horário configurado, o aviso sai de manhã: assim ele chega antes do
// treino, seja qual for o horário em que a pessoa treina.
export const HORARIO_PADRAO_DO_AVISO: Horario = { hora: 7, minuto: 0 };

// §6: o aviso do treino sai 30 min antes do horário habitual de treino.
export function horarioDoAviso(horarioDeTreino: Horario): Horario {
  return somarMinutos(horarioDeTreino, -30);
}
