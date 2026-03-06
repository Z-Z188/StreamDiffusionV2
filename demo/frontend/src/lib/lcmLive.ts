
import { get, writable } from 'svelte/store';


export enum LCMLiveStatus {
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    PAUSED = "paused",
    WAIT = "wait",
    SEND_FRAME = "send_frame",
    TIMEOUT = "timeout",
}

const initStatus: LCMLiveStatus = LCMLiveStatus.DISCONNECTED;

export const lcmLiveStatus = writable<LCMLiveStatus>(initStatus);
export const streamId = writable<string | null>(null);

let websocket: WebSocket | null = null;
let userId: string | null = null;

import { browser } from '$app/environment';


// 计算 basePath，本地是 ""，KML 上是 "/proxy/7860"
function getBasePath() {
    if (!browser) return '';
    return window.location.pathname.replace(/\/$/, '');
  }
  
export const lcmLiveActions = {
    async start(getSreamdata: () => any[]) {
      return new Promise<{ status: string; userId: string | null }>((resolve, reject) => {
        try {
          // 已经有连接就复用
          if (websocket && websocket.readyState === WebSocket.OPEN) {
            lcmLiveStatus.set(LCMLiveStatus.CONNECTED);
            streamId.set(userId);
            websocket.send(JSON.stringify({ status: 'resume', timestamp: Date.now() }));
            resolve({ status: 'connected', userId });
            return;
          }
  
          userId = crypto.randomUUID();
          const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
          const basePath = getBasePath();
          const wsUrl = `${protocol}//${location.host}${basePath}/api/ws/${userId}`;
  
          console.log('WS URL:', wsUrl);
          websocket = new WebSocket(wsUrl);
          websocket.binaryType = 'blob'; // 你现在收到的是 Blob，就这样设没问题
  
          websocket.onopen = () => {
            console.log('Connected to websocket');
          };
  
          websocket.onclose = (event) => {
            console.log('Disconnected from websocket', event.code, event.reason);
            lcmLiveStatus.set(LCMLiveStatus.DISCONNECTED);
            streamId.set(null);
          };
  
          websocket.onerror = (event) => {
            console.error('Websocket error:', event);
          };
  
          websocket.onmessage = async (event: MessageEvent) => {
            try {
              let text: string;
  
              if (typeof event.data === 'string') {
                text = event.data;
              } else if (event.data instanceof Blob) {
                text = await event.data.text();
              } else if (event.data instanceof ArrayBuffer) {
                text = new TextDecoder('utf-8').decode(event.data);
              } else {
                console.warn('Unknown websocket message type:', event.data);
                return;
              }
  
              const trimmed = text.trim();
              if (!trimmed) {
                // 心跳 / 空消息
                return;
              }
              if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
                console.debug('Ignore non-JSON WS message:', JSON.stringify(trimmed));
                return;
              }
  
              const data = JSON.parse(trimmed);
  
              switch (data.status) {
                case 'connected':
                  lcmLiveStatus.set(LCMLiveStatus.CONNECTED);
                  streamId.set(userId);
                  resolve({ status: 'connected', userId });
                  break;
  
                case 'send_frame':
                  if (get(lcmLiveStatus) === LCMLiveStatus.PAUSED) break;
                  lcmLiveStatus.set(LCMLiveStatus.SEND_FRAME);
  
                  const streamData = getSreamdata();
                  // 请求下一帧
                  websocket?.send(
                    JSON.stringify({
                      status: 'next_frame',
                      timestamp: Date.now()
                    })
                  );
                  // 把参数 + 图像帧发给后端
                  for (const d of streamData) {
                    if (d instanceof Blob) {
                      websocket?.send(d);
                    } else {
                      websocket?.send(JSON.stringify(d));
                    }
                  }
                  break;
  
                case 'wait':
                  if (get(lcmLiveStatus) === LCMLiveStatus.PAUSED) break;
                  lcmLiveStatus.set(LCMLiveStatus.WAIT);
                  break;
  
                case 'timeout':
                  console.log('timeout');
                  lcmLiveStatus.set(LCMLiveStatus.TIMEOUT);
                  streamId.set(null);
                  reject(new Error('timeout'));
                  break;
  
                case 'error':
                  console.log(data.message);
                  lcmLiveStatus.set(LCMLiveStatus.DISCONNECTED);
                  streamId.set(null);
                  reject(new Error(data.message));
                  break;
              }
            } catch (err) {
              console.error('Failed to handle websocket message:', err, event.data);
            }
          };
        } catch (e) {
          console.error('Failed to start lcm live:', e);
          reject(e instanceof Error ? e : new Error('Unknown error'));
        }
      });
    },
    send(data: Blob | { [key: string]: any }) {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            if (data instanceof Blob) {
                websocket.send(data);
            } else {
                websocket.send(JSON.stringify(data));
            }
        } else {
            console.log("WebSocket not connected");
        }
    },
    async stop() {
        lcmLiveStatus.set(LCMLiveStatus.DISCONNECTED);
        if (websocket) {
            websocket.close();
        }
        websocket = null;
        streamId.set(null);
    },
    async pause() {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ status: "pause", timestamp: Date.now() }));
        }
        lcmLiveStatus.set(LCMLiveStatus.PAUSED);
        streamId.set(null);
    },
};
