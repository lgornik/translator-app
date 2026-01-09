import { Request, Response, NextFunction } from "express";

/**
 * Prometheus Metrics Collector
 *
 * Collects application metrics for monitoring:
 * - HTTP request duration histogram
 * - Request counter by status, method, path
 * - Active connections gauge
 * - Business metrics (quiz completions, etc.)
 */

// ============================================================================
// Metric Types
// ============================================================================

interface HistogramBucket {
  le: number;
  count: number;
}

interface Histogram {
  name: string;
  help: string;
  buckets: HistogramBucket[];
  sum: number;
  count: number;
  labels: Record<string, string>;
}

interface Counter {
  name: string;
  help: string;
  value: number;
  labels: Record<string, string>;
}

interface Gauge {
  name: string;
  help: string;
  value: number;
  labels: Record<string, string>;
}

// ============================================================================
// Metrics Registry
// ============================================================================

class MetricsRegistry {
  private histograms: Map<string, Histogram[]> = new Map();
  private counters: Map<string, Counter[]> = new Map();
  private gauges: Map<string, Gauge[]> = new Map();

  private readonly defaultBuckets = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
  ];

  observeHistogram(
    name: string,
    help: string,
    value: number,
    labels: Record<string, string> = {},
    buckets: number[] = this.defaultBuckets,
  ): void {
    const labelKey = this.labelsToKey(labels);

    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }

    const histograms = this.histograms.get(name)!;
    let histogram = histograms.find(
      (h) => this.labelsToKey(h.labels) === labelKey,
    );

    if (!histogram) {
      histogram = {
        name,
        help,
        buckets: buckets.map((le) => ({ le, count: 0 })),
        sum: 0,
        count: 0,
        labels,
      };
      histograms.push(histogram);
    }

    histogram.sum += value;
    histogram.count += 1;
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count += 1;
      }
    }
  }

  incrementCounter(
    name: string,
    help: string,
    value: number = 1,
    labels: Record<string, string> = {},
  ): void {
    const labelKey = this.labelsToKey(labels);

    if (!this.counters.has(name)) {
      this.counters.set(name, []);
    }

    const counters = this.counters.get(name)!;
    let counter = counters.find((c) => this.labelsToKey(c.labels) === labelKey);

    if (!counter) {
      counter = { name, help, value: 0, labels };
      counters.push(counter);
    }

    counter.value += value;
  }

  setGauge(
    name: string,
    help: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    const labelKey = this.labelsToKey(labels);

    if (!this.gauges.has(name)) {
      this.gauges.set(name, []);
    }

    const gauges = this.gauges.get(name)!;
    let gauge = gauges.find((g) => this.labelsToKey(g.labels) === labelKey);

    if (!gauge) {
      gauge = { name, help, value: 0, labels };
      gauges.push(gauge);
    }

    gauge.value = value;
  }

  incrementGauge(
    name: string,
    help: string,
    value: number = 1,
    labels: Record<string, string> = {},
  ): void {
    const labelKey = this.labelsToKey(labels);

    if (!this.gauges.has(name)) {
      this.gauges.set(name, []);
    }

    const gauges = this.gauges.get(name)!;
    let gauge = gauges.find((g) => this.labelsToKey(g.labels) === labelKey);

    if (!gauge) {
      gauge = { name, help, value: 0, labels };
      gauges.push(gauge);
    }

    gauge.value += value;
  }

  decrementGauge(
    name: string,
    help: string,
    value: number = 1,
    labels: Record<string, string> = {},
  ): void {
    this.incrementGauge(name, help, -value, labels);
  }

  export(): string {
    const lines: string[] = [];

    // Export histograms
    for (const [name, histograms] of this.histograms) {
      if (histograms.length === 0) continue;

      lines.push(`# HELP ${name} ${histograms[0].help}`);
      lines.push(`# TYPE ${name} histogram`);

      for (const histogram of histograms) {
        const labelStr = this.labelsToPrometheus(histogram.labels);

        for (const bucket of histogram.buckets) {
          const bucketLabels = labelStr
            ? `${labelStr},le="${bucket.le}"`
            : `le="${bucket.le}"`;
          lines.push(`${name}_bucket{${bucketLabels}} ${bucket.count}`);
        }

        const infLabels = labelStr ? `${labelStr},le="+Inf"` : `le="+Inf"`;
        lines.push(`${name}_bucket{${infLabels}} ${histogram.count}`);

        if (labelStr) {
          lines.push(`${name}_sum{${labelStr}} ${histogram.sum}`);
          lines.push(`${name}_count{${labelStr}} ${histogram.count}`);
        } else {
          lines.push(`${name}_sum ${histogram.sum}`);
          lines.push(`${name}_count ${histogram.count}`);
        }
      }
    }

    // Export counters
    for (const [name, counters] of this.counters) {
      if (counters.length === 0) continue;

      lines.push(`# HELP ${name} ${counters[0].help}`);
      lines.push(`# TYPE ${name} counter`);

      for (const counter of counters) {
        const labelStr = this.labelsToPrometheus(counter.labels);
        if (labelStr) {
          lines.push(`${name}{${labelStr}} ${counter.value}`);
        } else {
          lines.push(`${name} ${counter.value}`);
        }
      }
    }

    // Export gauges
    for (const [name, gauges] of this.gauges) {
      if (gauges.length === 0) continue;

      lines.push(`# HELP ${name} ${gauges[0].help}`);
      lines.push(`# TYPE ${name} gauge`);

      for (const gauge of gauges) {
        const labelStr = this.labelsToPrometheus(gauge.labels);
        if (labelStr) {
          lines.push(`${name}{${labelStr}} ${gauge.value}`);
        } else {
          lines.push(`${name} ${gauge.value}`);
        }
      }
    }

    return lines.join("\n");
  }

  reset(): void {
    this.histograms.clear();
    this.counters.clear();
    this.gauges.clear();
  }

  private labelsToKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
  }

  private labelsToPrometheus(labels: Record<string, string>): string {
    return Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
  }
}

