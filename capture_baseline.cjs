const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');

async function main() {
  const versionRes = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const wsUrl = versionRes.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.on('message', data => {
    const msg = JSON.parse(data.toString());
    if (msg.id && callbacks.has(msg.id)) {
      const { resolve, reject } = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  await new Promise(r => ws.on('open', r));
  console.log('Connected to Chrome CDP');

  // Create target page
  const target = await send('Target.createTarget', { url: 'http://localhost:3000' });
  const pageWsUrl = `ws://127.0.0.1:9222/devtools/page/${target.targetId}`;
  const pageWs = new WebSocket(pageWsUrl);

  let pageId = 1;
  const pageCallbacks = new Map();
  function pageSend(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = pageId++;
      pageCallbacks.set(id, { resolve, reject });
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  pageWs.on('message', data => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pageCallbacks.has(msg.id)) {
      const { resolve, reject } = pageCallbacks.get(msg.id);
      pageCallbacks.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  await new Promise(r => pageWs.on('open', r));

  await pageSend('Page.enable');
  await pageSend('Runtime.enable');
  await pageSend('Emulation.setDeviceMetricsOverride', {
    width: 960,
    height: 540,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:3000');
  await pageSend('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 2000));

  // Take title screenshot
  const titleShot = await pageSend('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/before_title.png', Buffer.from(titleShot.data, 'base64'));
  console.log('Saved screenshots/before_title.png');

  // Start game by invoking scene transition
  await pageSend('Runtime.evaluate', {
    expression: `
      if (window.__STORMHAMMER_GAME__) {
        window.__STORMHAMMER_GAME__.scene.stop('TitleScene');
        window.__STORMHAMMER_GAME__.scene.start('GameScene', { realm: 1 });
      }
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  const realm1Shot = await pageSend('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/before_realm1.png', Buffer.from(realm1Shot.data, 'base64'));
  console.log('Saved screenshots/before_realm1.png');

  // Realm 2
  await pageSend('Runtime.evaluate', {
    expression: `
      if (window.__STORMHAMMER_GAME__) {
        window.__STORMHAMMER_GAME__.scene.stop('GameScene');
        window.__STORMHAMMER_GAME__.scene.start('GameScene', { realm: 2 });
      }
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const realm2Shot = await pageSend('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/before_realm2.png', Buffer.from(realm2Shot.data, 'base64'));
  console.log('Saved screenshots/before_realm2.png');

  // Realm 3
  await pageSend('Runtime.evaluate', {
    expression: `
      if (window.__STORMHAMMER_GAME__) {
        window.__STORMHAMMER_GAME__.scene.stop('GameScene');
        window.__STORMHAMMER_GAME__.scene.start('GameScene', { realm: 3 });
      }
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const realm3Shot = await pageSend('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/before_realm3.png', Buffer.from(realm3Shot.data, 'base64'));
  console.log('Saved screenshots/before_realm3.png');

  // Close target
  await send('Target.closeTarget', { targetId: target.targetId });
  pageWs.close();
  ws.close();
  console.log('Before baseline capture complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
