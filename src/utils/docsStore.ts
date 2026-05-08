import { UploadedDoc } from '../types'
import { validateDocumentUpload } from './uploadSecurity'

const DOCS_KEY = 'leidomecenato_docs'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function listDocs(ownerId: string): UploadedDoc[] {
  return readJson<UploadedDoc[]>(DOCS_KEY, []).filter(d => d.ownerId === ownerId)
}

export function getDoc(id: string): UploadedDoc | null {
  return readJson<UploadedDoc[]>(DOCS_KEY, []).find(d => d.id === id) || null
}

export function addDoc(doc: Omit<UploadedDoc, 'id' | 'uploadedAt'>): UploadedDoc {
  const newDoc: UploadedDoc = {
    ...doc,
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    uploadedAt: new Date().toISOString(),
  }
  const all = readJson<UploadedDoc[]>(DOCS_KEY, [])
  writeJson(DOCS_KEY, [...all, newDoc])
  return newDoc
}

export function deleteDoc(id: string) {
  const all = readJson<UploadedDoc[]>(DOCS_KEY, [])
  writeJson(DOCS_KEY, all.filter(d => d.id !== id))
}

export function readFileAsDataUrl(file: File): Promise<string> {
  const validationError = validateDocumentUpload(file)
  if (validationError) return Promise.reject(new Error(validationError))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
