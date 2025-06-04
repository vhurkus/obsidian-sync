// Mock Auth Service for testing without Supabase
export const mockAuthService = {
  signUp: async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Store in localStorage for demo
    const user = { 
      id: 'mock-user-' + Date.now(), 
      email, 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    localStorage.setItem('mock-user', JSON.stringify(user))
    localStorage.setItem('mock-session', JSON.stringify({
      access_token: 'mock-token-' + Date.now(),
      user
    }))
    
    return { data: { user }, error: null }
  },

  signIn: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const user = { 
      id: 'mock-user-' + Date.now(), 
      email, 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    localStorage.setItem('mock-user', JSON.stringify(user))
    localStorage.setItem('mock-session', JSON.stringify({
      access_token: 'mock-token-' + Date.now(),
      user
    }))
    
    return { data: { user }, error: null }
  },

  getUser: async () => {
    const session = localStorage.getItem('mock-session')
    if (session) {
      return { data: { user: JSON.parse(session).user }, error: null }
    }
    return { data: { user: null }, error: null }
  },

  getCurrentUser: async () => {
    const session = localStorage.getItem('mock-session')
    if (session) {
      return { data: { user: JSON.parse(session).user }, error: null }
    }
    return { data: { user: null }, error: null }
  },

  signOut: async () => {
    localStorage.removeItem('mock-user')
    localStorage.removeItem('mock-session')
    return { error: null }
  }
}

// Mock notes service
export const mockNotesService = {
  notes: [] as any[],
  
  async getNotes() {
    const notes = JSON.parse(localStorage.getItem('mock-notes') || '[]')
    return { data: notes, error: null }
  },
  
  async createNote(note: any) {
    const notes = JSON.parse(localStorage.getItem('mock-notes') || '[]')
    const newNote = {
      ...note,
      id: 'note-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id'
    }
    notes.push(newNote)
    localStorage.setItem('mock-notes', JSON.stringify(notes))
    return { data: newNote, error: null }
  },
  
  async updateNote(id: string, updates: any) {
    const notes = JSON.parse(localStorage.getItem('mock-notes') || '[]')
    const index = notes.findIndex((n: any) => n.id === id)
    if (index >= 0) {
      notes[index] = { ...notes[index], ...updates, updated_at: new Date().toISOString() }
      localStorage.setItem('mock-notes', JSON.stringify(notes))
      return { data: notes[index], error: null }
    }
    return { data: null, error: 'Note not found' }
  },
  
  async deleteNote(id: string) {
    const notes = JSON.parse(localStorage.getItem('mock-notes') || '[]')
    const filtered = notes.filter((n: any) => n.id !== id)
    localStorage.setItem('mock-notes', JSON.stringify(filtered))
    return { error: null }
  }
}
