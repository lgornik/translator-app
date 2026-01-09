import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  ConsoleLogger,
  DevLogger,
  NullLogger,
} from "../../infrastructure/logging/Logger.js";
import { LogLevel } from "../../application/interfaces/ILogger.js";

describe("ConsoleLogger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log info messages as JSON", () => {
    const logger = new ConsoleLogger({ level: LogLevel.INFO });
    logger.info("Test message");

    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string);
    expect(output.level).toBe("info");
    expect(output.message).toBe("Test message");
  });

  it("should log error messages to console.error", () => {
    const logger = new ConsoleLogger({ level: LogLevel.ERROR });
    logger.error("Error message", new Error("Test error"));

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    const output = JSON.parse(consoleSpy.error.mock.calls[0]?.[0] as string);
    expect(output.level).toBe("error");
    expect(output.error).toBeDefined();
    expect(output.error.message).toBe("Test error");
  });

  it("should log warn messages to console.warn", () => {
    const logger = new ConsoleLogger({ level: LogLevel.WARN });
    logger.warn("Warning message");

    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    const output = JSON.parse(consoleSpy.warn.mock.calls[0]?.[0] as string);
    expect(output.level).toBe("warn");
  });

  it("should include context in log output", () => {
    const logger = new ConsoleLogger({ level: LogLevel.INFO });
    logger.info("Test message", { userId: "123", action: "test" });

    const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string);
    expect(output.context).toEqual({ userId: "123", action: "test" });
  });

  it("should include correlationId at top level", () => {
    const logger = new ConsoleLogger({ level: LogLevel.INFO });
    logger.info("Test message", { correlationId: "corr-123" });

    const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string);
    expect(output.correlationId).toBe("corr-123");
  });

  it("should include requestId at top level", () => {
    const logger = new ConsoleLogger({ level: LogLevel.INFO });
    logger.info("Test message", { requestId: "req-456" });

    const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string);
    expect(output.requestId).toBe("req-456");
  });

  it("should respect log level - skip debug when level is INFO", () => {
    const logger = new ConsoleLogger({ level: LogLevel.INFO });
    logger.debug("Debug message");

    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  it("should respect log level - log debug when level is DEBUG", () => {
    const logger = new ConsoleLogger({ level: LogLevel.DEBUG });
    logger.debug("Debug message");

    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
  });

  it("should include service and version in output", () => {
    const logger = new ConsoleLogger({
      service: "test-service",
      version: "2.0.0",
      level: LogLevel.INFO,
    });
    logger.info("Test");

    const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string);
    expect(output.service).toBe("test-service");
    expect(output.version).toBe("2.0.0");
  });

  it("should include timestamp in ISO format", () => {
    const logger = new ConsoleLogger({ level: LogLevel.INFO });
    logger.info("Test");

    const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string);
    expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  describe("child logger", () => {
    it("should create child logger with inherited context", () => {
      const logger = new ConsoleLogger(
        { level: LogLevel.INFO },
        { service: "parent" },
      );
      const child = logger.child({ component: "child-component" });

      child.info("Child message");

      const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string);
      expect(output.context.service).toBe("parent");
      expect(output.context.component).toBe("child-component");
    });

    it("should inherit correlationId from parent", () => {
      const logger = new ConsoleLogger(
        { level: LogLevel.INFO },
        { correlationId: "parent-corr" },
      );
      const child = logger.child({ component: "child" });

      child.info("Child message");

      const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string);
      expect(output.correlationId).toBe("parent-corr");
    });

    it("should use requestId as correlationId if not set", () => {
      const logger = new ConsoleLogger({ level: LogLevel.INFO });
      const child = logger.child({ requestId: "req-789" });

      expect(child.getCorrelationId()).toBe("req-789");
    });
  });

  describe("getCorrelationId", () => {
    it("should return correlationId if set", () => {
      const logger = new ConsoleLogger(
        { level: LogLevel.INFO },
        { correlationId: "corr-123" },
      );
      expect(logger.getCorrelationId()).toBe("corr-123");
    });

    it("should return requestId as fallback", () => {
      const logger = new ConsoleLogger(
        { level: LogLevel.INFO },
        { requestId: "req-456" },
      );
      expect(logger.getCorrelationId()).toBe("req-456");
    });

    it("should return undefined if neither set", () => {
      const logger = new ConsoleLogger({ level: LogLevel.INFO });
      expect(logger.getCorrelationId()).toBeUndefined();
    });
  });

  describe("error logging", () => {
    it("should include error name and message", () => {
      const logger = new ConsoleLogger({ level: LogLevel.ERROR });
      const error = new Error("Something went wrong");
      logger.error("Error occurred", error);

      const output = JSON.parse(consoleSpy.error.mock.calls[0]?.[0] as string);
      expect(output.error.name).toBe("Error");
      expect(output.error.message).toBe("Something went wrong");
    });

    it("should include error stack", () => {
      const logger = new ConsoleLogger({ level: LogLevel.ERROR });
      const error = new Error("Stack trace test");
      logger.error("Error", error);

      const output = JSON.parse(consoleSpy.error.mock.calls[0]?.[0] as string);
      expect(output.error.stack).toContain("Stack trace test");
    });

    it("should include error code if present", () => {
      const logger = new ConsoleLogger({ level: LogLevel.ERROR });
      const error = new Error("Custom error") as Error & { code: string };
      error.code = "CUSTOM_CODE";
      logger.error("Error", error);

      const output = JSON.parse(consoleSpy.error.mock.calls[0]?.[0] as string);
      expect(output.error.code).toBe("CUSTOM_CODE");
    });
  });
});

