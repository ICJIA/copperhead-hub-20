// UI preferences for the annotation tool: remembered reviewer name and
// last-used swatch. A distinct "-ui-v1" prefix (studio precedent) keeps
// preferences visually separate from any data keys. Storage failures
// (private windows, quota) degrade silently to in-memory so the tool keeps
// working for the session.
import { ANNOTATION_COLORS, type AnnotationColor } from '~/types/annotations'

const NAME_KEY = 'copperhead-annotations-ui-v1:name'
const COLOR_KEY = 'copperhead-annotations-ui-v1:color'

export interface AnnotationPrefs {
  getName(): string
  setName(name: string): void
  getColor(): AnnotationColor | null
  setColor(color: AnnotationColor): void
}

export function createAnnotationPrefs(storage?: Storage | null): AnnotationPrefs {
  const memory = new Map<string, string>()
  function read(key: string): string {
    try { return storage?.getItem(key) ?? memory.get(key) ?? '' }
    catch { return memory.get(key) ?? '' }
  }
  function write(key: string, value: string): void {
    memory.set(key, value)
    try { storage?.setItem(key, value) } catch { /* preference only */ }
  }
  return {
    getName: () => read(NAME_KEY),
    setName: (name) => write(NAME_KEY, name),
    getColor: () => {
      const c = read(COLOR_KEY)
      return (ANNOTATION_COLORS as readonly string[]).includes(c) ? (c as AnnotationColor) : null
    },
    setColor: (c) => write(COLOR_KEY, c),
  }
}

/** App-wide instance over window.localStorage (guarded for SSR). */
export const annotationPrefs: AnnotationPrefs = createAnnotationPrefs(
  typeof window === 'undefined' ? null : window.localStorage,
)
