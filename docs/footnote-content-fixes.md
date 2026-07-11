# Footnote content fixes — 9 articles (Strapi 5 edits)

**Date:** 2026-07-11 · **Audience:** whoever has Strapi admin (or Hub Studio) write access

> **Faster path:** [`footnote-fixes/`](footnote-fixes/) contains the **complete
> corrected `markdown` field for each article**, pre-validated against the
> rendering pipeline — paste each file over the article's markdown field
> wholesale (see its README). The find/replace instructions below describe the
> same fixes for review, or for hand-application if an article was edited in
> Strapi after 2026-07-11. The two "lost" citations in article 9 have since
> been **recovered from the original report PDF** and are included in the
> paste-ready file.

The Copperhead frontend fixed footnote *rendering* site-wide (v0.19.x normalizes
hand-wrapped and indented footnote definitions before parsing). Nine articles
remain broken because their **CMS source text is corrupted** — the same defects
exist verbatim in the legacy Hub 1.0 CMS, so these were authored broken, not
mangled by the Strapi 5 migration.

Each fix below is a find-and-replace inside the article's `markdown` field in
Strapi admin (Content Manager → Article → search by title or paste the
documentId into the URL). **Search strings are exact** — copy them into the
editor's find box.

After saving all edits, trigger a site rebuild (Netlify build hook — see
`docs/runbook.md`) and spot-check each article; a correct article shows **no
literal `[^…]` text anywhere** on the page.

---

## 1. Addressing Opioid Use Disorders in Community Corrections

- slug: `addressing-opioid-use-disorders-in-community-corrections-a-survey-of-illinois-probation-departments`
- documentId: `s4g1yydsa5a7h847yswpqmxv`
- Defect: the year "2018." was mangled into a footnote-definition token mid-sentence.

**Find:**

```
analysis on August 30, [^2018]: The research study
```

**Replace with:**

```
analysis on August 30, 2018. The research study
```

---

## 2. What's Next for InfoNet

- slug: `what-s-next-for-infonet-how-a-statewide-case-management-system-is-shaping-responses-to-illinois-victims`
- documentId: `v8rewjdpj0bo0df5udw9x2lk`
- Defect: the year "2013." was mangled into a footnote-definition token, gluing two paragraphs together.

**Find:**

```
growing by 30 percent since [^2013]: Illinois' Domestic Violence Act
```

**Replace with** (note the paragraph break — press Enter twice):

```
growing by 30 percent since 2013.

Illinois' Domestic Violence Act
```

---

## 3. Victimization and Help-Seeking Experiences of LGBTQ+ Individuals

- slug: `victimization-and-help-seeking-experiences-of-lgbtq-individuals`
- documentId: `fkianu62c7ijxwqy6c3opvup`
- Defect: the statistic "p = .015." was mangled into a footnote-definition token.

**Find:**

```
_p_ = .[^015]: While there were no overall differences
```

**Replace with:**

```
_p_ = .015. While there were no overall differences
```

---

## 4. Differences in Recidivism Outcomes of Illinois Prison Work Release Centers

- slug: `differences-in-recidivism-outcomes-of-illinois-prison-work-release-centers-by-participant-characteristics`
- documentId: `p4b2evls9nvhcscd5600oqvn`
- Defect: a stray empty `[^42]:` token is glued to the end of footnote 42's DOI URL (the real definition is intact). Delete the stray token.

**Find:**

```
https://doi.org/10.1177/0093854812467942[^42]:
```

**Replace with:**

```
https://doi.org/10.1177/0093854812467942
```

---

## 5. Police Use of Discretion in Encounters with People with Opioid Use Disorder

- slug: `police-use-of-discretion-in-encounters-with-people-with-opioid-use-disorder--a-study-of-illinois-police-officers`
- documentId: `bxztlwjhyfquvkj6fhzgdv46`
- Defect: a stray empty `[^34]:` token is glued to the end of the previous footnote's DOI URL (the real `[^34]:` definition follows on the next line). Delete the stray token.

**Find:**

```
https://doi.org/10.1056/NEJMsa064115[^34]:
```

**Replace with:**

```
https://doi.org/10.1056/NEJMsa064115
```

---

## 6. Child and Youth Exposure to Violence in Illinois

- slug: `child-and-youth-exposure-to-violence-in-illinois`
- documentId: `logjug9e8c9goyzbop4hthfe`
- Defect: footnote 21's definition is mislabeled `[^22]`, so the list has two `[^22]:` entries and no `[^21]:`. The first of the two (Messman-Moore / Ogloff / Widom — broad revictimization literature) belongs to reference 21 ("victimization in later years including … domestic violence, kidnapping, sexual assault, theft, and property damage"); the second (Classen — sexual re-victimization review) is correctly 22.

**Find** (the *first* of the two `[^22]:` lines):

```
[^22]: Messman-Moore & Long, 2000; Olgoff
```

