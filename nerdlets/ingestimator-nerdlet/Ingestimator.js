import React from 'react'
import { Spinner, logger, NrqlQuery } from 'nr1'
import {
  APM_EVENTS, APM_TRACE_EVENTS,
  INFRA_EVENTS, INFRA_PROCESS_EVENTS,
  METRIC_EVENTS,
  WHERE_METRIC_APM,
} from '../shared/constants'

import { getValue, ingestRate, estimatedCost } from '../shared/utils'

export default function NrConsumptionQuery({ since, accountId }) {
  const query = `FROM NrConsumption SELECT rate(sum(GigabytesIngested), 1 month) ` +
    `WHERE productLine = 'DataPlatform' FACET usageMetric SINCE ${since} LIMIT 20`

  return <NrqlQuery accountId={accountId} query={query} formatType="raw">
    {({ loading, data }) => {
      if (loading || !data) return <Spinner />
      const consumptionIngest = { TotalBytes: data.totalResult.results[0].result }
      data.facets.forEach(facet => {
        consumptionIngest[facet.name] = facet.results[0].result
      })

      return <Ingestimator consumptionIngest={consumptionIngest} accountId={accountId} since={since} />
    }}
  </NrqlQuery>
}

const STEP_COUNT = 8
export class Ingestimator extends React.PureComponent {

  state = { loading: "true", step: 0 }

  async componentDidMount() {
    this.load()
  }

  componentDidUpdate({ accountId, since }) {
    if (!accountId || !since) {
      this.setState({ loading: true })
    }
    else if (accountId != this.props.accountId || since != this.props.since) {
      this.load()
    }
  }

  async load() {
    const { consumptionIngest } = this.props
    await this.setState({ loading: true, step: 0 })

    const apmMetricsIngest = await this.querySingleValue({ title: "APM Metrics", from: METRIC_EVENTS, where: WHERE_METRIC_APM })
    const apmEventsIngest = await this.querySingleValue({ title: "APM Events", from: APM_EVENTS })
    const apmTraceIngest = await this.querySingleValue({ title: "APM Traces", from: APM_TRACE_EVENTS })
    const totalApmIngest = apmEventsIngest + apmMetricsIngest + apmTraceIngest
    const apmHostCount = await this.querySingleValue({ title: "APM Hosts", select: 'uniqueCount(host)', from: APM_EVENTS[0] })

    const infraIngest = await this.querySingleValue({ title: "Infra", from: INFRA_EVENTS })
    const infraProcessIngest = await this.querySingleValue({ title: "Infra Process", from: INFRA_PROCESS_EVENTS })
    const totalInfraIngest = infraIngest + infraProcessIngest
    const infraHostCount = await this.querySingleValue({ title: "Infra Hosts", select: 'uniqueCount(hostname)', from: INFRA_EVENTS[0] })

    const mobileIngest = consumptionIngest.MobileBytes || 0
    const browserIngest = consumptionIngest.BrowserBytes || 0
    const logsIngest = consumptionIngest.LoggingBytes || 0
    const otherMetricsIngest = (consumptionIngest.MetricsBytes || 0) - apmMetricsIngest
    const allIngest = consumptionIngest.TotalBytes
    const otherIngest = Math.max(allIngest - totalApmIngest - totalInfraIngest - mobileIngest - browserIngest - logsIngest - otherMetricsIngest, 0)

    this.setState({
      apmMetricsIngest, apmEventsIngest, apmTraceIngest, totalApmIngest,
      infraIngest, infraProcessIngest, totalInfraIngest,
      apmHostCount, infraHostCount,
      mobileIngest, browserIngest, logsIngest, otherMetricsIngest,
      otherIngest, allIngest,
      loading: false
    })
  }

  async querySingleValue({ title, select, from, where }) {
    this.setState({ step: this.state.step + 1, stage: title })

    try {
      const { accountId, since } = this.props
      logger.log("Get Value", select || "Ingest Rate", from)
      const value = await getValue({ select, from, where, accountId, since })
      logger.log("Get Value", select || "Ingest Rate", from, value)
      return value
    }
    catch (e) {
      logger.error("Query Error", error, select, from)
      return 0
    }
  }

  render() {
    const { loading, step, stage } = this.state
    const percentDone = Math.round(step * 100 / STEP_COUNT)
    if (loading) return <Loading percentDone={percentDone} stage={stage} />

    return <table className="ingestimator">
      <thead>
        <tr>
          <th colSpan={2}>Category</th>
          <th>Data Ingest per Month</th>
          <th>Estimated Cost per Month</th>
        </tr>
      </thead>
      <tbody>
        <tr className="section">
          <td>APM</td>
          <td><em>{this.state.apmHostCount} hosts</em></td>
          <td colSpan={2} />
        </tr>
        <IngestRow className="detail" title="Metrics" ingest={this.state.apmMetricsIngest} />
        <IngestRow className="detail" title="Events" ingest={this.state.apmEventsIngest} />
        <IngestRow className="detail" title="Traces" ingest={this.state.apmTraceIngest} />
        <IngestRow className="subTotal" title="Total APM" ingest={this.state.totalApmIngest} />
        <IngestRow title="Average APM per Host" ingest={this.state.totalApmIngest} hostCount={this.state.apmHostCount} />

        <tr className="section">
          <td>Infrastructure</td>
          <td><em>{this.state.infraHostCount} hosts</em></td>
          <td colSpan={2} />
        </tr>
        <IngestRow className="detail" title="Host Monitoring" ingest={this.state.infraIngest} />
        <IngestRow className="detail" title="Process Monitoring" ingest={this.state.infraProcessIngest} />
        <IngestRow className="subTotal" title="Total Infrastructure" ingest={this.state.totalInfraIngest} />
        <IngestRow title="Average Infrastructure per Host" ingest={this.state.totalInfraIngest} hostCount={this.state.infraHostCount} />

        <IngestRow className="section" sectionTitle="Mobile" ingest={this.state.mobileIngest} />
        <IngestRow className="section" sectionTitle="Browser" ingest={this.state.browserIngest} />
        <IngestRow className="section" sectionTitle="Logs" ingest={this.state.logsIngest} />
        <IngestRow className="section" sectionTitle="Metrics (non APM/Infra)" ingest={this.state.otherMetricsIngest} />
        <IngestRow className="section" sectionTitle="All Other Ingest" ingest={this.state.otherIngest} />
        <IngestRow className="grandTotal" sectionTitle="Grand Total Ingest" ingest={this.state.allIngest} />
      </tbody>
    </table>
  }
}

function IngestRow({ sectionTitle, title, ingest, hostCount, className }) {
  return <tr className={className}>
    <td className="title">{sectionTitle || ""}</td>
    <td>{title || ""}</td>
    <td className="right">{ingestRate(ingest, hostCount)}</td>
    <td className="right">{estimatedCost(ingest, hostCount)}</td>
  </tr>
}

function Loading({ percentDone, stage }) {
  return <div className="loading">
    <p>Crunching through all that telemetry data...</p>
    <p>{stage} ({percentDone}%)</p>
    <Spinner />
  </div>
}