import { Tabs, TabsItem, nerdlet, NerdletStateContext } from 'nr1'
import About from './About'

import ApplicationTable from './ApplicationTable'
import MetricsTable from './MetricsTable'

export default function Details({ accountId, since }) {
  return <NerdletStateContext.Consumer>
    {nerdletState => {
      const { tab } = nerdletState
      return <Tabs className="details" value={tab || "about"} onChange={(tab) => nerdlet.setUrlState({ tab })}>
        <TabsItem label="About" value="about" >
          <About />
        </TabsItem>
        <TabsItem label="Applications" value="apps">
          <ApplicationTable accountId={accountId} since={since} />
        </TabsItem>
        <TabsItem label="Metrics" value="metrics">
          <MetricsTable accountId={accountId} since={since} />
        </TabsItem>
      </Tabs>
    }}
  </NerdletStateContext.Consumer>

}