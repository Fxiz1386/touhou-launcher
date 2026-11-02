export type ThemeMode = 'auto' | 'dark' | 'light' | 'zun_pastel';

export type EffectiveTheme = 'dark' | 'light' | 'zun_pastel';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  description: string;
  icon: 'sun' | 'moon' | 'palette' | 'clock';
  previewColors: string[]; // 3-4 hex swatches
}

export const THEME_OPTIONS: ThemeConfig[] = [
  {
    id: 'auto',
    name: 'Automático (Hora Local)',
    description: 'Cambia dinámicamente según la hora del día: ZUN Pastel de día (07:00–18:00) y Noche Escarlata (18:00–07:00).',
    icon: 'clock',
    previewColors: ['#f43f5e', '#fbf8f3', '#0a0a0c'],
  },
  {
    id: 'dark',
    name: 'Noche Escarlata (Dark)',
    description: 'Contraste profundo estilo Gensokyo nocturno. Ideal para sesiones de juego nocturnas sin fatiga ocular.',
    icon: 'moon',
    previewColors: ['#0d0c13', '#171523', '#e11d48', '#38bdf8'],
  },
  {
    id: 'zun_pastel',
    name: 'ZUN Pastel (Acuarela)',
    description: 'Inspirado en los libros de arte de ZUN y portadas de CD: tonos pergamino crema, sakura suave y jade.',
    icon: 'palette',
    previewColors: ['#fbf8f3', '#f3ede2', '#e11d48', '#10b981'],
  },
  {
    id: 'light',
    name: 'Santuario Diurno (Light)',
    description: 'Interfaz clara y limpia de alto contraste inspirada en la mañana del Santuario Hakurei.',
    icon: 'sun',
    previewColors: ['#f8fafc', '#ffffff', '#dc2626', '#0284c7'],
  },
];

/**
 * Calculates effective theme given a selected mode and the current time
 */
export function resolveEffectiveTheme(mode: ThemeMode, now: Date = new Date()): EffectiveTheme {
  if (mode !== 'auto') {
    return mode;
  }

  const hour = now.getHours();

  // Daytime between 07:00 and 18:00 -> ZUN Pastel for comfortable daylight reading
  if (hour >= 7 && hour < 18) {
    return 'zun_pastel';
  }

  // Evening and Night (18:00 to 07:00) -> Dark for dark room ergonomics
  return 'dark';
}

/**
 * Returns a human description of the current time period and why the auto theme was picked
 */
export function getAutoThemeReason(now: Date = new Date()): string {
  const hour = now.getHours();
  const timeString = `${hour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  if (hour >= 7 && hour < 18) {
    return `Hora actual: ${timeString} (Horario diurno). Aplicando tema suave ZUN Pastel para reducir el brillo y mejorar la legibilidad.`;
  }
  return `Hora actual: ${timeString} (Horario nocturno). Aplicando tema Noche Escarlata para proteger la vista en entornos oscuros.`;
}
