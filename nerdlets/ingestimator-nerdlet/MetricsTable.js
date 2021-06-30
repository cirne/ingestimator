import React from "react"
import { NrqlQuery, Spinner, Link, Icon, navigation } from 'nr1'

import {
  APM_EVENTS,
  APM_TRACE_EVENTS,
  ESTIMATED_INGEST_GB,
  INEFFECTIVE_METRICS_PERCENTAGE,
  METRIC_EVENTS,
  WHERE_METRIC_APM
} from "../shared/constants"
import { estimatedCost, getResultValue, ingestRate, potentialSavings } from "../shared/utils"

const LIMIT = 40


export default function MetricsTableLoader({ accountId, since }) {
  const query = `SELECT ${ESTIMATED_INGEST_GB}, cardinality(), ${INEFFECTIVE_METRICS_PERCENTAGE} FROM ${METRIC_EVENTS} SINCE ${since} FACET metricName RAW LIMIT ${LIMIT}`
  return <NrqlQuery accountId={accountId} query={query} formatType="raw">
    {({ loading, data }) => {
      if (loading || !data) return <Spinner />
      return <MetricsTable rows={data.facets} />
    }}
  </NrqlQuery>
}

const potentialSavingsDetector = (accumulator, row) => accumulator || getResultValue(row.results[2]) > 0;

function MetricsTable({ rows }) {
  const potentialSavingsPresent = rows.reduce(potentialSavingsDetector, false)
  return <div className="applications-table">
    <h4>Top Metrics by Ingest</h4>
    <table >
      <thead>
        <tr>
          <th>Metric</th>
          <th>Cardinality</th>
          <th>GB/mo</th>
          <th>Cost/mo</th>
          { potentialSavingsPresent && (
            <th>Potential Savings</th>
           ) }
        </tr>
      </thead>
      <tbody>
        {rows.map(row => <tr key={row.name}>
          <td>{row.name}</td>
          <td className="right">{getResultValue(row.results[1])}</td>
          <td className="right">{ingestRate(getResultValue(row.results[0]))}</td>
          <td className="right">{estimatedCost(getResultValue(row.results[0]))}</td>
          { potentialSavingsPresent && (
            <td className="right">{potentialSavings(getResultValue(row.results[2]), getResultValue(row.results[0]))}</td>
          )}
        </tr>)}
      </tbody>
    </table>
  </div>

}