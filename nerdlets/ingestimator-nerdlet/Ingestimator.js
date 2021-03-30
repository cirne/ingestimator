import React from 'react'
import { logger, Link, navigation } from 'nr1'

import { APM_EVENTS, INFRA_EVENTS, METRIC_EVENTS, WHERE_METRIC_APM } from '../shared/constants'
import { getValue, ingestRate, estimatedCost } from '../shared/utils'
import { Loading } from './Loading'

const STEP_COUNT = 4
export default class Ingestimator extends React.PureComponent {

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
    const apmEventsIngest = consumptionIngest.ApmEventsBytes || 0
    const apmTraceIngest = consumptionIngest.TracingBytes || 0
    const totalApmIngest = apmEventsIngest + apmMetricsIngest + apmTraceIngest
    const apmHostCount = await this.querySingleValue({ title: "APM Hosts", select: 'uniqueCount(host)', from: APM_EVENTS[0] })

    const infraIngest = consumptionIngest.InfraHostBytes || 0
    const infraProcessIngest = consumptionIngest.InfraProcessBytes || 0
    const totalInfraIngest = infraIngest + infraProcessIngest
    const infraHostCount = await this.querySingleValue({ title: "Infra Hosts", select: 'uniqueCount(hostname)', from: INFRA_EVENTS[0] })

    const mobileIngest = consumptionIngest.MobileBytes || 0
    const browserIngest = consumptionIngest.BrowserBytes || 0
    const logsIngest = consumptionIngest.LoggingBytes || 0
    const infraIntegrationIngest = consumptionIngest.InfraIntegrationBytes || 0
    const otherMetricsIngest = Math.max(0, (consumptionIngest.MetricsBytes || 0) - apmMetricsIngest)
    const allIngest = consumptionIngest.TotalBytes
    const otherIngest = Math.max(0, allIngest - totalApmIngest - totalInfraIngest - mobileIngest - browserIngest - infraIntegrationIngest - logsIngest - otherMetricsIngest)

    this.setState({
      apmMetricsIngest, apmEventsIngest, apmTraceIngest, totalApmIngest,
      infraIngest, infraProcessIngest, totalInfraIngest,
      apmHostCount, infraHostCount,
      mobileIngest, browserIngest, logsIngest, otherMetricsIngest, infraIntegrationIngest,
      otherIngest, allIngest,
      loading: false
    })
  }

  async querySingleValue({ title, select, from, where }) {
    this.setState({ step: this.state.step + 1, stage: title })

    try {
      const { accountId, since } = this.props
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

    return <div className="ingestimator">
      <table className="ingestimator-table">
        <thead>
          <tr>
            <th colSpan={2}>Category</th>
            <th>Estimated Ingest</th>
            <th>Estimated Cost</th>
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
          <IngestRow className="section" sectionTitle="Infra Integrations" ingest={this.state.infraIntegrationIngest} />
          <IngestRow className="section" sectionTitle="Metrics (non APM/Infra)" ingest={this.state.otherMetricsIngest} />
          <IngestRow className="section" sectionTitle="All Other Ingest" ingest={this.state.otherIngest} />
          <IngestRow className="grandTotal" sectionTitle="Grand Total Ingest" ingest={this.state.allIngest} />
        </tbody>
      </table>
      <div className="footer">
        <Link onClick={() => navigation.openStackedNerdlet({ id: 'usage-ui.home' })}>
          Show offical month-to-date data usage
        </Link>
      </div>
    </div>
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

