import { NeedItem } from '../types'

export function projectTarget(need: NeedItem): number {
  return need.requestedAmount || need.estimatedValue || need.totalProjectCost || 0
}

export function projectSecured(need: NeedItem): number {
  return Math.max(0, need.securedFunding || 0)
}

export function projectProgress(need: NeedItem): number {
  const target = projectTarget(need)
  if (!target) return 0
  return Math.min(100, Math.round((projectSecured(need) / target) * 100))
}

export function isProjectComplete(need: NeedItem): boolean {
  return need.status === 'concluido' || projectProgress(need) >= 100
}

export function activeProjects(needs: NeedItem[]): NeedItem[] {
  return needs.filter(need => !isProjectComplete(need))
}

export function completedProjects(needs: NeedItem[]): NeedItem[] {
  return needs.filter(isProjectComplete)
}

export function supportTypeLabel(need: NeedItem): string {
  return need.supportType === 'produtos' ? 'Produto/servico' : 'Verba'
}
