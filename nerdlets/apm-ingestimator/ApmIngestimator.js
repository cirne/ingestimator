
import {
  Grid, GridItem, LineChart,
  Card, CardHeader, CardBody,
  ChartGroup, NrqlQuery,
  Dropdown, DropdownItem
} from 'nr1'
import React from 'react'

import {
  APM_EVENTS, APM_TRACE_EVENTS, ESTIMATED_INGEST_GB,
  METRIC_EVENTS, WHERE_METRIC_APM
} from '../shared/constants'
import { estimatedCost, ingestRate } from '../shared/utils'

export default class ApmIngestimator extends React.PureComponent {
  state = {
    rate: 'month'
  }

  render() {
    const { rate } = this.state
    const { accountId, timeRange } = this.props

    const hostCount = `SELECT uniqueCount(host) FROM Transaction ${timeRange} ${this.getWhere()}`
    return <NrqlQuery accountId={accountId} query={hostCount} formatType="raw">
      {({ loading, data }) => {
        if (loading || !data) return ""
        const hostCount = data.results[0].uniqueCount

        const selectRate = `rate(bytecountestimate(), 1 ${rate}) AS 'Ingest per ${rate}'`
        const selectRatePerHost = `rate(bytecountestimate(), 1 ${rate})/${hostCount} AS 'Ingest per host per ${rate}'`

        return <div className="apm-ingestimator">
          <div className="header">
            <h2 className="spacer">Data Ingest Estimates</h2>
            {this.renderEsimatedCost(hostCount)}
            {this.renderPlotDropdown()}
          </div>
          <ChartGroup>
            <Grid className="border-top">
              <GridItem columnSpan={4}>
                {this.renderChart({
                  title: "Events",
                  select: selectRate,
                  from: APM_EVENTS,
                })}
              </GridItem>
              <GridItem columnSpan={4}>
                {this.renderChart({
                  title: "Traces",
                  select: selectRate,
                  from: APM_TRACE_EVENTS,
                })}
              </GridItem>
              <GridItem columnSpan={4}>
                {this.renderChart({
                  title: "Metrics",
                  select: selectRate,
                  from: METRIC_EVENTS,
                  where: WHERE_METRIC_APM
                })}
              </GridItem>
              <GridItem columnSpan={4}>
                {this.renderChart({
                  title: `Events - Per Host (${hostCount})`,
                  select: selectRatePerHost,
                  from: APM_EVENTS,
                })}
              </GridItem>
              <GridItem columnSpan={4}>
                {this.renderChart({
                  title: `Traces - Per Host (${hostCount})`,
                  select: selectRatePerHost,
                  from: APM_TRACE_EVENTS,
                })}
              </GridItem>
              <GridItem columnSpan={4}>
                {this.renderChart({
                  title: `Metrics - Per Host (${hostCount})`,
                  select: selectRatePerHost,
                  from: METRIC_EVENTS,
                  where: WHERE_METRIC_APM,
                })}
              </GridItem>
            </Grid>
          </ChartGroup>
        </div>
      }}
    </NrqlQuery>

  }

  getWhere() {
    return `WHERE entityGuid = '${this.props.entityGuid}'`
  }

  renderEsimatedCost(hostCount) {
    const { timeRange, entityGuid, accountId } = this.props

    function getQuery(from, where) {
      let query = `SELECT ${ESTIMATED_INGEST_GB} FROM ${from} ${timeRange} WHERE entityGuid = '${entityGuid}'`
      if (where) query = query + ` WHERE ${where}`
      return query
    }

    const eventsQuery = getQuery(APM_EVENTS.concat(APM_TRACE_EVENTS))
    const metricsQuery = getQuery(METRIC_EVENTS, WHERE_METRIC_APM)

    return <NrqlQuery accountId={accountId} query={eventsQuery} formatType="raw">
      {eventsResult => (
        <NrqlQuery accountId={accountId} query={metricsQuery} formatType="raw">
          {metricsResult => {
            if (eventsResult.data && metricsResult.data) {
              const eventsIngest = eventsResult.data.results[0].result
              const metricsIngest = metricsResult.data.results[0].result
              const totalIngest = eventsIngest + metricsIngest

              return <>
                <span>Ingest Rate: </span>
                <strong>{ingestRate(totalIngest)}</strong>
                <span>Est. Cost: </span>
                <strong>{estimatedCost(totalIngest)}</strong>
                <span>Per Host: </span>
                <strong>{estimatedCost(totalIngest, hostCount)}</strong>
              </>
            }
            return ""
          }}
        </NrqlQuery>
      )}
    </NrqlQuery>
  }

  renderPlotDropdown() {
    const items = ['month', 'day', 'minute']
    const { rate } = this.state
    return <>
      <span>Plot: </span>
      <Dropdown title={`Estimated Ingest rate per ${rate}`}>
        {items.map(item => (
          <DropdownItem key={item} onClick={() => this.setState({ rate: item })}>
            Ingest rate per {item}
          </DropdownItem>
        ))}
      </Dropdown>
    </>
  }

  renderChart({ select, from, title, where, facet }) {
    const { accountId, timeRange } = this.props
    const { rate } = this.state
    let query = `SELECT ${select} ` +
      `FROM ${from} ${this.getWhere()}` +
      `${timeRange} TIMESERIES`

    if (where) {
      query = query + ` WHERE ${where}`
    }
    if (facet) {
      query = query + ` FACET ${facet}`
    }

    return <Card>
      <CardHeader title={title} subtitle={`Ingest rate per ${rate}`} />

      <CardBody className="line-chart">
        <NrqlQuery accountId={accountId} query={query}>
          {({ loading, data }) => {
            if (data) {
              data[0].metadata.units_data.y = "BYTES"
            }
            return <LineChart fullWidth fullHeight loading={loading} data={data} />
          }}
        </NrqlQuery>
      </CardBody>
    </Card>
  }
}

