import { d20Fantasy } from "./presets/d20-fantasy";
import type { SystemTemplate } from "./schema";

/**
 * Registro de templates embutidos (definidos em código).
 * Templates customizados criados pelo usuário (em banco) chegam na Fase 4.
 *
 * Os outros 3 sistemas escolhidos (percentual/CoC, Ordem Paranormal d100,
 * narrativo/PbtA) entram no M7 — o motor já os suporta.
 */
const BUILTIN: Record<string, SystemTemplate> = {
  [d20Fantasy.id]: d20Fantasy,
};

export function listBuiltinTemplates(): SystemTemplate[] {
  return Object.values(BUILTIN);
}

export function getBuiltinTemplate(key: string): SystemTemplate | null {
  return BUILTIN[key] ?? null;
}

/** Modificador d20 a partir de um valor de atributo. */
export function computeModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export * from "./schema";
