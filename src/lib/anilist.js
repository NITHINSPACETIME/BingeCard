const ANILIST_ENDPOINT = 'https://graphql.anilist.co'

export class BingeCardError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message)
    this.name = 'BingeCardError'
    this.code = code
  }
}

export function parseMediaInput(rawInput) {
  const input = rawInput.trim()
  if (!input) throw new BingeCardError('Enter a title or paste an AniList / MyAnimeList link.', 'EMPTY_INPUT')

  const looksLikeUrl = /^(https?:\/\/|www\.)/i.test(input) || /^(anilist\.co|myanimelist\.net)\//i.test(input)
  if (!looksLikeUrl) return { kind: 'search', query: input }

  let url
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
  } catch {
    throw new BingeCardError('That link does not look valid. Try pasting it again.', 'INVALID_URL')
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const source = host === 'anilist.co' ? 'ANILIST' : host === 'myanimelist.net' ? 'MAL' : null
  if (!source) throw new BingeCardError('Only AniList and MyAnimeList links are supported right now.', 'UNSUPPORTED_URL')

  const match = url.pathname.match(/^\/(anime|manga)\/(\d+)(?:\/|$)/i)
  if (!match) throw new BingeCardError('Use a direct anime or manga page link, not a profile or list link.', 'INVALID_MEDIA_URL')

  return {
    kind: 'reference',
    source,
    mediaType: match[1].toUpperCase(),
    id: Number(match[2]),
  }
}

function stripHtml(value = '') {
  if (!value) return ''
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeMedia(media) {
  const preferredTitle = media.title.english || media.title.romaji || media.title.native || 'Untitled'
  const secondaryTitle = media.title.english && media.title.romaji !== media.title.english ? media.title.romaji : media.title.native

  return {
    id: media.id,
    idMal: media.idMal,
    type: media.type,
    title: preferredTitle,
    secondaryTitle,
    description: stripHtml(media.description),
    cover: media.coverImage?.extraLarge || media.coverImage?.large || '',
    coverColor: media.coverImage?.color || '#8b5cf6',
    banner: media.bannerImage || '',
    episodes: media.episodes,
    chapters: media.chapters,
    volumes: media.volumes,
    duration: media.duration,
    format: media.format,
    status: media.status,
    score: media.averageScore,
    popularity: media.popularity,
    favourites: media.favourites,
    genres: media.genres || [],
    year: media.startDate?.year,
    country: media.countryOfOrigin,
    isAdult: media.isAdult,
    siteUrl: media.siteUrl,
    studio: media.studios?.nodes?.[0]?.name || null,
    nextAiringEpisode: media.nextAiringEpisode || null,
  }
}

const MEDIA_FIELDS = `
  id idMal type format status episodes chapters volumes duration
  averageScore popularity favourites genres countryOfOrigin isAdult siteUrl description
  title { english romaji native }
  coverImage { extraLarge large color }
  bannerImage
  startDate { year }
  studios(isMain: true) { nodes { name } }
  nextAiringEpisode { episode airingAt }
`

async function request(query, variables, signal) {
  let response
  try {
    response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new BingeCardError('Could not reach AniList. Check your connection and try again.', 'NETWORK')
  }

  if (response.status === 429) throw new BingeCardError('AniList is receiving too many requests. Give it a moment and retry.', 'RATE_LIMIT')
  if (!response.ok) throw new BingeCardError(`AniList returned an error (${response.status}). Try again shortly.`, 'API_ERROR')

  const payload = await response.json()
  if (payload.errors?.length) throw new BingeCardError(payload.errors[0].message || 'AniList could not complete that search.', 'GRAPHQL_ERROR')
  return payload.data
}

export async function searchMedia(rawInput, signal) {
  const parsed = parseMediaInput(rawInput)
  if (parsed.kind === 'reference') return [await fetchMediaFromReference(parsed, signal)]

  const query = `query SearchMedia($search: String!) {
    Page(page: 1, perPage: 8) {
      media(search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC], isAdult: false) { ${MEDIA_FIELDS} }
    }
  }`
  const data = await request(query, { search: parsed.query }, signal)
  return (data.Page?.media || []).map(normalizeMedia)
}

export async function fetchMediaFromReference(reference, signal) {
  const idArgument = reference.source === 'MAL' ? 'idMal: $id' : 'id: $id'
  const query = `query MediaById($id: Int!, $type: MediaType!) {
    Media(${idArgument}, type: $type) { ${MEDIA_FIELDS} }
  }`
  const data = await request(query, { id: reference.id, type: reference.mediaType }, signal)
  if (!data.Media) throw new BingeCardError('No matching title was found for that link.', 'NOT_FOUND')
  return normalizeMedia(data.Media)
}

export function getMediaTotal(media) {
  return media.type === 'ANIME' ? media.episodes : media.chapters
}