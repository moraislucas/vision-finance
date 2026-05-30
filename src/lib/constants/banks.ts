/**
 * Registro de marcas de banco/instituição.
 *
 * Auto-extensível: qualquer `.svg` colocado em `src/assets/bancos/` é registrado
 * automaticamente pelo nome do arquivo (= slug). Para um logo novo bastar
 * existir o arquivo — nada precisa ser editado aqui. Opcionalmente, adicione uma
 * entrada em `BANK_META` para um rótulo bonito e a cor de marca.
 *
 * O slug é guardado no campo `icon` de `Account`/`CreditCard` (sem migration).
 */

// Vite: import.meta.glob exige caminho relativo/absoluto (alias `@` não vale aqui).
const modules = import.meta.glob('../../assets/bancos/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Slugs ignorados (arquivos de teste/placeholder vazios). */
const IGNORED = new Set(['teste']);

/** Metadados opcionais por slug (rótulo + cor de marca). */
const BANK_META: Record<string, { label?: string; color?: string }> = {
  nubank: { label: 'Nubank', color: '#820AD1' },
  itau: { label: 'Itaú', color: '#EC7000' },
  bradesco: { label: 'Bradesco', color: '#CC092F' },
  inter: { label: 'Inter', color: '#FF7A00' },
  'porto-seguro': { label: 'Porto Seguro', color: '#0033A0' },
};

export interface BankBrand {
  /** Identificador estável (nome do arquivo sem extensão). */
  slug: string;
  /** Rótulo amigável para exibição. */
  label: string;
  /** URL do SVG (resolvida pelo Vite). */
  logo: string;
  /** Cor de marca (hex), quando conhecida. */
  color: string | null;
}

/** `porto-seguro` → "Porto Seguro". Fallback de rótulo quando não há meta. */
function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function slugFromPath(path: string): string {
  return path.replace(/^.*\/([^/]+)\.svg$/, '$1');
}

export const BANKS: BankBrand[] = Object.entries(modules)
  .map(([path, url]) => {
    const slug = slugFromPath(path);
    const meta = BANK_META[slug] ?? {};
    return {
      slug,
      label: meta.label ?? slugToLabel(slug),
      logo: url,
      color: meta.color ?? null,
    };
  })
  .filter((b) => !IGNORED.has(b.slug))
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

const BY_SLUG = new Map(BANKS.map((b) => [b.slug, b]));

/** Resolve um slug para a marca; `null` se não for um banco conhecido. */
export function resolveBank(slug: string | null | undefined): BankBrand | null {
  if (!slug) return null;
  return BY_SLUG.get(slug) ?? null;
}