// ============================================================================
// Global Registry
// ============================================================================

export const metricsRegistry = new MetricsRegistry();

// ============================================================================
// Metric Names
// ============================================================================

export const MetricNames = {
  HTTP_REQUEST_DURATION: "http_request_duration_seconds",
  HTTP_REQUESTS_TOTAL: "http_requests_total",
  HTTP_ACTIVE_CONNECTIONS: "http_active_connections",

  GRAPHQL_REQUEST_DURATION: "graphql_request_duration_seconds",
  GRAPHQL_OPERATIONS_TOTAL: "graphql_operations_total",
  GRAPHQL_ERRORS_TOTAL: "graphql_errors_total",

  TRANSLATIONS_CHECKED_TOTAL: "translations_checked_total",
  TRANSLATIONS_CORRECT_TOTAL: "translations_correct_total",
  SESSIONS_ACTIVE: "sessions_active",
  WORDS_SERVED_TOTAL: "words_served_total",

  PROCESS_UPTIME_SECONDS: "process_uptime_seconds",
  NODEJS_HEAP_SIZE_BYTES: "nodejs_heap_size_bytes",
} as const;

// ============================================================================
// Middleware
// ============================================================================

export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();

    metricsRegistry.incrementGauge(
      MetricNames.HTTP_ACTIVE_CONNECTIONS,
      "Number of active HTTP connections",
    );

    res.on("finish", () => {
      const endTime = process.hrtime.bigint();
      const durationNs = Number(endTime - startTime);
      const durationSeconds = durationNs / 1e9;

      const path = normalizePath(req.path);
      const method = req.method;
      const status = String(res.statusCode);

      metricsRegistry.observeHistogram(
        MetricNames.HTTP_REQUEST_DURATION,
        "HTTP request duration in seconds",
        durationSeconds,
        { method, path, status },
      );

      metricsRegistry.incrementCounter(
        MetricNames.HTTP_REQUESTS_TOTAL,
        "Total number of HTTP requests",
        1,
        { method, path, status },
      );

      metricsRegistry.decrementGauge(
        MetricNames.HTTP_ACTIVE_CONNECTIONS,
        "Number of active HTTP connections",
      );
    });

    next();
  };
}

function normalizePath(path: string): string {
  let normalized = path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ":id",
  );
  normalized = normalized.replace(/\/\d+/g, "/:id");
  return normalized;
}

// ============================================================================
// Metrics Endpoint Handler
// ============================================================================

export function metricsHandler(req: Request, res: Response): void {
  updateSystemMetrics();
  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(metricsRegistry.export());
}

function updateSystemMetrics(): void {
  metricsRegistry.setGauge(
    MetricNames.PROCESS_UPTIME_SECONDS,
    "Process uptime in seconds",
    process.uptime(),
  );

  const memoryUsage = process.memoryUsage();
  metricsRegistry.setGauge(
    MetricNames.NODEJS_HEAP_SIZE_BYTES,
    "Node.js heap size in bytes",
    memoryUsage.heapUsed,
    { type: "used" },
  );
  metricsRegistry.setGauge(
    MetricNames.NODEJS_HEAP_SIZE_BYTES,
    "Node.js heap size in bytes",
    memoryUsage.heapTotal,
    { type: "total" },
  );
}

// ============================================================================
// Business Metrics Helpers
// ============================================================================

export function recordTranslationCheck(isCorrect: boolean): void {
  metricsRegistry.incrementCounter(
    MetricNames.TRANSLATIONS_CHECKED_TOTAL,
    "Total number of translations checked",
    1,
  );

  if (isCorrect) {
    metricsRegistry.incrementCounter(
      MetricNames.TRANSLATIONS_CORRECT_TOTAL,
      "Total number of correct translations",
      1,
    );
  }
}

export function recordWordServed(category: string, difficulty: number): void {
  metricsRegistry.incrementCounter(
    MetricNames.WORDS_SERVED_TOTAL,
    "Total number of words served",
    1,
    { category, difficulty: String(difficulty) },
  );
}

export function recordGraphQLOperation(
  operationName: string,
  operationType: "query" | "mutation",
  durationSeconds: number,
  hasErrors: boolean,
): void {
  metricsRegistry.observeHistogram(
    MetricNames.GRAPHQL_REQUEST_DURATION,
    "GraphQL request duration in seconds",
    durationSeconds,
    { operation: operationName, type: operationType },
  );

  metricsRegistry.incrementCounter(
    MetricNames.GRAPHQL_OPERATIONS_TOTAL,
    "Total number of GraphQL operations",
    1,
    { operation: operationName, type: operationType },
  );

  if (hasErrors) {
    metricsRegistry.incrementCounter(
      MetricNames.GRAPHQL_ERRORS_TOTAL,
      "Total number of GraphQL errors",
      1,
      { operation: operationName },
    );
  }
}

export function setActiveSessionsCount(count: number): void {
  metricsRegistry.setGauge(
    MetricNames.SESSIONS_ACTIVE,
    "Number of active sessions",
    count,
  );
}
