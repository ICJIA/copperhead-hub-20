// One page = one thread namespace. Annotations key on the route path with
// the baseURL stripped, so the same page shares threads on localhost, the
// Netlify preview origin, and the production proxy (URL-parity contract).
import { hub } from '../../../hub.config.mjs'

export function normalizePagePath(path: string): string {
  let p = (path || '/').split('#')[0]!.split('?')[0]!
  const base = hub.site.baseURL.replace(/\/+$/, '') // '/researchhub'
  if (base && (p === base || p.startsWith(`${base}/`))) p = p.slice(base.length)
  if (!p.startsWith('/')) p = `/${p}`
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p === '' ? '/' : p
}
