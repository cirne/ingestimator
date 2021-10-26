# Ingestimator
Estimate the monthly ingest cost on New Relic One for APM, Infrastructure, Mobile, Browser, Logs, Metrics and Traces

> :warning: This project is under early development and the numbers are not yet validated. There may be 
some inaccuracies in the reported data. Stay tuned.

New Relic introduced a new, simplified pricing model in 2020 that primarily charges based on _Data Ingest_ and 
_Users_. Data Ingest is priced at a fixed cost of 25c per month per Gigibyte (1,000,000,000 bytes) of ingested
data, as opposed to other pricing models which price on a combination of many meters, such as hosts, metrics, page views,
queries, etc.

For some, it is important to understand roughly how much the ingest cost of certain telemetry data types
cost when compared to legacy (host based) pricing models. This allows you to:

- make an apples to apples comparison of New Relic One telemetry pricing with other legacy (host-based) pricing models
- estimate the additional cost of deploying New Relic more broadly (on more applications, hosts, etc.)
- estimate how many hosts of APM or Infrastructure you can monitor with New Relic's free tier (100 GB per month free)

Since every application and environment is unique, it's hard for New Relic to provide an accurate estimate
of ingest cost per host for your application and environment. That's where **Ingestimator** comes in.

**Ingestimator** looks at your own telemetry data and calculates the estimated monthly cost for APM,
Infrastructure, Mobile, Browser, Logs, etc. based on your own telemetry. Simply select an account and a time 
range and see the estimated results. 

Your selected is then extrapolated to a an estimated ingest rate for a (30 day) month to estimate the total 
ingest cost over a month. We recommend you use Last 7 days to account for weekend seasonality, but if your 
ingest has changed a lot recently due to the addition (or removal) of more telemetry sources - or if you want a 
faster result - you can select a shorter timeframe.

## Screenshot
<p align="center">
  <img src="https://p222.p4.n0.cdn.getcloudapp.com/items/geubJZL6/b3787189-2bff-433e-863f-c7eb200272cd.jpg?v=f7a9def7e92bcad853a6cdbf00470220"/>
  <em>Example report from an existing New Relic customer.</em>
</p>

## How it works
Every New Relic account has `NrConsumption` event data that records the actual amount of data ingest consumption
for that account. This is the data that is used in your Usage and Cost report and is also used to caluclate your
New Relic invoice. 

However the data reported in `NrConsumption` reports all metric data into a segment called `MetricsBytes`. The issue
is we want to "break out" metric data coming from APM agents to generate that proper "apples to apples" comparison. 
To do that, we use a special NRQL function called `bytecountestimate()`:

```
FROM Metric SELECT bytecountestimate() SINCE 1 day ago RAW
```

Note that RAW statement is used to include all of the raw metric data that is ingested prior to aggregation
into a (query optimized) `Metric` data point, since the raw data is effectively the ingested data that New Relic
will use in caluclating ingest costs.

Here is an estimate of monthly ingest for metric data that comes from our APM agents:

```
FROM Metric SELECT rate(bytecountestimate(), 1 month) WHERE newrelic.source = 'agent' SINCE 1 day ago RAW
```

**Infrastructure**: New Relic infrastructure agents report Infrastructure
telemetry as `Sample` events (e.g. `SystemSample`, `ProcessSample`, etc) which
allow for unlimited cardinality. So we don't have any "Metric" data to 
allocate to the cost of Infrastructure.

However, there are other sources of Metric Data that come from. For example, you can forward your prometheus metric data into New Relic
Telemetry Data Platform via our Metrics API. So we measure that separately.

## Disclaimers
This project is under early development and the numbers are not yet validated. There are likely some fundamental
inaccuracies.

This app estimates ingest cost by performing a linear extrapolation based on the time range you specify in
the query dropdown. This will not precisely match what New Relic will bill you on ingest:
- New Relic generates invoices on monthly boundaries, whereas this logic just estimates the ingest cost
over a 30 day period based on the time range you specify.
- This app does not account for the 100GB free tier, so that will reduce your estimated ingest cost by $25.

There is a link to the official month to date data usage report at the bottom of this screen, or you
can also view that report at any time from your user dropdown menu:

![User Menu](https://p222.p4.n0.cdn.getcloudapp.com/items/WnuY4Yb7/ad4c746d-c649-4519-b070-a5ff247ebc69.jpg?v=942f6b5a43c90d43b83debd0c4fe0a7b)

Note that the data in this report, while precise, will unfortunately not break down with the same level of detail or organized as intuitively 
as the data reported by **Ingestimator**. That's why I wrote this app.