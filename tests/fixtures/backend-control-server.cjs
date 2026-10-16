const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { fork } = require("node:child_process");
const { createBackendControlHandler, startRestartWorker } = require("../../src/backend-control");

// This disposable fixture has no CLI, user data, notifications or production listener.
const projectRoot = process.argv[2];
const requestedPort = Number(process.argv[3] || 0);
let handler;
const server = http.createServer((request, response) => {
  handler(request, response, new URL(request.url, "http://test").pathname).then(handled => {
    if (!handled) { response.writeHead(404); response.end(); }
  });
});
server.listen(requestedPort, "127.0.0.1", () => {
  const port = server.address().port;
  handler = createBackendControlHandler({
    projectRoot, port, codexExe: process.execPath,
    launchRestart(options) {
      // Track the real detached worker so a failed test cannot leave it behind.
      return startRestartWorker({ ...options, spawnWorker(file, args, settings) {
        const child = fork(file, args, settings);
        fs.writeFileSync(path.join(projectRoot, "worker.pid"), String(child.pid));
        return child;
      } });
    },
    shutdown() {
      // Match production acknowledgment ordering but terminate only this test-owned process.
      setTimeout(() => {
        server.close();
        setTimeout(() => process.exit(0), 100);
      }, 50);
    }
  });
  // The replacement fixture records its PID for bounded cleanup if a test fails.
  fs.writeFileSync(path.join(projectRoot, "fixture.pid"), String(process.pid));
  console.log(JSON.stringify({ port, pid: process.pid }));
});
