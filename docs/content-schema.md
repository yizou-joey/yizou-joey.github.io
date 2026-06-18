# Content Schema

Content files live in `contents/*.md`. They use simple list entries:

```md
- key: value
  key: value
```

The source of truth for machine-checkable fields is `js/site-contracts.js`.
Run `npm run check` before committing content changes. During production builds,
these Markdown files are rendered into `dist/*.html` so the deployed pages
contain complete static content before browser JavaScript runs.

## Shared Rules

- Unknown fields fail validation.
- Deprecated fields fail validation.
- Relative asset paths must point inside `public/`.
- External links must use `https://`, `http://`, or `mailto:`.
- Inline markdown is intentionally small: `**bold**`, `*italic*`, and
  `[label](url)`.
- Venue color is never written in content. Use `venueKey` and the venue
  registry.

## Venue Registry

Registered venue keys:

- `ieee-vr`: IEEE VR accent, backed by `--color-venue-ieee-vr`.
- `mmsys`: MMSys accent, backed by `--color-venue-mmsys`.

Add a new venue by updating both `js/site-contracts.js` and `css/styles.css`.

## Publications

File: `contents/publications.md`

Required fields:

- `date`: ISO date, `YYYY-MM-DD`.
- `selected`: boolean-like value, usually `true` or `false`.
- `type`: one of `C`, `J`, `W`, `P`.
- `venueKey`: registered venue key.
- `venue`: display venue text.
- `title`: publication title, inline markdown allowed.
- `authors`: author list; `\*` or `*` renders as a corresponding-author marker.

Optional fields:

- `workshopLabel`, `typeLink`
- `award`, `status`
- `paperUrl`, `youtubeUrl`, `youtubeLabel`, `videoUrl`, `demoUrl`, `arxivUrl`
- `pdfUrl`, `slidesUrl`, `posterUrl`, `codeUrl`, `doi`

Deprecated fields:

- `venueColor`
- `venueAccent`

## News

File: `contents/news.md`

Required fields:

- `date`: display date, e.g. `Mar. 25, 2026` or `Jan. 2026`.
- `text`: news copy, inline markdown allowed.

Optional fields:

- `venueKey`, required when `venueText` is present.
- `venueText`, `venueUrl`
- `award`, `awardText`
- `mascot`, `mascotAlt`

## Education

File: `contents/education.md`

Required fields:

- `period`
- `institution`
- `degree`
- `major`

Optional fields:

- `subAffiliation`
- `location`
- `logo`, `logoAlt`

## Services

File: `contents/services.md`

Required fields:

- `period`
- `role`

Optional fields:

- `event` or `detail`
- `location`
- `logo`, `logoAlt`, `logoLink`

## Teaching

File: `contents/teaching.md`

Required fields:

- `period`
- `role`

Optional fields:

- `courseCode`, `courseName`
- `institution`
- `detail`
