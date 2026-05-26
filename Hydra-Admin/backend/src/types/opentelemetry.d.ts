// Ambient module declarations for OpenTelemetry packages.
// Bun's workspace module layout uses a content-addressed store that TypeScript's
// classic "node" moduleResolution can't traverse. Declaring the modules here
// lets the build succeed; runtime resolution works correctly via bun.
declare module '@opentelemetry/sdk-node';
declare module '@opentelemetry/auto-instrumentations-node';
declare module '@opentelemetry/resources';
declare module '@opentelemetry/semantic-conventions';
declare module '@opentelemetry/exporter-trace-otlp-http';
declare module '@opentelemetry/exporter-metrics-otlp-http';
declare module '@opentelemetry/sdk-metrics';
declare module '@opentelemetry/sdk-trace-base';