describe("DevLogger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log messages with color codes", () => {
    const logger = new DevLogger();
    logger.info("Test message");

    expect(consoleSpy.log).toHaveBeenCalled();
    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    expect(output).toContain("[INFO ]");
    expect(output).toContain("Test message");
  });

  it("should log debug messages", () => {
    const logger = new DevLogger();
    logger.debug("Debug message");

    expect(consoleSpy.log).toHaveBeenCalled();
    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    expect(output).toContain("[DEBUG]");
  });

  it("should log warn messages", () => {
    const logger = new DevLogger();
    logger.warn("Warning message");

    expect(consoleSpy.log).toHaveBeenCalled();
    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    expect(output).toContain("[WARN ]");
  });

  it("should log error messages and error object", () => {
    const logger = new DevLogger();
    const error = new Error("Test error");
    logger.error("Error message", error);

    expect(consoleSpy.log).toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalledWith(error);
    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    expect(output).toContain("[ERROR]");
  });

  it("should include correlationId in output", () => {
    const logger = new DevLogger({ correlationId: "corr-123" });
    logger.info("Test");

    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    expect(output).toContain("[corr-123");
  });

  it("should print context as JSON", () => {
    const logger = new DevLogger();
    logger.info("Test", { userId: "123" });

    expect(consoleSpy.log).toHaveBeenCalledTimes(2);
    const contextOutput = consoleSpy.log.mock.calls[1]?.[0] as string;
    expect(contextOutput).toContain("userId");
  });

  describe("child logger", () => {
    it("should create child with merged context", () => {
      const logger = new DevLogger({ service: "parent" });
      const child = logger.child({ component: "child" });

      expect(child).toBeInstanceOf(DevLogger);
    });

    it("should inherit correlationId", () => {
      const logger = new DevLogger({ correlationId: "parent-corr" });
      const child = logger.child({ component: "child" });

      expect(child.getCorrelationId()).toBe("parent-corr");
    });
  });
});

describe("NullLogger", () => {
  it("should not throw on any method", () => {
    const logger = new NullLogger();

    expect(() => logger.debug()).not.toThrow();
    expect(() => logger.info()).not.toThrow();
    expect(() => logger.warn()).not.toThrow();
    expect(() => logger.error()).not.toThrow();
  });

  it("should return itself on child()", () => {
    const logger = new NullLogger();
    const child = logger.child({ test: "context" });

    expect(child).toBe(logger);
  });

  it("should return undefined for getCorrelationId", () => {
    const logger = new NullLogger();
    expect(logger.getCorrelationId()).toBeUndefined();
  });
});
