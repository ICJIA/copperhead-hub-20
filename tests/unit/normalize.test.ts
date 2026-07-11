import { describe, expect, it } from 'vitest'
import {
  absolutizeMediaUrl,
  normalizeApp,
  safeHttpUrl,
  normalizeArticle,
  normalizeAuthors,
  normalizeCenter,
  normalizeDataset,
  normalizeMedia,
  normalizeProject,
} from '../../app/utils/normalize'
import articlesFixture from '../fixtures/articles.json'
import datasetsFixture from '../fixtures/datasets.json'
import appsFixture from '../fixtures/apps.json'
import projectsFixture from '../fixtures/projects.json'
import centersFixture from '../fixtures/centers.json'

const ORIGIN = 'https://v2.hub.icjia-api.cloud'

describe('absolutizeMediaUrl', () => {
  it('prefixes the CMS origin onto relative /uploads paths', () => {
    expect(absolutizeMediaUrl('/uploads/report.pdf', ORIGIN)).toBe(`${ORIGIN}/uploads/report.pdf`)
  })

  it('leaves absolute URLs untouched', () => {
    expect(absolutizeMediaUrl('https://cdn.example.gov/x.pdf', ORIGIN)).toBe('https://cdn.example.gov/x.pdf')
  })
})

describe('normalizeAuthors', () => {
  it('maps { title, description } components to { name, bio }', () => {
    expect(normalizeAuthors([{ title: 'Jane Doe', description: 'Researcher' }]))
      .toEqual([{ name: 'Jane Doe', bio: 'Researcher' }])
  })

  it('accepts plain-string author lists (projects)', () => {
    expect(normalizeAuthors(['Jack Monaghan'])).toEqual([{ name: 'Jack Monaghan' }])
  })

  it('drops malformed entries instead of crashing', () => {
    expect(normalizeAuthors([null, {}, { title: 'Ok' }])).toEqual([{ name: 'Ok' }])
  })
})

describe('normalizeArticle (live fixture)', () => {
  const article = normalizeArticle(articlesFixture.data[0]!, ORIGIN)

  it('carries identity and taxonomy through', () => {
    expect(article.documentId).toBeTruthy()
    expect(article.slug).toBeTruthy()
    expect(article.title).toBeTruthy()
    expect(Array.isArray(article.categories)).toBe(true)
    expect(Array.isArray(article.tags)).toBe(true)
  })

  it('absolutizes every media URL', () => {
    for (const media of [article.splash, article.thumbnail, article.mainfile, article.extrafile]) {
      if (media) expect(media.url).toMatch(/^https?:\/\//)
    }
  })

  it('normalizes authors to named objects', () => {
    for (const author of article.authors) expect(author.name).toBeTruthy()
  })
})

describe('normalizeDataset (live fixture)', () => {
  const dataset = normalizeDataset(datasetsFixture.data[0]!, ORIGIN)

  it('keeps sources, notes, and variables as clean arrays', () => {
    expect(Array.isArray(dataset.sources)).toBe(true)
    expect(Array.isArray(dataset.notes)).toBe(true)
    expect(Array.isArray(dataset.variables)).toBe(true)
    for (const v of dataset.variables) expect(v.name).toBeTruthy()
  })
})

describe('normalizeApp (live fixture)', () => {
  const app = normalizeApp(appsFixture.data[0]!, ORIGIN)

  it('preserves editorial status (published vs archived)', () => {
    expect(['published', 'archived']).toContain(app.status)
  })
})

describe('normalizeProject (live fixture) — PascalCase absorption', () => {
  const project = normalizeProject(projectsFixture.data[0]!)

  it('maps Title/SubTitle/Body/Authors to lowercase domain fields', () => {
    expect(project.title).toBeTruthy()
    expect(project.body).toBeTruthy()
    expect(Array.isArray(project.authors)).toBe(true)
  })

  it('quarantines CMS presentation hints in *Raw fields', () => {
    expect(project).not.toHaveProperty('headerBg')
    expect(project).not.toHaveProperty('icon')
  })
})

describe('normalizeCenter (live fixture) — PascalCase absorption', () => {
  const center = normalizeCenter(centersFixture.data[0]!)

  it('maps Title/Description to lowercase domain fields', () => {
    expect(center.title).toBeTruthy()
    expect(center.description).toBeTruthy()
  })
})

describe('safeHttpUrl', () => {
  it('passes http(s) URLs through', () => {
    expect(safeHttpUrl('https://example.gov/x')).toBe('https://example.gov/x')
    expect(safeHttpUrl('http://example.gov')).toBe('http://example.gov')
  })

  it('drops javascript:, data:, and other non-web schemes', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined()
    expect(safeHttpUrl('vbscript:x')).toBeUndefined()
    expect(safeHttpUrl(' JavaScript:alert(1)')).toBeUndefined()
  })

  it('drops empty and non-string input', () => {
    expect(safeHttpUrl('')).toBeUndefined()
    expect(safeHttpUrl(null)).toBeUndefined()
  })
})

describe('normalizeApp URL filtering', () => {
  it('drops a javascript: app URL (href sink)', () => {
    const app = normalizeApp({ documentId: 'x', slug: 'x', title: 'X', url: 'javascript:alert(1)' }, ORIGIN)
    expect(app.url).toBeUndefined()
  })
})

describe('normalizeMedia', () => {
  it('returns undefined for null media instead of a hollow object', () => {
    expect(normalizeMedia(null, ORIGIN)).toBeUndefined()
    expect(normalizeMedia({}, ORIGIN)).toBeUndefined()
  })
})
