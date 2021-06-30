// event types
export const APM_EVENTS = ['Transaction', 'TransactionError', 'SqlTrace', 'TransactionTrace']
export const APM_TRACE_EVENTS = ['Span']
export const BROWSER_EVENTS = ['PageView', 'PageViewTiming', 'BrowserInteraction']
export const MOBILE_EVENTS = ['Mobile', 'MobileCrash', 'MobileSession, MobileUserAction', 'MobileRequest', 'MobileRequestError']
export const INFRA_EVENTS = ['SystemSample', 'NetworkSample', 'StorageSample']
export const INFRA_PROCESS_EVENTS = ['ProcessSample']
export const METRIC_EVENTS = ['Metric', 'MetricRaw']

// select clausess
export const ESTIMATED_INGEST_GB = `rate(bytecountestimate(), 1 month)/1e9`
export const INEFFECTIVE_METRICS_PERCENTAGE = `percentage(count(*), where (%[type]='summary' and %[count]=0) or (%[type]='gauge' and %[count]=1 and %[latest]=0))`

// where clauses for metrics queries
export const WHERE_METRIC_API = "newrelic.source = 'metricAPI'"
export const WHERE_OTHER_METRIC = "newrelic.source != 'agent'"
export const WHERE_METRIC_APM = "newrelic.source = 'agent' and agent.type = 'apm'"

// where clauses for NrConsumption queries
export const WHERE_LOGS_NRCONSUMPTION = "usageMetric = 'LoggingBytes'"
export const WHERE_METRIC_NRCONSUMPTION = "usageMetric = 'MetricsBytes'"
