import React from 'react'
import { Spinner, logger } from 'nr1'
import {
  APM_EVENTS, APM_TRACE_EVENTS, INFRA_EVENTS, INFRA_PROCESS_EVENTS,
  getValue, ingestRate, estimatedCost
} from '../shared/utils'

export default class Ingestimator extends React.PureComponent {

  state = { loading: "true" }

  async componentDidMount() {
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
    try {
      this.setState({ loading: true })

      const apmMetricsIngest = await this.querySingleValue({ from: 'Metric', where: "newrelic.source ='agent'" })
      const apmEventsIngest = await this.querySingleValue({ from: APM_EVENTS })
      const apmTraceIngest = await this.querySingleValue({ from: APM_TRACE_EVENTS })
      const totalApmIngest = apmEventsIngest + apmMetricsIngest + apmTraceIngest
      const apmHostCount = await this.querySingleValue({ select: 'uniqueCount(host)', from: 'Transaction' })

      const infraIngest = await this.querySingleValue({ from: INFRA_EVENTS })
      const infraProcessIngest = await this.querySingleValue({ from: INFRA_PROCESS_EVENTS })
      const totalInfraIngest = infraIngest + infraProcessIngest
      const infraHostCount = await this.querySingleValue({ select: 'uniqueCount(hostname)', from: 'SystemSample' })

      this.setState({
        apmMetricsIngest, apmEventsIngest, apmTraceIngest, totalApmIngest,
        infraIngest, infraProcessIngest, totalInfraIngest,
        apmHostCount, infraHostCount,
        loading: false
      })
    }
    catch (error) {
      logger.error("Error Estimating Ingest Costs", error)
      debugger
    }
  }

  async querySingleValue({ select, from, where }) {
    const { accountId, since } = this.props
    const value = await getValue({ select, from, where, accountId, since })
    logger.log("Get Value", select || "Ingest Rate", from, value)
    return value
  }

  render() {
    const { loading } = this.state
    if (loading) return <Spinner />


    return <table>
      <thead>
        <tr>
          <th colSpan={2}>Category</th>
          <th>Ingest Rate per Month</th>
          <th>Estimated Cost per Month</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>APM</td>
          <td><em>{this.state.apmHostCount} hosts</em></td>
        </tr>
        <CostRow title="Metrics" ingest={this.state.apmMetricsIngest} />
        <CostRow title="Events" ingest={this.state.apmEventsIngest} />
        <CostRow title="Traces" ingest={this.state.apmTraceIngest} />
        <CostRow title="Total APM" ingest={this.state.totalApmIngest} />
        <CostRow title="Average APM per Host" ingest={this.state.totalApmIngest} hostCount={this.state.apmHostCount} />

        <tr>
          <td>Infrastructure</td>
          <td><em>{this.state.infraHostCount} hosts</em></td>
        </tr>
        <CostRow title="Host Monitoring" ingest={this.state.infraIngest} />
        <CostRow title="Process Monitoring" ingest={this.state.infraProcessIngest} />
        <CostRow title="Total Infrastructure" ingest={this.state.totalInfraIngest} />
        <CostRow title="Average Infrastructure per Host" ingest={this.state.totalInfraIngest} hostCount={this.state.infraHostCount} />

      </tbody>
    </table>
  }
}

function CostRow({ title, ingest, hostCount }) {
  return <tr>
    <td />
    <td>{title}</td>
    <td>{ingestRate(ingest, hostCount)}</td>
    <td>{estimatedCost(ingest, hostCount)}</td>
  </tr>
}