import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from '../../app/utils/seo'

describe('serializeJsonLd', () => {
  it('neutralizes </script> in CMS-sourced strings', () => {
    const out = serializeJsonLd({ headline: 'Attack</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c/script')
  })

  it('remains valid JSON after escaping', () => {
    const out = serializeJsonLd({ name: 'a<b', nested: { list: ['<'] } })
    expect(JSON.parse(out)).toEqual({ name: 'a<b', nested: { list: ['<'] } })
  })
})
