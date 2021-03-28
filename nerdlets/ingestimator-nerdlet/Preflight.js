import { NrqlQuery } from 'nr1'
import Ingestimator from './Ingestimator'
import { Loading } from './Loading'

export default function NrConsumptionQuery({ since, accountId }) {
  const query = `FROM NrConsumption SELECT rate(sum(GigabytesIngested), 1 month) ` +
    `WHERE productLine = 'DataPlatform' FACET usageMetric SINCE ${since} LIMIT 20`

  return <NrqlQuery accountId={accountId} query={query} formatType="raw">
    {({ loading, data }) => {
      if (loading || !data) return <Loading percentDone={0} stage="Consumption Actuals" />
      const consumptionIngest = { TotalBytes: data.totalResult.results[0].result }
      data.facets.forEach(facet => {
        consumptionIngest[facet.name] = facet.results[0].result
      })

      let clampedTimeRange = false
      if (consumptionIngest.MetricsBytes > 500000) {
        since = "3 hours ago"
        clampedTimeRange = true
      }

      return <Ingestimator
        consumptionIngest={consumptionIngest}
        accountId={accountId}
        clampedTimeRange={clampedTimeRange}
        since={since} />
    }}
  </NrqlQuery>
}


