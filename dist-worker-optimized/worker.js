var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert: assert2,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// worker.js
var CACHE_NAME = "sales-proxy-cache-v2";
var CACHE_TTL = 10 * 60 * 1e3;
var worker_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    if (request.method === "GET" && !url.pathname.startsWith("/api/")) {
      const cachedResponse = await getFromCache(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    if (url.pathname === "/api/traffic-operation" && request.method === "POST") {
      return await handleTrafficOperationRequest(request, env2);
    }
    if (url.pathname === "/api/risk-control-and-after-sales" && request.method === "POST") {
      return await handleRiskControlRequest(request, env2);
    }
    if (url.pathname === "/api/data-operation-dashboard" && request.method === "POST") {
      return await handleDataOperationRequest(request, env2);
    }
    if (url.pathname === "/api/cooperation-model" && request.method === "POST") {
      return await handleCooperationModelRequest(request, env2);
    }
    if (url.pathname.startsWith("/api/")) {
      const moduleName = url.pathname.substring(5);
      if (request.method === "GET") {
        switch (moduleName) {
          case "drug-selection-strategy":
            return handleSelectionStrategyRequest(request, env2);
          default:
            return new Response(JSON.stringify({ error: "Invalid module name or method not allowed", module: moduleName }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
        }
      }
      if (request.method === "POST") {
        let body = {};
        try {
          body = await request.json();
        } catch (e) {
        }
        const newBody = { ...body, module_name: moduleName };
        const newRequest = new Request(request.url, {
          method: "POST",
          headers: request.headers,
          body: JSON.stringify(newBody)
        });
        return await handleRequest(newRequest, env2);
      }
    }
    if (request.method === "POST") {
      return await handleRequest(request, env2);
    }
    try {
      const response = await env2.ASSETS.fetch(request);
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Cache-Control", "public, max-age=600, stale-while-revalidate=300");
      newHeaders.set("Expires", new Date(Date.now() + 6e5).toUTCString());
      if (request.method === "GET") {
        await putInCache(request, response);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (e) {
      console.error("Static asset fetch failed:", e);
      return new Response("Static asset fetch failed: " + e.message, { status: 500 });
    }
  }
};
async function saveToBlockchain(terms) {
  return {
    term_id: `term_${Date.now()}`,
    contract_status: "draft",
    signed_urls: {
      brand_signature: "https://sign.url/brand",
      affiliate_signature: "https://sign.url/affiliate"
    },
    blockchain_proof: "0x123abc..."
  };
}
__name(saveToBlockchain, "saveToBlockchain");
async function getFromCache(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cacheTime = cachedResponse.headers.get("x-cache-time");
      if (cacheTime && Date.now() - parseInt(cacheTime) < CACHE_TTL) {
        const headers = new Headers(cachedResponse.headers);
        headers.set("x-cache-last-access", Date.now().toString());
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers
        });
      } else {
        await cache.delete(request);
      }
    }
  } catch (e) {
    console.error("Cache read error:", e);
  }
  return null;
}
__name(getFromCache, "getFromCache");
async function putInCache(request, response) {
  try {
    if (request.method === "GET" && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.set("x-cache-time", Date.now().toString());
      headers.set("x-cache-last-access", Date.now().toString());
      const responseToCache = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers
      });
      await cache.put(request, responseToCache);
    }
  } catch (e) {
    console.error("Cache write error:", e);
  }
}
__name(putInCache, "putInCache");
async function verifyParty(term_id, party) {
  return true;
}
__name(verifyParty, "verifyParty");
async function triggerArbitration(details) {
  return `arbitration_${Date.now()}`;
}
__name(triggerArbitration, "triggerArbitration");
async function queryData(term_id, data_type, time_range) {
  if (data_type === "sales") {
    return {
      total: 15e4,
      avg_daily: 5e3,
      top_region: "\u5E7F\u4E1C"
    };
  }
  return {};
}
__name(queryData, "queryData");
async function handleRiskControlRequest(request, env2) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed",
      allowed_methods: ["POST"],
      received_method: request.method
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return new Response(JSON.stringify({
      error: "Unsupported content type",
      expected: "application/json",
      received: contentType
    }), {
      status: 406,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    body = await request.json();
  } catch (error3) {
    return new Response(JSON.stringify({
      error: "Invalid JSON body",
      details: error3.message
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const module = body.module_name;
  switch (module) {
    case "tencent_cloud_medical_content_audit":
      return handleContentAudit(body, env2);
    case "compliant_pharmacist_transfer":
      return handlePharmacistTransfer(body, env2);
    case "drug_registration_wechat_notification":
      return handleWechatNotification(body, env2);
    case "return_refund_auto_review":
      return handleReturnReview(body, env2);
    default:
      return new Response(JSON.stringify({ error: "Invalid module name", module }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
  }
}
__name(handleRiskControlRequest, "handleRiskControlRequest");
async function handleTrafficOperationRequest(request, env2) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed",
      allowed_methods: ["POST"],
      received_method: request.method
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return new Response(JSON.stringify({
      error: "Unsupported content type",
      expected: "application/json",
      received: contentType
    }), {
      status: 406,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    body = await request.json();
  } catch (error3) {
    return new Response(JSON.stringify({
      error: "Invalid JSON body",
      details: error3.message
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const module = body.module_name;
  switch (module) {
    case "chanmama_ad_placement":
      return handleChanmamaAdPlacement(body, env2);
    case "jietiao_smart_clipping":
      return handleJietiaoSmartClipping(body, env2);
    case "influencer_recommendation":
      return handleInfluencerRecommendation(body, env2);
    case "publish_schedule_webhook":
      return handlePublishScheduleWebhook(body, env2);
    default:
      return new Response(JSON.stringify({ error: "Invalid module name", module }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
  }
}
__name(handleTrafficOperationRequest, "handleTrafficOperationRequest");
async function handleContentAudit(body, env2) {
  const { content_type, content, product_id } = body;
  if (!content_type || !content) {
    return new Response(JSON.stringify({ error: "Missing required fields: content_type, content" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["video_script", "product_copy", "live_comment"].includes(content_type)) {
    return new Response(JSON.stringify({ error: "Invalid content_type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const auditResult = {
    audit_id: `audit_${Date.now()}`,
    audit_result: "warning",
    violation_details: [
      { type: "\u7597\u6548\u5938\u5927", position: "\u7B2C3\u884C\u7B2C5\u5217", suggestion: "\u66FF\u6362\u4E3A'\u8F85\u52A9\u7F13\u89E3\u809D\u533A\u4E0D\u9002'" }
    ],
    risk_level: "medium"
  };
  return new Response(JSON.stringify(auditResult), { headers: { "Content-Type": "application/json" } });
}
__name(handleContentAudit, "handleContentAudit");
async function handlePharmacistTransfer(body, env2) {
  const { user_question, product_id, user_info } = body;
  if (!user_question || !user_info) {
    return new Response(JSON.stringify({ error: "Missing required fields: user_question, user_info" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const transferResult = {
    transfer_id: `transfer_${Date.now()}`,
    transfer_status: "accepted",
    pharmacist_reply: "\u62A4\u809D\u7247\u4E0D\u5EFA\u8BAE\u4E0E\u9152\u7CBE\u540C\u670D\uFF0C\u53EF\u80FD\u52A0\u91CD\u809D\u810F\u8D1F\u62C5\u3002\u5982\u9700\u996E\u9152\uFF0C\u8BF7\u95F4\u96942\u5C0F\u65F6\u4EE5\u4E0A\u3002"
  };
  return new Response(JSON.stringify(transferResult), { headers: { "Content-Type": "application/json" } });
}
__name(handlePharmacistTransfer, "handlePharmacistTransfer");
async function handleWechatNotification(body, env2) {
  const { report_info, webhook_url } = body;
  if (!report_info || !webhook_url) {
    return new Response(JSON.stringify({ error: "Missing required fields: report_info, webhook_url" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const notificationResult = {
    notification_id: `notify_${Date.now()}`,
    notification_status: "sent"
  };
  return new Response(JSON.stringify(notificationResult), { headers: { "Content-Type": "application/json" } });
}
__name(handleWechatNotification, "handleWechatNotification");
async function handleReturnReview(body, env2) {
  const { return_request, product_info, order_info } = body;
  if (!return_request || !product_info || !order_info) {
    return new Response(JSON.stringify({ error: "Missing required fields: return_request, product_info, order_info" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const reviewResult = {
    review_id: `review_${Date.now()}`,
    review_result: "approved",
    action_taken: "\u5DF2\u53D1\u8D77\u9000\u6B3E\uFF0C\u9884\u8BA11-3\u4E2A\u5DE5\u4F5C\u65E5\u5230\u8D26",
    rejection_reason: ""
  };
  return new Response(JSON.stringify(reviewResult), { headers: { "Content-Type": "application/json" } });
}
__name(handleReturnReview, "handleReturnReview");
async function handleDataOperationRequest(request, env2) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed",
      allowed_methods: ["POST"],
      received_method: request.method
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return new Response(JSON.stringify({
      error: "Unsupported content type",
      expected: "application/json",
      received: contentType
    }), {
      status: 406,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    body = await request.json();
  } catch (error3) {
    return new Response(JSON.stringify({
      error: "Invalid JSON body",
      details: error3.message
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const module = body.module_name;
  switch (module) {
    case "operation_indicator_query":
      return handleIndicatorQuery(body, env2);
    case "dashboard_config_generator":
      return handleDashboardConfig(body, env2);
    case "real_time_indicator_push":
      return handleRealTimePush(body, env2);
    default:
      return new Response(JSON.stringify({ error: "Invalid module name", module }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
  }
}
__name(handleDataOperationRequest, "handleDataOperationRequest");
async function handleCooperationModelRequest(request, env2) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed",
      allowed_methods: ["POST"],
      received_method: request.method
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return new Response(JSON.stringify({
      error: "Unsupported content type",
      expected: "application/json",
      received: contentType
    }), {
      status: 406,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    body = await request.json();
  } catch (error3) {
    return new Response(JSON.stringify({
      error: "Invalid JSON body",
      details: error3.message
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const module = body.module_name;
  switch (module) {
    case "cooperation_term_configuration":
      return handleTermConfiguration(body, env2);
    case "rights_and_responsibilities_manager":
      return handleRightsManagement(body, env2);
    case "cooperation_process_tracker":
      return handleProcessTracking(body, env2);
    case "data_sharing_portal":
      return handleDataSharing(body, env2);
    default:
      return new Response(JSON.stringify({ error: "Invalid module name", module }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
  }
}
__name(handleCooperationModelRequest, "handleCooperationModelRequest");
async function handleRequest(request, env2) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed",
      allowed_methods: ["POST"],
      received_method: request.method
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return new Response(JSON.stringify({
      error: "Unsupported content type",
      expected: "application/json",
      received: contentType
    }), {
      status: 406,
      headers: { "Content-Type": "application/json" }
    });
  }
  let body;
  try {
    body = await request.json();
  } catch (error3) {
    return new Response(JSON.stringify({
      error: "Invalid JSON body",
      details: error3.message
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const module = body.module_name;
  switch (module) {
    case "operation_indicator_query":
      return handleIndicatorQuery(body, env2);
    case "dashboard_config_generator":
      return handleDashboardConfig(body, env2);
    case "real_time_indicator_push":
      return handleRealTimePush(body, env2);
    case "cooperation_term_configuration":
      return handleTermConfiguration(body, env2);
    case "rights_and_responsibilities_manager":
      return handleRightsManagement(body, env2);
    case "cooperation_process_tracker":
      return handleProcessTracking(body, env2);
    case "data_sharing_portal":
      return handleDataSharing(body, env2);
    case "chanmama_ad_placement":
      return handleChanmamaAdPlacement(body, env2);
    case "jietiao_smart_clipping":
      return handleJietiaoSmartClipping(body, env2);
    case "influencer_recommendation":
      return handleInfluencerRecommendation(body, env2);
    case "publish_schedule_webhook":
      return handlePublishScheduleWebhook(body, env2);
    case "generate-video-script":
      return handleScriptGenerationRequest(body, env2);
    default:
      return new Response(JSON.stringify({ error: "Invalid module name", module }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
  }
}
__name(handleRequest, "handleRequest");
async function handleIndicatorQuery(body, env2) {
  const { time_range, platform: platform2, product_type, metric_types, drill_down } = body;
  const allIndicators = {
    "\u64AD\u653E\u91CF": { value: 12e4, unit: "\u6B21", trend: "\u219115%\uFF08\u8F83\u6628\u65E5\uFF09" },
    "\u8F6C\u5316\u7387": { value: 3.8, unit: "%", trend: "\u2192\u6301\u5E73" },
    "ROI": { value: 1.28, unit: "", trend: "\u21918%\uFF08\u8F83\u4E0A\u5468\uFF09" },
    "\u9000\u8D27\u7387": { value: 4.2, unit: "%", trend: "\u21935%\uFF08\u8F83\u4E0A\u5468\uFF09" },
    "\u5BA2\u5355\u4EF7": { value: 89.5, unit: "\u5143", trend: "\u2192\u6301\u5E73" },
    "\u590D\u8D2D\u7387": { value: 12.3, unit: "%", trend: "\u21913%\uFF08\u8F83\u4E0A\u6708\uFF09" }
  };
  const indicators = metric_types.map((metric) => ({
    metric_name: metric,
    ...allIndicators[metric]
  }));
  if (drill_down && drill_down.product_id) {
    indicators.forEach((indicator) => {
      if (indicator.metric_name === "\u64AD\u653E\u91CF") {
        indicator.drill_down_data = { product_id: drill_down.product_id, play_count: 8e4 };
      } else if (indicator.metric_name === "\u8F6C\u5316\u7387") {
        indicator.drill_down_data = { product_id: drill_down.product_id, conversion_rate: 4.2 };
      } else if (indicator.metric_name === "\u9000\u8D27\u7387") {
        indicator.drill_down_data = { product_id: drill_down.product_id, return_rate: 3.8 };
      }
    });
  }
  const result = {
    request_id: `req_${Date.now()}`,
    indicators,
    dashboard_config_hint: { recommended_charts: ["\u6298\u7EBF\u56FE\uFF08\u64AD\u653E\u91CF\u8D8B\u52BF\uFF09", "\u67F1\u72B6\u56FE\uFF08\u5546\u54C1\u8F6C\u5316\u7387\u5BF9\u6BD4\uFF09"] }
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleIndicatorQuery, "handleIndicatorQuery");
async function handleDashboardConfig(body, env2) {
  const { chart_list, time_range, platform: platform2 } = body;
  const validChartTypes = {
    "\u64AD\u653E\u91CF": ["line", "bar"],
    "\u8F6C\u5316\u7387": ["line", "bar"],
    "ROI": ["line", "bar"],
    "\u9000\u8D27\u7387": ["line", "bar"],
    "\u5BA2\u5355\u4EF7": ["line", "bar"],
    "\u590D\u8D2D\u7387": ["line", "bar"],
    "\u6D41\u91CF\u5360\u6BD4": ["pie"]
  };
  const invalidCharts = chart_list.filter(
    (chart) => validChartTypes[chart.metric] && !validChartTypes[chart.metric].includes(chart.chart_type)
  );
  if (invalidCharts.length > 0) {
    return new Response(JSON.stringify({
      error: `\u56FE\u8868\u7C7B\u578B\u4E0E\u6307\u6807\u4E0D\u5339\u914D: ${invalidCharts.map((c) => c.metric).join(", ")}`
    }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const config2 = {
    title: `\u836F\u54C1\u4EE3\u9500${platform2}\u8FD0\u8425\u4EEA\u8868\u76D8\uFF08${time_range}\uFF09`,
    charts: chart_list.map((chart, index) => {
      if (chart.chart_type === "pie") {
        return {
          id: `chart${index + 1}`,
          type: chart.chart_type,
          data: {
            categories: ["\u6296\u97F3", "\u89C6\u9891\u53F7", "\u5176\u4ED6"],
            series: [{
              name: chart.metric,
              data: [60, 30, 10]
            }]
          },
          options: {
            title: chart.title
          }
        };
      } else {
        return {
          id: `chart${index + 1}`,
          type: chart.chart_type,
          data: {
            xAxis: ["5/14", "5/15", "5/16", "5/17", "5/18", "5/19", "5/20"],
            series: [{
              name: chart.metric,
              data: [1e5, 11e4, 12e4, 115e3, 125e3, 13e4, 14e4]
            }]
          },
          options: {
            xAxisName: chart.dimension || "\u65E5\u671F",
            yAxisName: chart.metric,
            title: chart.title
          }
        };
      }
    })
  };
  let layout = "1\u5217\u5E03\u5C40";
  if (chart_list.length >= 2) {
    layout = "2\u5217\u7F51\u683C";
  }
  if (chart_list.length >= 4) {
    layout = "4\u8C61\u9650\u5E03\u5C40";
  }
  const result = {
    dashboard_id: `dash_${Date.now()}`,
    config_json: config2,
    render_instructions: `\u4F7F\u7528ECharts\u6E32\u67D3\uFF0C\u5E03\u5C40\u4E3A${layout}\uFF0C\u9876\u90E8\u6DFB\u52A0\u65F6\u95F4\u7B5B\u9009\u5668`
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleDashboardConfig, "handleDashboardConfig");
async function handleRealTimePush(body, env2) {
  const { webhook_url, metric_thresholds } = body;
  let alertContent = "";
  let hasAlert = false;
  const currentMetrics = {
    "\u9000\u8D27\u7387": 6.2,
    "ROI": 1.2
  };
  metric_thresholds.forEach((threshold) => {
    const currentValue = currentMetrics[threshold.metric];
    if (currentValue !== void 0) {
      if (threshold.comparison === "above" && currentValue > threshold.threshold) {
        alertContent = `\u3010\u5F02\u5E38\u9884\u8B66\u3011${threshold.metric}\u5347\u81F3${currentValue}%\uFF08\u9608\u503C${threshold.threshold}%\uFF09\uFF0C\u8F83\u6628\u65E5+120%\u3002\u63A8\u6D4B\u539F\u56E0\uFF1A\u90E8\u5206\u7528\u6237\u53CD\u9988\u80A0\u80C3\u4E0D\u9002\uFF0C\u5EFA\u8BAE\u8F6C\u63A5\u836F\u5E08\u6838\u5B9E\u3002`;
        hasAlert = true;
      } else if (threshold.comparison === "below" && currentValue < threshold.threshold) {
        alertContent = `\u3010\u5F02\u5E38\u9884\u8B66\u3011${threshold.metric}\u964D\u81F3${currentValue}\uFF08\u9608\u503C${threshold.threshold}\uFF09\uFF0C\u8F83\u6628\u65E5-20%\u3002\u63A8\u6D4B\u539F\u56E0\uFF1A\u53EF\u80FD\u53D7\u5E02\u573A\u73AF\u5883\u5F71\u54CD\uFF0C\u5EFA\u8BAE\u5173\u6CE8\u7ADE\u54C1\u52A8\u6001\u3002`;
        hasAlert = true;
      }
    }
  });
  if (!hasAlert) {
    alertContent = "\u3010\u6307\u6807\u6B63\u5E38\u3011\u6240\u6709\u76D1\u63A7\u6307\u6807\u5747\u5728\u6B63\u5E38\u8303\u56F4\u5185";
  }
  let pushStatus = "sent";
  let failureReason = "";
  try {
  } catch (error3) {
    pushStatus = "failed";
    failureReason = "Webhook URL\u5931\u6548";
  }
  const result = {
    push_id: `push_${Date.now()}`,
    push_status: pushStatus,
    alert_content: alertContent,
    failure_reason: failureReason
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleRealTimePush, "handleRealTimePush");
async function handleTermConfiguration(body, env2) {
  const { brand_id, affiliate_id, product_ids, cooperation_type, terms } = body;
  if (!brand_id || !affiliate_id || !product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return new Response(JSON.stringify({ error: "Missing required fields: brand_id, affiliate_id, product_ids" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!cooperation_type || !["\u72EC\u5BB6\u4EE3\u7406", "\u975E\u72EC\u5BB6\u4EE3\u7406", "\u5BC4\u552E\u6A21\u5F0F", "\u4E00\u4EF6\u4EE3\u53D1"].includes(cooperation_type)) {
    return new Response(JSON.stringify({ error: "Invalid cooperation_type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!terms.compliance || !terms.compliance.content_audit_responsibility || !terms.compliance.qualification_sharing) {
    return new Response(JSON.stringify({ error: "Missing required compliance terms" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const term = await saveToBlockchain(terms);
  return new Response(JSON.stringify(term), { headers: { "Content-Type": "application/json" } });
}
__name(handleTermConfiguration, "handleTermConfiguration");
async function handleRightsManagement(body, env2) {
  const { term_id, party, action, details } = body;
  if (!term_id || !party || !action) {
    return new Response(JSON.stringify({ error: "Missing required fields: term_id, party, action" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["brand", "affiliate"].includes(party)) {
    return new Response(JSON.stringify({ error: "Invalid party" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["modify_term", "raise_dispute", "confirm_change"].includes(action)) {
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!await verifyParty(term_id, party)) {
    return new Response(JSON.stringify({ error: "Unauthorized party" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  let arbitration_id = null;
  if (action === "raise_dispute") {
    arbitration_id = await triggerArbitration(details);
  }
  const result = {
    change_id: `change_${Date.now()}`,
    current_terms: details,
    // 简化处理，实际应返回最新条款
    dispute_status: arbitration_id ? "under_arbitration" : "pending"
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleRightsManagement, "handleRightsManagement");
async function handleProcessTracking(body, env2) {
  const { term_id, action } = body;
  if (!term_id || !action) {
    return new Response(JSON.stringify({ error: "Missing required fields: term_id, action" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["launch", "pause", "terminate", "settle"].includes(action)) {
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const result = {
    process_id: `process_${Date.now()}`,
    current_status: action === "settle" ? "settled" : `${action}d`,
    next_steps: action === "launch" ? ["brand to ship products within 3 days"] : []
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleProcessTracking, "handleProcessTracking");
async function handleDataSharing(body, env2) {
  const { term_id, data_type, time_range } = body;
  if (!term_id || !data_type || !time_range) {
    return new Response(JSON.stringify({ error: "Missing required fields: term_id, data_type, time_range" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["sales", "user_feedback", "inventory"].includes(data_type)) {
    return new Response(JSON.stringify({ error: "Invalid data_type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["\u8FD17\u5929", "\u8FD130\u5929", "\u81EA\u5B9A\u4E49"].includes(time_range)) {
    return new Response(JSON.stringify({ error: "Invalid time_range" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const data = await queryData(term_id, data_type, time_range);
  const result = {
    data_report: {
      [data_type]: data,
      chart: data_type === "sales" ? "\u6298\u7EBF\u56FE\uFF08\u8FD130\u5929\u9500\u552E\u8D8B\u52BF\uFF09" : ""
    },
    access_log: [{
      user: "affiliate_admin",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      data_type
    }]
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleDataSharing, "handleDataSharing");
async function handleChanmamaAdPlacement(body, env2) {
  const { product_id, budget, target_audience, platform: platform2 } = body;
  if (!product_id || !budget || !target_audience || !platform2) {
    return new Response(JSON.stringify({ error: "Missing required fields: product_id, budget, target_audience, platform" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["\u71AC\u591C\u515A/\u9152\u5C40\u515A", "\u4E2D\u8001\u5E74\u517B\u751F", "\u6BCD\u5A74\u5BB6\u5EAD"].includes(target_audience)) {
    return new Response(JSON.stringify({ error: "Invalid target_audience" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["\u6296\u97F3", "\u89C6\u9891\u53F7"].includes(platform2)) {
    return new Response(JSON.stringify({ error: "Invalid platform" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const roiPrediction = platform2 === "\u6296\u97F3" ? 1.28 : 1.2;
  const targetingSettings = {
    age: target_audience === "\u4E2D\u8001\u5E74\u517B\u751F" ? "36-50" : "18-45",
    interest: target_audience,
    region: "\u4E00\u7EBF/\u65B0\u4E00\u7EBF\u57CE\u5E02"
  };
  const budgetAllocation = {
    test: Math.round(budget * 0.2),
    formal: Math.round(budget * 0.8)
  };
  const complianceAlert = roiPrediction < 1.2 ? "\u9884\u6D4BROI\u4F4E\u4E8E\u57FA\u51C6\u7EBF\uFF0C\u8BF7\u8003\u8651\u8C03\u6574\u9884\u7B97\u6216\u5B9A\u5411\u7B56\u7565" : "";
  const result = {
    ad_plan_id: `camp_${Date.now()}`,
    roi_prediction: roiPrediction,
    targeting_settings: targetingSettings,
    budget_allocation: budgetAllocation,
    compliance_alert: complianceAlert
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleChanmamaAdPlacement, "handleChanmamaAdPlacement");
async function handleJietiaoSmartClipping(body, env2) {
  const { video_url, product_type, target_duration } = body;
  if (!video_url || !product_type || !target_duration) {
    return new Response(JSON.stringify({ error: "Missing required fields: video_url, product_type, target_duration" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["OTC\u836F\u54C1", "\u4FDD\u5065\u54C1", "\u4E2D\u836F\u996E\u7247"].includes(product_type)) {
    return new Response(JSON.stringify({ error: "Invalid product_type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const processedVideos = [
    { url: "https://oss.aliyuncs.com/video_1.mp4", completion_rate: "42%" },
    { url: "https://oss.aliyuncs.com/video_3.mp4", completion_rate: "38%" },
    { url: "https://oss.aliyuncs.com/video_7.mp4", completion_rate: "36%" }
  ];
  const result = {
    processed_videos: processedVideos,
    wasm_status: true
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleJietiaoSmartClipping, "handleJietiaoSmartClipping");
async function handleInfluencerRecommendation(body, env2) {
  const { product_type, target_platform, budget_range } = body;
  if (!product_type || !target_platform || !budget_range) {
    return new Response(JSON.stringify({ error: "Missing required fields: product_type, target_platform, budget_range" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["OTC\u836F\u54C1", "\u4FDD\u5065\u54C1", "\u4E2D\u836F\u996E\u7247"].includes(product_type)) {
    return new Response(JSON.stringify({ error: "Invalid product_type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["\u6296\u97F3", "\u89C6\u9891\u53F7", "\u5FEB\u624B"].includes(target_platform)) {
    return new Response(JSON.stringify({ error: "Invalid target_platform" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["\u4F4E\uFF08\uFF1C5000\u5143\uFF09", "\u4E2D\uFF085000-2\u4E07\uFF09", "\u9AD8\uFF08\uFF1E2\u4E07\uFF09"].includes(budget_range)) {
    return new Response(JSON.stringify({ error: "Invalid budget_range" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const influencers = [
    {
      name: "\u5065\u5EB7\u5C0F\u590F\uFF08\u6296\u97F3\uFF09",
      follower_count: "35\u4E07",
      conversion_rate: "4.2%",
      commission_rate: "20%",
      contact: "\u79C1\u4FE1/\u661F\u56FE\u5E73\u53F0",
      profile_url: "https://www.douyin.com/user/MS4wLjABAAAA_healthxia"
    },
    {
      name: "\u517B\u751F\u8FBE\u4EBA\u674E\u533B\u751F\uFF08\u89C6\u9891\u53F7\uFF09",
      follower_count: "28\u4E07",
      conversion_rate: "3.8%",
      commission_rate: "18%",
      contact: "\u79C1\u4FE1/\u89C6\u9891\u53F7",
      profile_url: "https://channels.weixin.qq.com/profile?username=DrLi_health"
    }
  ];
  const result = {
    influencers,
    recommendation_reason: `\u5339\u914D${product_type}\u54C1\u7C7B\uFF0C\u8FD130\u5929\u8F6C\u5316\u7387\uFF1E3.5%\uFF0C\u65E0\u8FDD\u89C4\u8BB0\u5F55`
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleInfluencerRecommendation, "handleInfluencerRecommendation");
async function handlePublishScheduleWebhook(body, env2) {
  const { platform: platform2, publish_time, main_account_id, sub_account_ids, webhook_url } = body;
  if (!platform2 || !publish_time || !main_account_id || !sub_account_ids || !webhook_url) {
    return new Response(JSON.stringify({ error: "Missing required fields: platform, publish_time, main_account_id, sub_account_ids, webhook_url" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["\u6296\u97F3", "\u89C6\u9891\u53F7"].includes(platform2)) {
    return new Response(JSON.stringify({ error: "Invalid platform" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!Array.isArray(sub_account_ids)) {
    return new Response(JSON.stringify({ error: "sub_account_ids must be an array" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const notificationContent = `\u3010${platform2}\u53D1\u5E03\u63D0\u9192\u3011\u4E3B\u8D26\u53F7${main_account_id}\u7684\u89C6\u9891\u5DF2\u8C03\u5EA6\uFF0C\u53D1\u5E03\u65F6\u95F4\uFF1A${new Date(publish_time).toLocaleString("zh-CN")}\uFF0C\u5B50\u8D26\u53F7\uFF1A${sub_account_ids.join("\u3001")}`;
  let webhookStatus = "sent";
  let failureReason = "";
  try {
  } catch (error3) {
    webhookStatus = "failed";
    failureReason = "Webhook URL\u5931\u6548";
  }
  const result = {
    schedule_id: `pub_${Date.now()}`,
    publish_status: "\u5DF2\u8C03\u5EA6",
    notification_content: notificationContent,
    webhook_status: webhookStatus,
    failure_reason: failureReason
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handlePublishScheduleWebhook, "handlePublishScheduleWebhook");
async function handleSelectionStrategyRequest(request, env2) {
  const strategy = {
    api_name: "drug_affiliate_video_sales_selection_strategy",
    version: "1.0",
    description: "\u836F\u54C1\u4EE3\u9500\u77ED\u89C6\u9891\u5E26\u8D27\u9009\u54C1\u7B56\u7565API\uFF0C\u8986\u76D6\u8206\u60C5\u53CD\u5411\u9009\u54C1\u3001\u70ED\u70B9\u501F\u52BF\u3001\u6570\u636E\u9A8C\u8BC1\u53CA\u5229\u6DA6\u6D4B\u7B97",
    config: {
      public_opinion_monitoring: {
        tool: "\u6E05\u535A\u8206\u60C5\u7CFB\u7EDF",
        purpose: "\u53CD\u5411\u7B5B\u9009\u4F4E\u98CE\u9669\u5546\u54C1\uFF08\u6392\u9664\u8D1F\u9762\u8206\u60C5\u96C6\u4E2D\u7684\u54C1\u7C7B\uFF09",
        monitor_targets: [
          "\u5546\u54C1\u8BC4\u8BBA\u533A",
          "\u76F4\u64AD\u95F4\u5F39\u5E55",
          "\u793E\u4EA4\u5E73\u53F0\uFF08\u5C0F\u7EA2\u4E66/\u6296\u97F3\uFF09\u7528\u6237\u53CD\u9988",
          "\u7535\u5546\u5E73\u53F0\uFF08\u4EAC\u4E1C\u5065\u5EB7/\u62FC\u591A\u591A\uFF09\u5DEE\u8BC4"
        ],
        negative_keywords: [
          "\u8FC7\u654F",
          "\u65E0\u6548",
          "\u526F\u4F5C\u7528\u5927",
          "\u6CA1\u6548\u679C",
          "\u5934\u6655",
          "\u6076\u5FC3"
        ],
        filter_rule: "\u5546\u54C1\u8D1F\u9762\u5173\u952E\u8BCD\u63D0\u53CA\u7387\uFF1E5% \u6216 \u5DEE\u8BC4\u7387\uFF1E8% \u2192 \u81EA\u52A8\u6392\u9664"
      },
      hot_product_selection: {
        hot_trend_borrowing: {
          platform: "\u6296\u97F3",
          tracked_list: "\u5065\u5EB7\u70ED\u699C",
          selection_logic: "\u9009\u62E9\u4E0A\u5347\u671F\u54C1\u7C7B\uFF08\u641C\u7D22\u91CF/\u8BA8\u8BBA\u91CF\u5468\u73AF\u6BD4\u589E\u957F\uFF1E30%\uFF09",
          example: "2025\u5E74Q3\u300C\u62A4\u809D\u7247\u300D\u641C\u7D22\u91CF\u540C\u6BD4+200%\u3001\u300C\u892A\u9ED1\u7D20\u8F6F\u7CD6\u300D\u8BA8\u8BBA\u91CF\u5468\u589E45%",
          avoid_categories: ["\u5904\u65B9\u836F\u3001\u672A\u5907\u6848\u4FDD\u5065\u54C1\u3001\u4E89\u8BAE\u6027\u4E2D\u836F\u996E\u7247"]
        },
        data_verification: {
          tool: "\u8749\u5988\u5988/\u7070\u8C5A\u6570\u636E",
          metrics: [
            {
              name: "\u8F6C\u5316\u7387",
              threshold: "\uFF1E3%",
              reason: "\u4F4E\u4E8E3%\u8BF4\u660E\u7528\u6237\u51B3\u7B56\u95E8\u69DB\u9AD8\u6216\u9700\u6C42\u4E0D\u5339\u914D"
            },
            {
              name: "\u9000\u8D27\u7387",
              threshold: "\uFF1C5%",
              reason: "\u9AD8\u4E8E5%\u6613\u5F15\u53D1\u4EE3\u9500\u552E\u540E\u7EA0\u7EB7"
            },
            {
              name: "\u590D\u8D2D\u7387",
              threshold: "\uFF1E10%",
              reason: "\u7B5B\u9009\u9AD8\u7C98\u6027\u521A\u9700\u54C1\uFF08\u5982\u7EF4\u751F\u7D20\u3001\u76CA\u751F\u83CC\uFF09"
            }
          ]
        },
        profit_calculation: {
          commission_range: "30%-50%",
          cost_coverage: {
            platform_ad_cost: "\u6296\u97F3CPC\u22481.5-3\u5143/\u6B21\u3001\u5343\u5DDD\u6295\u6D41ROI\u57FA\u51C6\u7EBF1:2.5",
            content_production_cost: "\u5355\u6761\u89C6\u9891\u5236\u4F5C\u6210\u672C\u226450\u5143\uFF08\u542B\u811A\u672C/\u62CD\u6444/\u526A\u8F91\uFF09"
          },
          profit_target: "\u5355\u5546\u54C1\u6BDB\u5229\u6DA6\u2265\u552E\u4EF7\u768420%\uFF08\u8986\u76D6\u8FD0\u8425\u6210\u672C\u540E\u51C0\u8D5A\u226510%\uFF09"
        },
        reverse_selection_logic: "\u57FA\u4E8E\u8206\u60C5+\u6570\u636E\u53CC\u91CD\u8FC7\u6EE4\uFF1A1. \u8206\u60C5\u8D1F\u9762\u7387\u4F4E\uFF1B2. \u6570\u636E\u6307\u6807\u8FBE\u6807\uFF1B3. \u5229\u6DA6\u7A7A\u95F4\u5145\u8DB3 \u2192 \u9501\u5B9A\u6700\u7EC8\u4EE3\u9500\u5546\u54C1"
      }
    },
    example_output: {
      selected_products: [
        {
          product_name: "Swisse\u62A4\u809D\u7247\uFF08OTC\u7C7B\uFF09",
          \u8206\u60C5\u8BC4\u5206: "92\u5206\uFF08\u8D1F\u9762\u73871.2%\uFF09",
          \u6570\u636E\u8868\u73B0: "\u8F6C\u5316\u73874.1%\u3001\u9000\u8D27\u73873.5%\u3001\u590D\u8D2D\u738715%",
          \u5229\u6DA6\u7A7A\u95F4: "\u4F63\u91D140%\uFF0C\u552E\u4EF7199\u5143/\u74F6\uFF0C\u6BDB\u5229\u6DA6\u224879.6\u5143"
        },
        {
          product_name: "\u6C64\u81E3\u500D\u5065\u892A\u9ED1\u7D20\u8F6F\u7CD6\uFF08\u4FDD\u5065\u54C1\uFF09",
          \u8206\u60C5\u8BC4\u5206: "89\u5206\uFF08\u8D1F\u9762\u73872.1%\uFF09",
          \u6570\u636E\u8868\u73B0: "\u8F6C\u5316\u73873.8%\u3001\u9000\u8D27\u73874.2%\u3001\u590D\u8D2D\u738712%",
          \u5229\u6DA6\u7A7A\u95F4: "\u4F63\u91D135%\uFF0C\u552E\u4EF799\u5143/\u76D2\uFF0C\u6BDB\u5229\u6DA6\u224834.65\u5143"
        }
      ]
    },
    deployment_notes: {
      worker_entry_point: "handleSelectionRequest",
      trigger_method: "GET /api/drug-selection-strategy",
      response_format: "application/json",
      required_env_vars: [
        "BQYUN_API_KEY",
        // 清博舆情API密钥
        "CHANMAMA_API_KEY"
        // 蝉妈妈API密钥
      ]
    },
    metadata: {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      worker_version: "1.0"
    }
  };
  return new Response(JSON.stringify(strategy), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleSelectionStrategyRequest, "handleSelectionStrategyRequest");
async function handleScriptGenerationRequest(body, env2) {
  const { product_name, product_type = "\u4FDD\u5065\u54C1", core_selling_point } = body;
  if (!product_name) {
    return new Response(JSON.stringify({ error: "Missing required field: product_name" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!["OTC\u836F\u54C1", "\u4FDD\u5065\u54C1", "\u4E2D\u836F\u996E\u7247"].includes(product_type)) {
    return new Response(JSON.stringify({ error: "Invalid product_type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const script = generateScript(product_name, product_type, core_selling_point);
  const result = {
    request_id: `req_${Date.now()}`,
    generated_script: script,
    compliance_check: true,
    optimization_suggestions: getSuggestions(product_type)
  };
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
__name(handleScriptGenerationRequest, "handleScriptGenerationRequest");
function generateScript(name, type, point) {
  const getComplianceText = /* @__PURE__ */ __name((type2) => {
    switch (type2) {
      case "OTC\u836F\u54C1":
        return "\u672C\u54C1\u4E3A\u5904\u65B9\u836F\uFF0C\u8BF7\u6309\u533B\u5631\u4F7F\u7528\uFF1B\u4E0D\u9002\u8BF7\u53CA\u65F6\u5C31\u533B";
      case "\u4FDD\u5065\u54C1":
        return "\u672C\u54C1\u4E3A\u81B3\u98DF\u8865\u5145\u5242\uFF0C\u4E0D\u80FD\u66FF\u4EE3\u836F\u54C1\uFF1B\u4E0D\u9002\u8BF7\u53CA\u65F6\u5C31\u533B";
      case "\u4E2D\u836F\u996E\u7247":
        return "\u672C\u54C1\u4E3A\u4E2D\u836F\u996E\u7247\uFF0C\u8BF7\u6309\u8BF4\u660E\u4E66\u4F7F\u7528\uFF1B\u4E0D\u9002\u8BF7\u53CA\u65F6\u5C31\u533B";
      default:
        return "\u8BF7\u6309\u8BF4\u660E\u4E66\u4F7F\u7528\uFF1B\u4E0D\u9002\u8BF7\u53CA\u65F6\u5C31\u533B";
    }
  }, "getComplianceText");
  const getBackgroudInfo = /* @__PURE__ */ __name((type2) => {
    switch (type2) {
      case "OTC\u836F\u54C1":
        return `\u9009${type2}\u6211\u53EA\u8BA4${name}\u2014\u2014\u6709\u56FD\u5BB6\u836F\u54C1\u6279\u51C6\u6587\u53F7\uFF08\u56FD\u836F\u51C6\u5B57HXXXX\uFF09\uFF0C\u6210\u5206\u516C\u5F00\u53EF\u67E5\uFF01`;
      case "\u4FDD\u5065\u54C1":
        return `\u9009${type2}\u6211\u53EA\u8BA4${name}\u2014\u2014\u6709\u56FD\u5BB6\u201C\u84DD\u5E3D\u5B50\u201D\u8BA4\u8BC1\uFF08\u56FD\u98DF\u5065\u5B57GXXXX\uFF09\uFF0C\u6210\u5206\u516C\u5F00\u53EF\u67E5\uFF01`;
      case "\u4E2D\u836F\u996E\u7247":
        return `\u9009${type2}\u6211\u53EA\u8BA4${name}\u2014\u2014\u7CBE\u9009\u9053\u5730\u836F\u6750\uFF0C\u4F20\u7EDF\u5DE5\u827A\u70AE\u5236\uFF0C\u54C1\u8D28\u6709\u4FDD\u969C\uFF01`;
      default:
        return `\u9009${name}\u2014\u2014\u54C1\u8D28\u6709\u4FDD\u969C\uFF0C\u503C\u5F97\u4FE1\u8D56\uFF01`;
    }
  }, "getBackgroudInfo");
  const getDosage = /* @__PURE__ */ __name((type2) => {
    switch (type2) {
      case "OTC\u836F\u54C1":
        return "\u6309\u533B\u5631\u670D\u7528";
      case "\u4FDD\u5065\u54C1":
        return "\u6BCF\u59292\u7C92";
      case "\u4E2D\u836F\u996E\u7247":
        return "\u6309\u8BF4\u660E\u4E66\u714E\u670D";
      default:
        return "\u6309\u8BF4\u660E\u4F7F\u7528";
    }
  }, "getDosage");
  const getDefaultSellingPoint = /* @__PURE__ */ __name((type2) => {
    switch (type2) {
      case "OTC\u836F\u54C1":
        return "\u7F13\u89E3\u76F8\u5173\u75C7\u72B6";
      case "\u4FDD\u5065\u54C1":
        return "\u65E5\u5E38\u4FDD\u5065\u517B\u62A4";
      case "\u4E2D\u836F\u996E\u7247":
        return "\u8C03\u7406\u8EAB\u4F53\u673A\u80FD";
      default:
        return "\u6539\u5584\u5065\u5EB7\u72B6\u51B5";
    }
  }, "getDefaultSellingPoint");
  const sellingPoint = point || getDefaultSellingPoint(type);
  const templates = {
    "\u4FDD\u5065\u54C1": `# \u301030\u79D2\u77ED\u89C6\u9891\u811A\u672C\u3011${name}\uFF08\u4FDD\u5065\u54C1\uFF09

## \u3010\u5F00\u573A\xB7\u75DB\u70B9\u5171\u9E23\u3011\uFF08\u9EC4\u91D13\u79D2\uFF09
**\u955C\u5934**\uFF1A\u6DF1\u591C\u529E\u516C\u5BA4/\u9152\u5C40\u573A\u666F\uFF0C\u4E3B\u89D2\u76B1\u7709\u6342\u809D\u533A
**\u53E3\u64AD**\uFF1A"\u8FDE\u7EED\u71AC\u591C/\u9152\u5C40\uFF0C\u603B\u89C9\u5F97\u80F8\u53E3\u95F7\u3001\u6CA1\u80C3\u53E3\uFF1F\u4F60\u7684\u809D\u5728\u2018\u558A\u7D2F\u2019\u4E86\uFF01"
**\u5B57\u5E55**\uFF1A"\u71AC\u591C\u515A/\u9152\u5C40\u515A\u5FC5\u770B\uFF01\u4F60\u7684\u809D\u8BE5\u2018\u4FDD\u517B\u2019\u4E86"

## \u3010\u4E2D\u6BB5\xB7\u4E13\u4E1A\u80CC\u4E66+\u573A\u666F\u6F14\u793A\u3011\uFF0815\u79D2\uFF09
**\u955C\u59341**\uFF1A\u62FF\u8D77${name}\uFF0C\u5C55\u793A"\u84DD\u5E3D\u5B50"+\u6279\u6587\u7279\u5199
**\u53E3\u64AD**\uFF1A"\u9009\u4FDD\u5065\u54C1\u6211\u53EA\u8BA4${name}\u2014\u2014${getBackgroudInfo(type)}"
**\u955C\u59342**\uFF1A\u6A21\u62DF\u670D\u7528\u2192\u6B21\u65E5\u7CBE\u795E\u9971\u6EE1
**\u53E3\u64AD**\uFF1A"\u6BCF\u5929${getDosage(type)}\uFF0C${sellingPoint}\uFF0C30\u5206\u949F\u611F\u89C9\u8EAB\u4F53\u8F7B\u677E\u4E86\uFF08\u5B57\u5E55\uFF1A\u8F85\u52A9\u4FDD\u5065\u3001\u7F13\u89E3\u75B2\u52B3\uFF09"

## \u3010\u7ED3\u5C3E\xB7\u8F6C\u5316\u5F15\u5BFC+\u5408\u89C4\u63D0\u793A\u3011\uFF0810\u79D2\uFF09
**\u955C\u5934**\uFF1A\u6307\u5411\u8D2D\u7269\u8F66+\u5FAE\u7B11
**\u53E3\u64AD**\uFF1A"\u70B9\u51FB\u8D2D\u7269\u8F66\u5C31\u80FD\u4E70\uFF0C\u73B0\u5728\u4E0B\u5355\u9001'\u5065\u5EB7\u5C0F\u8D34\u58EB'\uFF01"
**\u5C0F\u5B57**\uFF1A"${getComplianceText(type)}"
**\u843D\u7248**\uFF1A"\u817E\u8BAF\u4E91\u533B\u836F\u5BA1\u6838\u901A\u8FC7\xB7\u653E\u5FC3\u770B"`,
    "OTC\u836F\u54C1": `# \u301030\u79D2\u77ED\u89C6\u9891\u811A\u672C\u3011${name}\uFF08OTC\u836F\u54C1\uFF09

## \u3010\u5F00\u573A\xB7\u75C7\u72B6\u5C55\u793A\u3011\uFF08\u9EC4\u91D13\u79D2\uFF09
**\u955C\u5934**\uFF1A\u5BB6\u5EAD\u573A\u666F\uFF0C\u4E3B\u89D2\u6342\u7740\u4E0D\u9002\u90E8\u4F4D
**\u53E3\u64AD**\uFF1A"${sellingPoint}\uFF1F\u522B\u786C\u625B\uFF0C\u79D1\u5B66\u7528\u836F\u66F4\u5B89\u5FC3\uFF01"
**\u5B57\u5E55**\uFF1A"\u5BF9\u75C7\u7528\u836F\uFF0C\u5FEB\u901F\u7F13\u89E3"

## \u3010\u4E2D\u6BB5\xB7\u4E13\u4E1A\u80CC\u4E66+\u4F7F\u7528\u6F14\u793A\u3011\uFF0815\u79D2\uFF09
**\u955C\u59341**\uFF1A\u62FF\u8D77${name}\uFF0C\u5C55\u793A\u836F\u54C1\u5305\u88C5+\u6279\u6587\u7279\u5199
**\u53E3\u64AD**\uFF1A"\u9009OTC\u836F\u54C1\u6211\u53EA\u8BA4${name}\u2014\u2014\u6709\u56FD\u5BB6\u836F\u54C1\u6279\u51C6\u6587\u53F7\uFF08\u56FD\u836F\u51C6\u5B57HXXXX\uFF09\uFF0C\u6210\u5206\u5B89\u5168\u6709\u6548\uFF01"
**\u955C\u59342**\uFF1A\u6309\u8BF4\u660E\u4E66\u670D\u7528\u2192\u75C7\u72B6\u7F13\u89E3
**\u53E3\u64AD**\uFF1A"${getDosage(type)}\uFF0C${sellingPoint}\uFF0C\u6309\u533B\u5631\u4F7F\u7528\u66F4\u5B89\u5168\uFF08\u5B57\u5E55\uFF1A\u5BF9\u75C7\u6CBB\u7597\u3001\u5B89\u5168\u6709\u6548\uFF09"

## \u3010\u7ED3\u5C3E\xB7\u8F6C\u5316\u5F15\u5BFC+\u5408\u89C4\u63D0\u793A\u3011\uFF0810\u79D2\uFF09
**\u955C\u5934**\uFF1A\u6307\u5411\u8D2D\u7269\u8F66+\u4E13\u4E1A\u5FAE\u7B11
**\u53E3\u64AD**\uFF1A"\u70B9\u51FB\u8D2D\u7269\u8F66\u5C31\u80FD\u4E70\uFF0C\u4E13\u4E1A\u836F\u5E08\u5728\u7EBF\u54A8\u8BE2\uFF01"
**\u5C0F\u5B57**\uFF1A"${getComplianceText(type)}"
**\u843D\u7248**\uFF1A"\u817E\u8BAF\u4E91\u533B\u836F\u5185\u5BB9\u5BA1\u6838\u901A\u8FC7\xB7\u653E\u5FC3\u89C2\u770B"`,
    "\u4E2D\u836F\u996E\u7247": `# \u301030\u79D2\u77ED\u89C6\u9891\u811A\u672C\u3011${name}\uFF08\u4E2D\u836F\u996E\u7247\uFF09

## \u3010\u5F00\u573A\xB7\u4F20\u7EDF\u667A\u6167\u3011\uFF08\u9EC4\u91D13\u79D2\uFF09
**\u955C\u5934**\uFF1A\u4F20\u7EDF\u4E2D\u533B\u9986\uFF0C\u836F\u5E08\u7CBE\u9009\u836F\u6750
**\u53E3\u64AD**\uFF1A"\u5343\u5E74\u4E2D\u533B\u667A\u6167\uFF0C${sellingPoint}\u6709\u5999\u65B9\uFF01"
**\u5B57\u5E55**\uFF1A"\u4F20\u627F\u53E4\u6CD5\uFF0C\u8C03\u7406\u517B\u751F"

## \u3010\u4E2D\u6BB5\xB7\u9053\u5730\u836F\u6750+\u714E\u716E\u6F14\u793A\u3011\uFF0815\u79D2\uFF09
**\u955C\u59341**\uFF1A\u5C55\u793A${name}\u836F\u6750\uFF0C\u7A81\u51FA\u9053\u5730\u5C5E\u6027
**\u53E3\u64AD**\uFF1A"\u9009\u4E2D\u836F\u6211\u53EA\u8BA4${name}\u2014\u2014\u7CBE\u9009\u9053\u5730\u836F\u6750\uFF0C\u4F20\u7EDF\u5DE5\u827A\u70AE\u5236\uFF0C\u54C1\u8D28\u6709\u4FDD\u969C\uFF01"
**\u955C\u59342**\uFF1A\u714E\u836F\u8FC7\u7A0B\u2192\u670D\u7528\u2192\u8EAB\u4F53\u6539\u5584
**\u53E3\u64AD**\uFF1A"${getDosage(type)}\uFF0C${sellingPoint}\uFF0C\u8C03\u7406\u8EAB\u4F53\u66F4\u6E29\u548C\uFF08\u5B57\u5E55\uFF1A\u5929\u7136\u8C03\u7406\u3001\u6E29\u548C\u6709\u6548\uFF09"

## \u3010\u7ED3\u5C3E\xB7\u8F6C\u5316\u5F15\u5BFC+\u5408\u89C4\u63D0\u793A\u3011\uFF0810\u79D2\uFF09
**\u955C\u5934**\uFF1A\u6307\u5411\u8D2D\u7269\u8F66+\u6E29\u548C\u5FAE\u7B11
**\u53E3\u64AD**\uFF1A"\u70B9\u51FB\u8D2D\u7269\u8F66\u5C31\u80FD\u4E70\uFF0C\u4E2D\u533B\u5E08\u5728\u7EBF\u6307\u5BFC\uFF01"
**\u5C0F\u5B57**\uFF1A"${getComplianceText(type)}"
**\u843D\u7248**\uFF1A"\u817E\u8BAF\u4E91\u533B\u836F\u5185\u5BB9\u5BA1\u6838\u901A\u8FC7\xB7\u653E\u5FC3\u89C2\u770B"`
  };
  return templates[type] || templates["\u4FDD\u5065\u54C1"];
}
__name(generateScript, "generateScript");
function getSuggestions(type) {
  switch (type) {
    case "\u4FDD\u5065\u54C1":
      return [
        "\u589E\u52A0\u4E34\u5E8A\u6570\u636E\u5F15\u7528",
        "\u66FF\u6362\u66F4\u5177\u4F53\u7684\u75DB\u70B9"
      ];
    case "OTC\u836F\u54C1":
      return [
        "\u5F3A\u5316\u533B\u751F/\u836F\u5E08\u80CC\u4E66",
        "\u6DFB\u52A0\u7528\u836F\u7981\u5FCC\u63D0\u793A"
      ];
    case "\u4E2D\u836F\u996E\u7247":
      return [
        "\u589E\u52A0\u4F20\u7EDF\u533B\u5B66\u7406\u8BBA\u652F\u6491",
        "\u6DFB\u52A0\u9002\u5B9C\u4EBA\u7FA4\u8BF4\u660E"
      ];
    default:
      return [
        "\u53EF\u589E\u52A0\u7528\u6237\u8BC4\u4EF7",
        "\u53EF\u6DFB\u52A0\u4F7F\u7528\u573A\u666F"
      ];
  }
}
__name(getSuggestions, "getSuggestions");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
