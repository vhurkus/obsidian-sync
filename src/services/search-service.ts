import { createClient } from '@/lib/supabase/client'
import type { Note, SearchResult } from '@/types'

export interface SearchOptions {
  query: string
  limit?: number
  includeFavorites?: boolean
  includeRecent?: boolean
  tags?: string[]
  fuzzy?: boolean
}

export interface SearchFilters {
  favorites?: boolean
  recent?: boolean
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

class SearchService {
  private supabase = createClient()

  /**
   * Full-text search using PostgreSQL tsvector
   */
  async fullTextSearch(query: string, limit: number = 50): Promise<SearchResult[]> {
    if (!query.trim()) return []

    try {
      const { data, error } = await this.supabase
        .from('search_index')
        .select(`
          note_id,
          notes!inner(
            id,
            title,
            content,
            path,
            created_at,
            updated_at,
            is_favorite,
            last_accessed_at,
            note_tags(tags(id, name, color))
          )
        `)
        .textSearch('search_text', query, {
          type: 'websearch',
          config: 'english'
        })
        .limit(limit)

      if (error) throw error

      // Transform results and calculate relevance score
      const results: SearchResult[] = data.map((item: any) => {
        const note = item.notes
        const highlights = this.extractHighlights(note.content || '', query)
        const score = this.calculateRelevanceScore(note, query)

        return {
          note: {
            ...note,
            tags: note.note_tags?.map((nt: any) => nt.tags) || []
          },
          highlights,
          score
        }
      })

      // Sort by relevance score
      return results.sort((a, b) => b.score - a.score)
    } catch (error) {
      console.error('Full-text search error:', error)
      return []
    }
  }

