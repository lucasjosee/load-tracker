import { NativeTabs } from 'expo-router/native-tabs';

// NativeTabs desenha a barra de abas do próprio iOS, então o visual e o
// comportamento são os mesmos dos apps da Apple. Os ícones são SF Symbols,
// que já vêm no sistema: não precisamos guardar imagens de ícone no projeto.
// O `name` de cada Trigger é o nome do arquivo da rota nesta pasta.
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hoje</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="evolucao">
        <NativeTabs.Trigger.Label>Evolução</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="divisao">
        <NativeTabs.Trigger.Label>Divisão</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
