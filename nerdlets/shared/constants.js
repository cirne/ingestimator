export const APM_EVENTS = ['Transaction', 'TransactionError', 'SqlTrace', 'TransactionTrace']
export const APM_TRACE_EVENTS = ['Span']
export const BROWSER_EVENTS = ['PageView', 'PageViewTiming', 'BrowserInteraction']
export const MOBILE_EVENTS = ['Mobile', 'MobileCrash', 'MobileSession, MobileUserAction', 'MobileRequest', 'MobileRequestError']
export const INFRA_EVENTS = ['SystemSample', 'NetworkSample', 'StorageSample']
export const INFRA_PROCESS_EVENTS = ['ProcessSample']
export const LOG_EVENTS = ['Log']
export const ESTIMATED_INGEST = `rate(bytecountestimate(), 1 month)/1e9`

export const WHERE_METRIC_API = "newrelic.source = 'metricAPI'"
export const WHERE_APM_MTS = "newrelic.source = 'agent'"
export const WHERE_PROMETHEUS = "collector.name = 'nri-prometheus'"
