import { NrqlQuery, Grid, GridItem } from 'nr1'
import { ingestRate } from '../shared/utils'
import Details from './Details'
import Ingestimator from './Ingestimator'
import { Loading } from './Loading'

export default function Preflight({ since, accountId }) {
  const query = `FROM NrConsumption SELECT rate(sum(GigabytesIngested), 1 month) ` +
    `WHERE productLine = 'DataPlatform' AND consumingAccountId = ${accountId}` +
    `FACET usageMetric SINCE ${since} LIMIT 20`

  return <NrqlQuery accountId={accountId} query={query} formatType="raw">
    {({ loading, data }) => {
      if (loading || !data) return <Loading percentDone={0} stage="Consumption Actuals" />
      const consumptionIngest = { TotalBytes: data.totalResult.results[0].result }
      data.facets.forEach(facet => {
        consumptionIngest[facet.name] = facet.results[0].result
      })

      let clampedTimeRange = false
      if (consumptionIngest.MetricsBytes > 500000 || consumptionIngest.ApmEventsBytes > 10000) {
        since = "3 hours ago"
        clampedTimeRange = true
      }

      return <div>
        <ClampedTimeRangeNotification
          visible={clampedTimeRange}
          since={since}
          metricsIngest={consumptionIngest.MetricsBytes} />
        <Grid>
          <GridItem columnSpan={6}>
            <Ingestimator
              consumptionIngest={consumptionIngest}
              accountId={accountId}
              clampedTimeRange={clampedTimeRange}
              since={since} />
          </GridItem>
          <GridItem columnSpan={6}>
            <Details accountId={accountId} since={since} />
          </GridItem>
        </Grid>
      </div>
    }}
  </NrqlQuery>
}


function ClampedTimeRangeNotification({ visible, since }) {
  if (!visible) return ""

  return <div className="notice">
    Due to high data volumes in this account, data analysis restricted to {since}.
  </div>
}