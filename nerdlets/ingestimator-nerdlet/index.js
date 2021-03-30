import React from 'react';

import { NerdletStateContext, PlatformStateContext, nerdlet } from 'nr1'
import Preflight from './Preflight'

const HOUR = 1000 * 60 * 60
const DAY = HOUR * 24
export default class IngestimatorNerdlet extends React.Component {
  componentDidMount() {
    nerdlet.setConfig({
      accountPicker: true,
      timePicker: true,
      timePickerRanges: [
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
            const { timeRange, accountId } = platformState
            if ((timeRange?.duration || 0) < 3 * HOUR || !accountId) {
              return ""
            }

            const since = `${timeRange.duration / HOUR} hours ago`
            return <Preflight accountId={accountId} since={since} />
          }}
        </PlatformStateContext.Consumer>
      )}
    </NerdletStateContext.Consumer>
  }
}
