import { describe, it, expect, beforeEach } from "vitest";
import {
  metricsRegistry,
  MetricNames,
} from "../../infrastructure/monitoring/metrics.js";

describe("MetricsRegistry", () => {
  beforeEach(() => {
    metricsRegistry.reset();
  });

  describe("Counter", () => {
    it("should increment counter", () => {
      metricsRegistry.incrementCounter("test_counter", "Test counter", 1);
      metricsRegistry.incrementCounter("test_counter", "Test counter", 1);

      const output = metricsRegistry.export();
      expect(output).toContain("test_counter 2");
    });

    it("should track counters with different labels", () => {
      metricsRegistry.incrementCounter("http_requests", "Requests", 1, {
        method: "GET",
        status: "200",
      });
      metricsRegistry.incrementCounter("http_requests", "Requests", 1, {
        method: "POST",
        status: "200",
      });
      metricsRegistry.incrementCounter("http_requests", "Requests", 3, {
        method: "GET",
        status: "200",
      });

      const output = metricsRegistry.export();
      expect(output).toContain('http_requests{method="GET",status="200"} 4');
      expect(output).toContain('http_requests{method="POST",status="200"} 1');
    });

    it("should increment by custom value", () => {
      metricsRegistry.incrementCounter("test_counter", "Test", 5);
      metricsRegistry.incrementCounter("test_counter", "Test", 3);

      const output = metricsRegistry.export();
      expect(output).toContain("test_counter 8");
    });
  });

  describe("Gauge", () => {
    it("should set gauge value", () => {
      metricsRegistry.setGauge("test_gauge", "Test gauge", 42);

      const output = metricsRegistry.export();
      expect(output).toContain("test_gauge 42");
    });

    it("should overwrite gauge value", () => {
      metricsRegistry.setGauge("test_gauge", "Test gauge", 10);
      metricsRegistry.setGauge("test_gauge", "Test gauge", 20);

      const output = metricsRegistry.export();
      expect(output).toContain("test_gauge 20");
      expect(output).not.toContain("test_gauge 10");
    });

    it("should increment gauge", () => {
      metricsRegistry.setGauge("connections", "Active connections", 0);
      metricsRegistry.incrementGauge("connections", "Active connections", 1);
      metricsRegistry.incrementGauge("connections", "Active connections", 1);

      const output = metricsRegistry.export();
      expect(output).toContain("connections 2");
    });

    it("should decrement gauge", () => {
      metricsRegistry.setGauge("connections", "Active connections", 5);
      metricsRegistry.decrementGauge("connections", "Active connections", 2);

      const output = metricsRegistry.export();
      expect(output).toContain("connections 3");
    });

    it("should track gauges with labels", () => {
      metricsRegistry.setGauge("memory", "Memory usage", 100, { type: "heap" });
      metricsRegistry.setGauge("memory", "Memory usage", 200, { type: "rss" });

      const output = metricsRegistry.export();
      expect(output).toContain('memory{type="heap"} 100');
      expect(output).toContain('memory{type="rss"} 200');
    });
  });

  describe("Histogram", () => {
    it("should observe histogram values", () => {
      metricsRegistry.observeHistogram(
        "request_duration",
        "Request duration",
        0.1,
      );
      metricsRegistry.observeHistogram(
        "request_duration",
        "Request duration",
        0.2,
      );
      metricsRegistry.observeHistogram(
        "request_duration",
        "Request duration",
        0.5,
      );

      const output = metricsRegistry.export();
      expect(output).toContain("request_duration_count 3");
      expect(output).toContain("request_duration_sum 0.8");
    });

    it("should populate buckets correctly", () => {
      // All values <= 0.1 should be in the 0.1 bucket
      metricsRegistry.observeHistogram("latency", "Latency", 0.05);
      metricsRegistry.observeHistogram("latency", "Latency", 0.1);
      metricsRegistry.observeHistogram("latency", "Latency", 0.3);

      const output = metricsRegistry.export();
      // 0.05 and 0.1 are <= 0.1
      expect(output).toContain('latency_bucket{le="0.1"} 2');
      // All 3 values are <= 0.5
      expect(output).toContain('latency_bucket{le="0.5"} 3');
      // +Inf bucket should have all values
      expect(output).toContain('latency_bucket{le="+Inf"} 3');
    });

    it("should track histograms with labels", () => {
      metricsRegistry.observeHistogram("http_duration", "HTTP duration", 0.1, {
        method: "GET",
      });
      metricsRegistry.observeHistogram("http_duration", "HTTP duration", 0.2, {
        method: "POST",
      });

      const output = metricsRegistry.export();
      expect(output).toContain('method="GET"');
      expect(output).toContain('method="POST"');
    });
  });

  describe("Export Format", () => {
    it("should include HELP comments", () => {
      metricsRegistry.incrementCounter("test_metric", "This is a test metric");

      const output = metricsRegistry.export();
      expect(output).toContain("# HELP test_metric This is a test metric");
    });

    it("should include TYPE comments", () => {
      metricsRegistry.incrementCounter("my_counter", "Counter");
      metricsRegistry.setGauge("my_gauge", "Gauge", 1);
      metricsRegistry.observeHistogram("my_histogram", "Histogram", 0.1);

      const output = metricsRegistry.export();
      expect(output).toContain("# TYPE my_counter counter");
      expect(output).toContain("# TYPE my_gauge gauge");
      expect(output).toContain("# TYPE my_histogram histogram");
    });

    it("should export empty string when no metrics", () => {
      const output = metricsRegistry.export();
      expect(output).toBe("");
    });
  });

  describe("Reset", () => {
    it("should clear all metrics", () => {
      metricsRegistry.incrementCounter("counter", "Counter");
      metricsRegistry.setGauge("gauge", "Gauge", 1);
      metricsRegistry.observeHistogram("histogram", "Histogram", 0.1);

      metricsRegistry.reset();

      const output = metricsRegistry.export();
      expect(output).toBe("");
    });
  });
});

describe("MetricNames", () => {
  it("should have HTTP metrics", () => {
    expect(MetricNames.HTTP_REQUEST_DURATION).toBe(
      "http_request_duration_seconds",
    );
    expect(MetricNames.HTTP_REQUESTS_TOTAL).toBe("http_requests_total");
    expect(MetricNames.HTTP_ACTIVE_CONNECTIONS).toBe("http_active_connections");
  });

  it("should have GraphQL metrics", () => {
    expect(MetricNames.GRAPHQL_REQUEST_DURATION).toBe(
      "graphql_request_duration_seconds",
    );
    expect(MetricNames.GRAPHQL_OPERATIONS_TOTAL).toBe(
      "graphql_operations_total",
    );
    expect(MetricNames.GRAPHQL_ERRORS_TOTAL).toBe("graphql_errors_total");
  });

  it("should have business metrics", () => {
    expect(MetricNames.TRANSLATIONS_CHECKED_TOTAL).toBe(
      "translations_checked_total",
    );
    expect(MetricNames.SESSIONS_ACTIVE).toBe("sessions_active");
    expect(MetricNames.WORDS_SERVED_TOTAL).toBe("words_served_total");
  });

  it("should have system metrics", () => {
    expect(MetricNames.PROCESS_UPTIME_SECONDS).toBe("process_uptime_seconds");
    expect(MetricNames.NODEJS_HEAP_SIZE_BYTES).toBe("nodejs_heap_size_bytes");
  });
});
