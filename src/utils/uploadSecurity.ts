const MB = 1024 * 1024

const documentTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const documentExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'])

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp'])

export const ACCEPTED_DOCUMENT_INPUT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
export const ACCEPTED_IMAGE_INPUT = '.jpg,.jpeg,.png,.webp'

export function fileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 140)
}

function validateFile(file: File, allowedTypes: Set<string>, allowedExtensions: Set<string>, maxBytes: number, label: string) {
  const ext = fileExtension(file.name)
  const type = (file.type || '').toLowerCase()

  if (!allowedExtensions.has(ext)) {
    return `${label}: formato nao permitido. Use ${[...allowedExtensions].join(', ')}.`
  }
  if (!allowedTypes.has(type)) {
    return `${label}: tipo de ficheiro nao permitido ou desconhecido.`
  }
  if (file.size <= 0) {
    return `${label}: o ficheiro esta vazio.`
  }
  if (file.size > maxBytes) {
    return `${label}: o ficheiro excede ${(maxBytes / MB).toFixed(0)} MB.`
  }
  return null
}

export function validateDocumentUpload(file: File) {
  return validateFile(file, documentTypes, documentExtensions, 10 * MB, 'Documento')
}

export function validateImageUpload(file: File) {
  return validateFile(file, imageTypes, imageExtensions, 5 * MB, 'Imagem')
}

export function safeUploadName(fileName: string) {
  return cleanFileName(fileName) || `ficheiro-${Date.now()}`
}
