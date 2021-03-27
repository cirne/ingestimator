import React from 'react';

import { NerdletStateContext, PlatformStateContext, nerdlet } from 'nr1'
import Ingestimator from './Ingestimator';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

const HOUR = 1000 * 60 * 60
const DAY = HOUR * 24
export default class IngestimatorNerdletNerdlet extends React.Component {
  componentDidMount() {
    nerdlet.setConfig({
      accountPicker: true,
      timePicker: true,
      timePickerRanges: [
        { label: '3 hours', offset: 3 * HOUR },
        { label: '24 hours', offset: DAY },
        { label: '7 days', offset: 7 * DAY },
        { label: '30 days', offset: 30 * DAY },
      ]
    })
  }

  render() {
    return <NerdletStateContext.Consumer>
      {(nerdletState) => (
        <PlatformStateContext.Consumer>
          {(platformState) => {
            const since = `${platformState.timeRange.duration / HOUR} hours ago`
            const { accountId } = platformState

            return <Ingestimator accountId={accountId} since={since} />
          }}
        </PlatformStateContext.Consumer>
      )}
    </NerdletStateContext.Consumer>
  }
}
