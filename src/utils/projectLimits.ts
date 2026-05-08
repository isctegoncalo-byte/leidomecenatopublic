import { NeedItem } from '../types'

export type ProjectSupportType = 'dinheiro' | 'produtos'

export const PROJECT_TYPE_LIMIT_MESSAGE =
  'Só pode ter ativo 1 projeto a pedir dinheiro e 1 projeto a pedir produto/serviço. Conclua ou remova o projeto ativo desse tipo antes de criar outro.'

export const projectSupportType = (need: Pick<NeedItem, 'supportType'>): ProjectSupportType =>
  need.supportType === 'produtos' ? 'produtos' : 'dinheiro'

export const isStoredProjectActive = (need: Pick<NeedItem, 'status'>): boolean =>
  (need.status || 'ativo') !== 'concluido'

export const activeProjectTypes = (
  needs: NeedItem[],
  isComplete?: (need: NeedItem) => boolean,
): Set<ProjectSupportType> => new Set(
  needs
    .filter(need => isStoredProjectActive(need) && !(isComplete?.(need) || false))
    .map(projectSupportType),
)

export const hasActiveProjectOfType = (
  needs: NeedItem[],
  type: ProjectSupportType,
  isComplete?: (need: NeedItem) => boolean,
): boolean => activeProjectTypes(needs, isComplete).has(type)

export const nextAvailableProjectType = (
  needs: NeedItem[],
  isComplete?: (need: NeedItem) => boolean,
): ProjectSupportType | null => {
  const activeTypes = activeProjectTypes(needs, isComplete)
  if (!activeTypes.has('dinheiro')) return 'dinheiro'
  if (!activeTypes.has('produtos')) return 'produtos'
  return null
}

export const duplicateActiveProjectTypeMessage = (
  needs: NeedItem[],
  isComplete?: (need: NeedItem) => boolean,
): string | null => {
  const activeCounts = needs.reduce<Record<ProjectSupportType, number>>((acc, need) => {
    if (isStoredProjectActive(need) && !(isComplete?.(need) || false)) {
      acc[projectSupportType(need)] += 1
    }
    return acc
  }, { dinheiro: 0, produtos: 0 })

  return activeCounts.dinheiro > 1 || activeCounts.produtos > 1
    ? PROJECT_TYPE_LIMIT_MESSAGE
    : null
}