**Replace with:**

```
[^21]: Messman-Moore & Long, 2000; Olgoff
```

---

## 7. Behavioral and Public Health Perspectives on Violence Prevention

- slug: `behavioral-and-public-health-perspectives-on-violence-prevention-pa-survey-of-illinois-practitioners`
- documentId: `ewucx9ir2ybndosgjpdpx0yu`
- Defect: footnote 1's definition is glued to the end of the funding-acknowledgment paragraph (`…polices of IEMA.[^1]: …`), and that glued run duplicates the entire `[^2]:` line, which itself contains TWO citations (CDC = footnote 1, Weine = footnote 2) fused together.

**Fix in two steps.**

**Step A — Find** (the glued duplicate; select from `[^1]:` through the end of the Weine citation on that same run, i.e. everything between `IEMA.` and the next line that starts with `[^2]:`):

```
IEMA.[^1]: Centers for Disease Control Foundation.
```

Delete the glued text so the paragraph simply ends:

```
IEMA.
```

**Step B — Find** (the real definition line):

```
[^2]: Centers for Disease Control Foundation. (2019). _What is public health?_
```

Split it into two definitions — relabel the CDC citation `[^1]` and start `[^2]` at the Weine citation:

```
[^1]: Centers for Disease Control Foundation. (2019). _What is public health?_. Atlanta, GA: Author. Retrieved from [https://www.cdcfoundation.org/what-public-health;](https://www.cdcfoundation.org/what-public-health;)
[^2]: Weine, S., Eisenman, D. P., Kinsler, J., Glik, D. C., & Polutnik, C. (2017). Addressing violent extremism as public health policy and practice. …
```

(Keep the rest of the Weine citation text exactly as it appears.) Definitions `[^3]`–`[^12]` are already correctly numbered — verify one or two against their in-text references after saving.

---

## 8. Criminal History Record Checks for Federally Assisted Housing Applications

- slug: `criminal-history-record-checks-for-federally-assisted-housing-applications-progress-report`
- documentId: `zcqkaje5bt9k82ap6ym10uv2`
- Defect: an off-by-one in the definition list. There are two `[^2]:` definitions and no `[^15]:`. The second `[^2]:` (Holzer — employer screening) actually belongs to reference 3 ("Criminal background checks are regularly used to screen job applicants"), which means **every definition from the Holzer line down must be renumbered +1**, through `[^14]:` → `[^15]:` (Schneider — prison-to-homelessness pipeline, which matches reference 15 on housing barriers).

Renumber, starting at the second `[^2]:`:

| Current label | New label | Citation starts with |
|---|---|---|
| `[^2]:` (second one) | `[^3]:` | Holzer, H. J., Raphael, S., & Stoll, M. A. (2007) |
| `[^3]:` | `[^4]:` | (next definition, and so on — shift every following label up by one) |
| … | … | … |
| `[^14]:` | `[^15]:` | Schneider, V. (2018). The prison to homelessness pipeline |

The **first** `[^2]:` (Bureau of Justice Statistics, *Survey of state criminal history information systems*) stays `[^2]` — it matches reference 2 ("one of every three persons had a criminal arrest record in 2014"). `[^1]:` stays as is.

---

## 9. Developing, Enhancing, and Supporting Local Economic Conditions

- slug: `developing-enhancing-and-supporting-local-economic-conditions-to-address-risk-factors-for-crime`
- documentId: `thql3xsqk4d485koo2l6ftv4`
- Defect: definitions `[^33]` and `[^34]` are **missing entirely** (the list jumps `[^32]` → `[^35]`). The citations must be recovered from the original publication (the article's attached PDF or the source report). The two orphaned references read:
  - `[^33]`: "Measures of neighborhood disadvantage, such as per capita income, proportion of households receiving public assistance, and proportion of households living under the poverty line, are directly linked to youth's association with deviant peers."
  - `[^34]`: "A 2006 study found that neighborhood disadvantage also places children at risk for early onset antisocial behavior and later criminal offending."

  ⚠️ Note while verifying: the current `[^32]:` is Ingoldsby et al. **(2006)** — a study of neighborhood disadvantage and early-starting antisocial pathways, which reads like a match for reference **34**'s "2006 study." Check the alignment of definitions 31–35 against the original PDF's endnotes; the two missing citations may sit elsewhere in that range.

Add the recovered definitions on their own lines between `[^32]:` and `[^35]:`:

```
[^33]: <citation recovered from the original report>
[^34]: <citation recovered from the original report>
```

---

## Verification checklist (after all edits + rebuild)

For each article page, confirm:

1. No literal `[^…]` text appears anywhere in the body or footnote list.
2. Every superscript reference opens its footnote toast with the *matching* citation (spot-check the renumbered ones: criminal-history 2/3/15, behavioral 1/2, child-and-youth 21/22).
3. The footnote list at the article's end is numbered without gaps.
