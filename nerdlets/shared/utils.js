import { NrqlQuery } from 'nr1'
import { ESTIMATED_INGEST_GB } from './constants'

export async function getValue({ select, from, where, accountId, since }) {
  select = select || ESTIMATED_INGEST_GB

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


  return getResultValue(result.data.results[0]) || 0
}

export function getResultValue(result) {
  return Object.values(result)[0]
}


export function ingestRate(value, hostCount) {
  if (hostCount && hostCount > 0) {
    value = value / hostCount
  }
  return `${gigabytes(value)} /mo`
}

export function estimatedCost(value, hostCount) {
  const suffix = "/mo"
  if (hostCount && hostCount > 0) {
    value = value / hostCount
  }
  const cost = Math.round(value * 25) / 100
  const dollars = cost.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return `${dollars} ${suffix}`
}


export function gigabytes(value, isDelta) {
  value = value * 1e9
  const plus = isDelta && value > 0 ? "+" : ""
  let divisor, suffix
  if (Math.abs(value) > 1e15) {
    divisor = 1e15
    suffix = 'PB'
  }
  else if (Math.abs(value) > 1e12) {
    divisor = 1e12
    suffix = 'TB'
  }
  else {
    divisor = 1e9
    suffix = 'GB'
  }

  return `${plus}${Math.round(value / divisor * 10) / 10} ${suffix}`
}
