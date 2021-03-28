import React from 'react'
import { Spinner, logger } from 'nr1'
import {
  APM_EVENTS, APM_TRACE_EVENTS,
  INFRA_EVENTS, INFRA_PROCESS_EVENTS,
  MOBILE_EVENTS, BROWSER_EVENTS, LOG_EVENTS,
  WHERE_METRIC_APM, WHERE_METRIC_API
} from '../shared/constants'

import { getValue, ingestRate, estimatedCost } from '../shared/utils'

export default class Ingestimator extends React.PureComponent {

  state = { loading: "true" }

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
    this.setState({ loading: true })

    const apmMetricsIngest = await this.querySingleValue({ from: 'Metric', where: WHERE_METRIC_APM })
    const apmEventsIngest = await this.querySingleValue({ from: APM_EVENTS })
    const apmTraceIngest = await this.querySingleValue({ from: APM_TRACE_EVENTS })
    const totalApmIngest = apmEventsIngest + apmMetricsIngest + apmTraceIngest
    const apmHostCount = await this.querySingleValue({ select: 'uniqueCount(host)', from: APM_EVENTS[0] })

    const infraIngest = await this.querySingleValue({ from: INFRA_EVENTS })
    const infraProcessIngest = await this.querySingleValue({ from: INFRA_PROCESS_EVENTS })
    const totalInfraIngest = infraIngest + infraProcessIngest
    const infraHostCount = await this.querySingleValue({ select: 'uniqueCount(hostname)', from: INFRA_EVENTS[0] })

    const mobileIngest = await this.querySingleValue({ from: MOBILE_EVENTS })
    const browserIngest = await this.querySingleValue({ from: BROWSER_EVENTS })
    const logsIngest = await this.querySingleValue({ from: LOG_EVENTS })
    const otherMetricsIngest = await this.querySingleValue({ from: 'Metric', where: WHERE_METRIC_API })

    const allIngest = await this.querySingleValue({ from: 'NrConsumption', select: 'rate(sum(GigabytesIngested), 1 month)' })
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

  async querySingleValue({ select, from, where }) {
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
    const { loading } = this.state
    if (loading) return <Spinner />

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
        <IngestRow className="section" sectionTitle="Metrics via API" ingest={this.state.otherMetricsIngest} />
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