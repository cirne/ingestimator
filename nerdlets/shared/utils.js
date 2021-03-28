import { NrqlQuery } from 'nr1'
import { ESTIMATED_INGEST } from './constants'

export async function getValue({ select, from, where, accountId, since }) {
  select = select || ESTIMATED_INGEST

  if (Array.isArray(from)) {
    from = from.join(', ')
  }

  let nrql = `SELECT ${select} AS 'value' FROM ${from} SINCE ${since}`
  if (where) nrql = nrql + ` WHERE ${where}`

  const result = await NrqlQuery.query({ accountId, query: nrql, formatType: 'raw' })
  if (!result.data?.results && result.error) {
    if (result.error.match(/No events found/i)) {
      return 0
    }
    throw result.error
  }


  return Object.values(result.data.results[0])[0] || 0
}


export function ingestRate(value, hostCount) {
  const suffix = "GB/mo"
  if (hostCount && hostCount > 0) {
    value = value / hostCount
  }
  return `${Math.round(value)} ${suffix}`
}

export function estimatedCost(value, hostCount) {
  const suffix = "/mo"
  if (hostCount && hostCount > 0) {
    value = value / hostCount
  }
  return `$${Math.round(value * 25) / 100} ${suffix}`
}
