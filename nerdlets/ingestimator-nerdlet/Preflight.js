import { NrqlQuery, Grid, GridItem } from 'nr1'
import { ingestRate } from '../shared/utils'
import ApplicationTable from './ApplicationTable'
import Ingestimator from './Ingestimator'
import { Loading } from './Loading'

export default function NrConsumptionQuery({ since, accountId }) {
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
      if (consumptionIngest.MetricsBytes > 500000) {
        since = "3 hours ago"
        clampedTimeRange = true
      }

      return <div>
        <ClampedTimeRangeNotification
          visible={clampedTimeRange}
          since={since}
          metricsIngest={consumptionIngest.MetricsBytes} />
        <Grid>
          <GridItem columnSpan={7}>
            <Ingestimator
              consumptionIngest={consumptionIngest}
              accountId={accountId}
              clampedTimeRange={clampedTimeRange}
              since={since} />
          </GridItem>
          <GridItem columnSpan={5}>
            <ApplicationTable accountId={accountId} since={since} />
          </GridItem>
        </Grid>
      </div>
    }}
  </NrqlQuery>
}


function ClampedTimeRangeNotification({ visible, since, metricsIngest }) {
  if (!visible) return ""

  return <div className="notice">
    <h3>Shortened Time Range</h3>
    <p>
      In order to estimate APM Metrics Ingest, <strong>Ingestimator</strong> must inspect
      every byte of metric data ingested in your account over the specified time range.
    </p><p>
      This account has an estimated monthly metrics ingest of {ingestRate(metricsIngest)}, which is too
      much to analyze over very long time ranges.
    </p><p>
      As a result, the time range used to estimate your APM ingest rate is extrapolated
      from telemetry ingested since {since}.
    </p>
  </div>
}