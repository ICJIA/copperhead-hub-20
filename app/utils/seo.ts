/**
 * Serialize an object for embedding in a JSON-LD <script> tag.
 *
 * JSON.stringify does NOT escape "</script>", so CMS-sourced strings
 * (titles, descriptions) could otherwise break out of the script element
 * and inject markup. Escaping "<" as < is the standard defense and
 * remains valid JSON.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
