import React from 'react';

import { NerdletStateContext, PlatformStateContext } from 'nr1'
import ApmIngestimator from './ApmIngestimator';
import { timeRangeToNrql } from '@newrelic/nr1-community'

export default class ApmIngestimatorNerdlet extends React.Component {
  render() {
    return <NerdletStateContext.Consumer>
      {(nerdletState) => (
        <PlatformStateContext.Consumer>
          {(platformState) => {
            const { accountId } = platformState
            const { entityGuid, appName } = nerdletState

            // note appName is provided if this nerdlet is an overlay 
            // opened by the Ingestimator launcher
            return <ApmIngestimator
              accountId={accountId}
              timeRange={timeRangeToNrql(platformState)}
              appName={appName}
              entityGuid={entityGuid} />
          }}
        </PlatformStateContext.Consumer>
      )}
    </NerdletStateContext.Consumer>
  }
}