  /**
   * Fuzzy search for approximate matching
   */
  async fuzzySearch(query: string, limit: number = 20): Promise<SearchResult[]> {
    if (!query.trim()) return []

    try {
      // Use PostgreSQL similarity for fuzzy matching
      const { data, error } = await this.supabase
        .from('notes')
        .select(`
          *,
          note_tags(tags(id, name, color))
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .is('deleted_at', null)
        .limit(limit)

      if (error) throw error

      const results: SearchResult[] = data.map((note: any) => ({
        note: {
          ...note,
          tags: note.note_tags?.map((nt: any) => nt.tags) || []
        },
        highlights: this.extractHighlights(note.content || '', query),
        score: this.calculateFuzzyScore(note, query)
      }))

      return results.sort((a, b) => b.score - a.score)
    } catch (error) {
      console.error('Fuzzy search error:', error)
      return []
    }
  }

  /**
   * Combined search with filters
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, limit = 50, fuzzy = false } = options

    if (!query.trim()) {
      return this.getFilteredNotes(options)
    }

    // Combine full-text and fuzzy search results
    const [fullTextResults, fuzzyResults] = await Promise.all([
      this.fullTextSearch(query, Math.ceil(limit * 0.7)),
      fuzzy ? this.fuzzySearch(query, Math.ceil(limit * 0.3)) : Promise.resolve([])
    ])

    // Merge and deduplicate results
    const mergedResults = new Map<string, SearchResult>()
    
    fullTextResults.forEach(result => {
      mergedResults.set(result.note.id, result)
    })

    fuzzyResults.forEach(result => {
      if (!mergedResults.has(result.note.id)) {
        mergedResults.set(result.note.id, result)
      }
    })

    let results = Array.from(mergedResults.values())

    // Apply additional filters
    results = this.applyFilters(results, options)

    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Get recent notes
   */
  async getRecentNotes(limit: number = 10): Promise<Note[]> {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select(`
          *,
          note_tags(tags(id, name, color))
        `)
        .is('deleted_at', null)
        .order('last_accessed_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map((note: any) => ({
        ...note,
        tags: note.note_tags?.map((nt: any) => nt.tags) || []
      }))
    } catch (error) {
      console.error('Get recent notes error:', error)
      return []
    }
  }

  /**
   * Get favorite notes
   */
  async getFavoriteNotes(limit?: number): Promise<Note[]> {
    try {
      let query = this.supabase
        .from('notes')
        .select(`
          *,
          note_tags(tags(id, name, color))
        `)
        .eq('is_favorite', true)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map((note: any) => ({
        ...note,
        tags: note.note_tags?.map((nt: any) => nt.tags) || []
      }))
    } catch (error) {
      console.error('Get favorite notes error:', error)
      return []
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(noteId: string): Promise<boolean> {
    try {
      // First get current status
      const { data: note, error: fetchError } = await this.supabase
        .from('notes')
        .select('is_favorite')
        .eq('id', noteId)
        .single()

      if (fetchError) throw fetchError

      // Toggle the status
      const newStatus = !note.is_favorite

      const { error: updateError } = await this.supabase
        .from('notes')
        .update({ is_favorite: newStatus })
        .eq('id', noteId)

      if (updateError) throw updateError

      return newStatus
    } catch (error) {
      console.error('Toggle favorite error:', error)
      throw error
    }
  }

  /**
   * Update note access time
   */
  async updateAccessTime(noteId: string): Promise<void> {
    try {
      await this.supabase
        .from('notes')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', noteId)
    } catch (error) {
      console.error('Update access time error:', error)
    }
  }

  private async getFilteredNotes(options: SearchOptions): Promise<SearchResult[]> {
    try {
      let query = this.supabase
        .from('notes')
        .select(`
          *,
          note_tags(tags(id, name, color))
        `)
        .is('deleted_at', null)

      // Apply filters
      if (options.includeFavorites) {
        query = query.eq('is_favorite', true)
      }

      if (options.tags && options.tags.length > 0) {
        // Get note IDs that have the specified tags
        const { data: noteIds } = await this.supabase
          .from('note_tags')
          .select('note_id')
          .in('tag_id', options.tags)

        if (noteIds && noteIds.length > 0) {
          query = query.in('id', noteIds.map(item => item.note_id))
        } else {
          // No notes found with these tags, return empty
          return []
        }
      }

      const { data, error } = await query.limit(options.limit || 50)

      if (error) throw error

      return data.map((note: any) => ({
        note: {
          ...note,
          tags: note.note_tags?.map((nt: any) => nt.tags) || []
        },
        highlights: [],
        score: options.includeRecent ? 
          this.calculateRecencyScore(note.last_accessed_at) : 0
      }))
    } catch (error) {
      console.error('Get filtered notes error:', error)
      return []
    }
  }

  private applyFilters(results: SearchResult[], options: SearchOptions): SearchResult[] {
    let filtered = results

    if (options.includeFavorites) {
      filtered = filtered.filter(result => result.note.is_favorite)
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(result => 
        (result.note as any).tags?.some((tag: any) => options.tags!.includes(tag.id))
      )
    }

    return filtered
  }

  private extractHighlights(content: string, query: string, maxLength: number = 150): string[] {
    if (!content || !query.trim()) return []

    const words = query.toLowerCase().split(/\s+/)
    const highlights: string[] = []

    for (const word of words) {
      const regex = new RegExp(`(.{0,50})(${word})(.{0,50})`, 'gi')
      const matches = content.match(regex)
      
      if (matches) {
        matches.slice(0, 2).forEach(match => {
          if (match.length <= maxLength) {
            highlights.push('...' + match + '...')
          }
        })
      }
    }

    return highlights.slice(0, 3) // Limit to 3 highlights
  }

  private calculateRelevanceScore(note: Note, query: string): number {
    let score = 0
    const queryLower = query.toLowerCase()

    // Title match (higher weight)
    if (note.title.toLowerCase().includes(queryLower)) {
      score += 10
      if (note.title.toLowerCase().startsWith(queryLower)) {
        score += 5
      }
    }

    // Content match count
    const contentMatches = (note.content || '').toLowerCase().split(queryLower).length - 1
    score += contentMatches * 2

    // Favorite boost
    if (note.is_favorite) {
      score += 3
    }

    // Recency boost
    if (note.last_accessed_at) {
      const daysSinceAccess = (Date.now() - new Date(note.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceAccess < 7) {
        score += Math.max(0, 5 - daysSinceAccess)
      }
    }

    return score
  }

  private calculateFuzzyScore(note: Note, query: string): number {
    let score = 0
    const queryLower = query.toLowerCase()

    // Simple string similarity
    const titleSimilarity = this.stringSimilarity(note.title.toLowerCase(), queryLower)
    const contentSimilarity = this.stringSimilarity((note.content || '').toLowerCase(), queryLower)

    score += titleSimilarity * 8 + contentSimilarity * 2

    // Favorite and recency boosts
    if (note.is_favorite) score += 2
    if (note.last_accessed_at) {
      score += this.calculateRecencyScore(note.last_accessed_at)
    }

    return score
  }

  private calculateRecencyScore(lastAccessed: string | null): number {
    if (!lastAccessed) return 0

    const daysSinceAccess = (Date.now() - new Date(lastAccessed).getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, 5 - daysSinceAccess * 0.5)
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }
}

export const searchService = new SearchService()
