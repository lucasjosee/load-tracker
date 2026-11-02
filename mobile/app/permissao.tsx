import { router } from 'expo-router';

import { ConteudoPermissao } from '@/components/ConteudoPermissao';

// Aberta pela aba Divisão ("Ativar avisos do treino").
export default function TelaPermissao() {
  return <ConteudoPermissao onTerminar={() => router.back()} />;
}
