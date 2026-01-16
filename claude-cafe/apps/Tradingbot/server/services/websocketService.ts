import WebSocket from 'ws';
import { Asset, AssetPrice } from '../types';
import { PriceService } from './priceService';

interface SubscriptionMessage {
  type: 'subscribe' | 'unsubscribe';
  assets: Asset[];
}

interface ClientConnection extends WebSocket {
  subscribedAssets?: Asset[];
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocket.Server;
  private priceService: PriceService;
  private broadcastInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: any) {
    this.wss = new WebSocket.Server({ server, path: '/ws/prices' });
    this.priceService = new PriceService();
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: ClientConnection) => {
      console.log('WebSocket client connected');
      ws.isAlive = true;
      ws.subscribedAssets = [];

      // Handle pong responses for heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message: string) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send initial connection confirmation
      this.sendMessage(ws, {
        type: 'connected',
        message: 'Connected to price updates service',
        timestamp: new Date().toISOString()
      });
    });

    // Start broadcasting price updates
    this.startBroadcasting();
    
    // Start heartbeat to detect dead connections
    this.startHeartbeat();
  }

  private handleMessage(ws: ClientConnection, message: string): void {
    try {
      const data: SubscriptionMessage = JSON.parse(message);

      if (data.type === 'subscribe') {
        this.handleSubscription(ws, data.assets);
      } else if (data.type === 'unsubscribe') {
        this.handleUnsubscription(ws, data.assets);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendMessage(ws, {
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleSubscription(ws: ClientConnection, assets: Asset[]): void {
    if (!ws.subscribedAssets) {
      ws.subscribedAssets = [];
    }

    // Add new assets to subscription list (avoid duplicates)
    for (const asset of assets) {
      const exists = ws.subscribedAssets.some(
        (a) => a.type === asset.type && a.symbol === asset.symbol
      );
      if (!exists) {
        ws.subscribedAssets.push(asset);
      }
    }

    console.log(`Client subscribed to ${ws.subscribedAssets.length} assets`);

    this.sendMessage(ws, {
      type: 'subscribed',
      assets: ws.subscribedAssets,
      timestamp: new Date().toISOString()
    });

    // Send immediate price update for subscribed assets
    this.sendPriceUpdate(ws);
  }

  private handleUnsubscription(ws: ClientConnection, assets: Asset[]): void {
    if (!ws.subscribedAssets) {
      return;
    }

    // Remove assets from subscription list
    ws.subscribedAssets = ws.subscribedAssets.filter(
      (subscribed) =>
        !assets.some(
          (asset) =>
            asset.type === subscribed.type && asset.symbol === subscribed.symbol
        )
    );

    console.log(`Client unsubscribed, now tracking ${ws.subscribedAssets.length} assets`);

    this.sendMessage(ws, {
      type: 'unsubscribed',
      assets: ws.subscribedAssets,
      timestamp: new Date().toISOString()
    });
  }

  private handleDisconnection(ws: ClientConnection): void {
    if (ws.subscribedAssets) {
      ws.subscribedAssets = [];
    }
  }

  private async sendPriceUpdate(ws: ClientConnection): Promise<void> {
    if (!ws.subscribedAssets || ws.subscribedAssets.length === 0) {
      return;
    }

    try {
      const priceUpdates = await Promise.all(
        ws.subscribedAssets.map(async (asset) => {
          try {
            const price = await this.priceService.getCurrentPrice(asset);
            return { asset, price, error: null };
          } catch (error: any) {
            console.error(`Failed to fetch price for ${asset.symbol}:`, error.message);
            return { asset, price: null, error: error.message };
          }
        })
      );

      this.sendMessage(ws, {
        type: 'price_update',
        data: priceUpdates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending price update:', error);
    }
  }

  private sendMessage(ws: ClientConnection, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private startBroadcasting(): void {
    // Broadcast price updates every 5 seconds
    this.broadcastInterval = setInterval(() => {
      this.broadcastPriceUpdates();
    }, 5000);
  }

  private async broadcastPriceUpdates(): Promise<void> {
    const clients = Array.from(this.wss.clients) as ClientConnection[];

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        await this.sendPriceUpdate(client);
      }
    }
  }

  private startHeartbeat(): void {
    // Check connection health every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      const clients = Array.from(this.wss.clients) as ClientConnection[];

      clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('Terminating dead connection');
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  public getConnectedClientsCount(): number {
    return this.wss.clients.size;
  }

  public getSubscriptionStats(): { totalClients: number; totalSubscriptions: number } {
    const clients = Array.from(this.wss.clients) as ClientConnection[];
    const totalSubscriptions = clients.reduce(
      (sum, client) => sum + (client.subscribedAssets?.length || 0),
      0
    );

    return {
      totalClients: clients.length,
      totalSubscriptions
    };
  }

  public stop(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.wss.close();
  }
}
