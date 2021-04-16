import React from "react"
import { NrqlQuery, Spinner, Link, Icon, navigation } from 'nr1'

import { APM_EVENTS, APM_TRACE_EVENTS, ESTIMATED_INGEST_GB, METRIC_EVENTS, WHERE_METRIC_APM } from "../shared/constants"
import { estimatedCost, getResultValue, ingestRate } from "../shared/utils"

const LIMIT = 20
export default class ApplicationTable extends React.PureComponent {
  state = { loading: true }

  async componentDidMount() {
    this.load()
  }

  async componentDidUpdate({ accountId, since }) {
    if (!accountId || !since) {
      this.setState({ loading: true })
    }
    else if (accountId != this.props.accountId || since != this.props.since) {
      await this.load()
    }
  }

  /**
   * need to run 2 separate queries: one for the Metrics data, the other for the
   * events data. Then sum up events and metrics data per app and compile into
   * an array for rendering.
   */
  async load() {
    this.setState({ loading: true })

    const { accountId, since } = this.props
    function getQuery(select, from, where, facet) {
      let query = `SELECT ${select} FROM ${from} FACET ${facet || 'entityGuid'} SINCE ${since} LIMIT ${LIMIT}`
      if (where) query = query + ` WHERE ${where}`
      return query
    }

    const eventSelect = [
      ESTIMATED_INGEST_GB,
      'latest(appName OR service.name)',
      'uniqueCount(host)'
    ]
    const eventsQuery = getQuery(eventSelect, APM_EVENTS.concat(APM_TRACE_EVENTS))
    const metricsQuery = getQuery(ESTIMATED_INGEST_GB, METRIC_EVENTS, WHERE_METRIC_APM, 'entity.guid')

    const eventsResult = await NrqlQuery.query({ accountId, query: eventsQuery, formatType: 'raw' })
    const metricsResult = await NrqlQuery.query({ accountId, query: metricsQuery, formatType: 'raw' })

    const apps = {}
    eventsResult.data.facets.forEach(({ name, results }) => {
      apps[name] = {
        entityGuid: name,
        eventsIngest: getResultValue(results[0]),
        appName: getResultValue(results[1]),
        hostCount: getResultValue(results[2]),
        totalIngest: getResultValue(results[0])
      }
    })
    metricsResult.data.facets.forEach(({ name, results }) => {
      const app = apps[name]
      if (app) {
        app.metricsIngest = getResultValue(results[0])
        app.totalIngest = app.metricsIngest + app.eventsIngest
      }
    })

    const appsList = Object.values(apps)
      .filter(app => app.totalIngest)
      .sort((y, x) => x.totalIngest - y.totalIngest)

    this.setState({
      apps: appsList,
      loading: false
    })
  }

  render() {
    const { loading, apps } = this.state
    if (loading) return <Spinner />
    return <div className="applications-table">
      <h4>Top Applications by Telemetry Ingest</h4>
      <table >
        <thead>
          <tr>
            <th>Top Applications</th>
            <th className="right">Ingest</th>
            <th className="right">Cost</th>
            <th className="right"># Hosts</th>
            <th className="right">Per Host</th>
          </tr>
        </thead>
        <tbody>
          {apps.map(app => (
            <tr key={app.entityGuid}>
              <td><AppLink {...app} /></td>
              <td className="right">{ingestRate(app.totalIngest)}</td>
              <td className="right">{estimatedCost(app.totalIngest)}</td>
              <td className="right">{app.hostCount}</td>
              <td className="right">{estimatedCost(app.totalIngest, app.hostCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  }
}

function AppLink({ entityGuid, appName }) {
  const url = navigation.getOpenStackedNerdletLocation({
    id: 'apm-ingestimator',
    urlState: {
      entityGuid,
      appName
    }

  })
  return <Link to={url}>
    {appName || entityGuid}
  </Link>
}