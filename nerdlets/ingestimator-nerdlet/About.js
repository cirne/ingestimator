import { Link } from 'nr1'

export default function About() {
  return <div className="about">
    <h3>About Ingestimator</h3>
    <p>
      <strong>Ingestimator</strong> estimates the amount of data ingested on a per-host
      basis for your application and infrastructure telemetry. This helps you
      estimate and manage your data ingest costs on a more granular basis.
    </p><p>
      New Relic Telemetry Data platform prices based on ingested telemetry data at
      25c per gigabyte, with the first 100GB free. But it's often hard to come up with
      an estimated cost to manage a specific application, since each applicaiton generates
      a variable amount of telemetry based on a number of factors.
    </p><p>
      Select an account in the account picker, and pick a time range. Estimator will
      inspect all of your ingested telemetry over the specified time range, and then
      project the montly cost from there.
    </p><p>
    </p><p>
      Most other solutions (including New Relic in the past) have priced APM and
      infrastructure monitoring by the host, so this tool also reports the estimated
      cost per host for APM and Infrastructure.
    </p><p>
      Ingestimator is provided as an open source new relic one application.
      you can learn more about how it works, or make contributions, by viewing
      its repository on <Link to="https://github.com/cirne/ingestimator">Github</Link>.
    </p>
  </div>
}