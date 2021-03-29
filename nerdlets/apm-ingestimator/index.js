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
            const { timeRange, accountId } = platformState
            const { entityGuid } = nerdletState

            return <ApmIngestimator accountId={accountId} timeRange={timeRangeToNrql(timeRange)} entityGuid={entityGuid} />
          }}
        </PlatformStateContext.Consumer>
      )}
    </NerdletStateContext.Consumer>
  }
}


