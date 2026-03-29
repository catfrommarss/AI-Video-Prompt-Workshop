import type { AppSettings, Project } from './types'
import { v4 as uuid } from 'uuid'

const SETTINGS_KEY = 'runway-prompt-settings'
const DB_NAME = 'storyboard-ai'
const DB_VERSION = 1
const STORE_NAME = 'projects'

// --- Settings (small data, keep in localStorage) ---

export function loadSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (raw) return JSON.parse(raw)
  return {
    apiKey: '',
    apiModel: 'anthropic/claude-sonnet-4',
    customPrompt: '',
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// --- Projects (large data with images, use IndexedDB) ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadProjects(): Promise<Project[]> {
  // Migrate from localStorage if needed
  const legacyRaw = localStorage.getItem('runway-prompt-projects')
  if (legacyRaw) {
    try {
      const legacyProjects: Project[] = JSON.parse(legacyRaw)
      if (legacyProjects.length > 0) {
        const db = await openDB()
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        for (const p of legacyProjects) {
          store.put(p)
        }
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
        db.close()
      }
    } catch {
      // ignore migration errors
    }
    localStorage.removeItem('runway-prompt-projects')
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      db.close()
      const projects = request.result as Project[]
      projects.sort((a, b) => b.updatedAt - a.updatedAt)
      resolve(projects)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(project)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export function createProject(name: string): Project {
  return {
    id: uuid(),
    name,
    story: '',
    characters: [],
    shots: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
