import React from 'react';
import { EntityByGuidQuery, PlatformStateContext, NerdletStateContext } from 'nr1'
import { timeRangeToNrql } from '@newrelic/nr1-community'

import ApmIngestimator from './ApmIngestimator';

export default class ApmIngestimatorNerdlet extends React.Component {
  render() {
    return <PlatformStateContext.Consumer>
      {platformState => {
        return <NerdletStateContext.Consumer>
          {(nerdletState) => {
            const { entityGuid, appName } = nerdletState

            return <EntityByGuidQuery entityGuid={entityGuid}>
              {({ loading, data }) => {
                if (loading || !data) return ""

                const entity = data.entities[0]
                const accountId = entity?.accountId || platformState.accountId

                if (!accountId) return <NoAccountId />

                // note appName is provided if this nerdlet is an overlay 
                // opened by the Ingestimator launcher
                return <ApmIngestimator
                  accountId={parseInt(accountId)}
                  timeRange={timeRangeToNrql(platformState)}
                  appName={appName}
                  entityGuid={entityGuid} />
              }}
            </EntityByGuidQuery>
          }}
        </NerdletStateContext.Consumer>
      }}
    </PlatformStateContext.Consumer>

  }
}

function NoAccountId() {
  return <div className="loading">
    <p>
      Access denied.
    </p>
  </div>
}
