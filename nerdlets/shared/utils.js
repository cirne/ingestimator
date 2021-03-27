import { NrqlQuery } from 'nr1'


export const APM_EVENTS = ['Transaction', 'TransactionError', 'SqlTrace', 'TransactionTrace']
export const APM_TRACE_EVENTS = ['Span']
export const BROWSER_EVENTS = ['PageView', 'PageViewTiming', 'BrowserInteraction']
export const INFRA_EVENTS = ['SystemSample', 'NetworkSample', 'StorageSample']
export const INFRA_PROCESS_EVENTS = ['ProcessSample']
export const LOG_EVENTS = ['Log']
export const ESTIMATED_INGEST = `rate(bytecountestimate(), 1 month)/1e9`

export async function getValue({ select, from, where, accountId, since }) {
  select = select || ESTIMATED_INGEST

  if (Array.isArray(from)) {
    from = from.join(', ')
  }

  let nrql = `SELECT ${select} AS 'value' FROM ${from} SINCE ${since}`
  if (where) nrql = nrql + ` WHERE ${where}`

  const result = await NrqlQuery.query({ accountId, query: nrql, formatType: 'raw' })
  if (result.error) throw result.error


  return Object.values(result.data.raw.results[0])[0] || 0
}


export function ingestRate(value, hostCount) {
  let suffix = "GB/mo"
  if (hostCount && hostCount > 0) {
    value = value / hostCount
    suffix = "GB/host/mo"
  }
  return `${Math.round(value)} ${suffix}`
}

export function estimatedCost(value, hostCount) {
  let suffix = "/mo"
  if (hostCount && hostCount > 0) {
    value = value / hostCount
    suffix = "/host/mo"
  }
  return `$${Math.round(value * 25) / 100} ${suffix}`
}
