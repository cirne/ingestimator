# Ingestimator

Estimate the monthly ingest cost on New Relic One for APM, Infrastructure, Mobile, Browser, Logs, Metrics and Traces

New Relic introduced a new, simplified pricing model in 2020 that primarily charges based on _Data Ingest_ and 
_Users_. Data Ingest is priced at a fixed cost of 25c per month per Gigibyte (1,000,000,000 bytes) of ingested
data, as opposed to other pricing models which price on a combination of many metrics such as hosts, metrics,
queries, etc.

Nevertheless, it is important to understand roughly how much the ingest cost of certain telemetry data types
cost when compared to legacy (host based) pricing models. This allows you to:

- make an apples to apples comparison of New Relic One telemetry pricing with other legacy pricing models
- estimate the additional cost of deploying New Relic more broadly (on more applications, hosts, etc.)
- estimate how many host of APM or Infrastrucutre you can monitor with New Relic's free tier (100 GB per month free)

Since every application and environment is unique, it's hard for New Relic to give an accurate estimate
of ingest cost per host for your application and environment. That's where **Ingestimator** comes in.

**Ingestimator** looks at your own telemetry data and calculates the estimated monthly cost for APM,
Infrastructure, based on your own telemetry. Simply select an account and a time range and see the
estimated results. 

The time range is then extrapolated to a (30 day) month to estimate the total ingest cost over a month.
we recommend you use Last 7 days to account for seasonality over the weekend, but if your ingest has changed
a lot recently due to the addition (or removal) of more telemetry sources, you can select a shorter timeframe.

## How it works
NRQL has a special function, `bytecountestimate()`, which estimates the number of bytes of data ingest New Relic
would record for the set of Event or Metric data queried. So for example, the following query would estimate
the ingested Log data amount data based on the last 7 days of ingested log data.

```
FROM Log SELECT bytecountestimate() SINCE 7 days ago
```

We can normalize this out to a rate of 1 month (in NRQL, `1 month` is 30 days) by tweaking the query like so:

```
FROM Log SELECT rate(bytecountestimate()) SINCE 7 days ago
```

## Metrics (APM and Otherwise)
When determining an "apples to apples" comparison of APM costs to host-based pricing modesl, we need to include the set of Metric data
that is coming from our APM agents as part of the APM cost per host. We can see that metric data by querying:
```
FROM Metric select bytecountestimate() where newrelic.source = 'agent'
```


To this metric data also add other event data that our agents generate, such as `Transaction`,
`TransactionError`, `Span`, etc. So APM cost is comprised of Metrics, Traces and Events that come from our APM
agents, or OpenTelemetry agents.

Infrastructure is its own thing. New Relic agents report Infrastructure
telemetry as `Sample` events (e.g. `SystemSample`, `ProcessSample`, etc) which
allow for unlimited cardinality. So we don't have any "Metric" data to 
allocate to the cost of Infrastructure.

However, there are other sources of Metric Data that come from. For example, you can forward your prometheus metric data into New Relic
Telemetry Data Platform via our Metrics API. So we measure that separately.

## Disclaimers
I wrote this app on a weekend, and while I think the logic is mostly
accurate, this data is not going to precisely match the data ingest that New Relic bills on. You can see that precise
data in your account by querying `NrConsumption` events or selecting **View your usage** in the global drop down menu at the
top right of New Relic one. 

Note that the `NrConsumption` data, while precise, will unfortunately not break down with the same level of detail or organizwed as intuitively as the data reported by **Ingestimator**. That's why I wrote this app.