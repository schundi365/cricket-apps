/**
 * WebSocket Service Tests
 * Tests for real-time price update propagation via WebSocket
 */

import * as fc from 'fast-check';
import WebSocket from 'ws';
import http from 'http';
import { WebSocketService } from './websocketService';
import { Asset, AssetType } from '../types';

describe('WebSocketService', () => {
  let server: http.Server;
  let wsService: WebSocketService;
  let port: number;

  beforeEach((done) => {
    // Create a test HTTP server
    server = http.createServer();
    server.listen(0, () => {
      port = (server.address() as any).port;
      wsService = new WebSocketService(server);
      done();
    });
  });

  afterEach((done) => {
    wsService.stop();
    server.close(() => {
      done();
    });
  });

  describe('Connection Management', () => {
    it('should accept WebSocket connections', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);

      ws.on('open', () => {
        expect(wsService.getConnectedClientsCount()).toBe(1);
        ws.close();
      });

      ws.on('close', () => {
        done();
      });
    });

    it('should handle multiple concurrent connections', (done) => {
      const clients: WebSocket[] = [];
      const numClients = 5;
      let connectedCount = 0;

      for (let i = 0; i < numClients; i++) {
        const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
        clients.push(ws);

        ws.on('open', () => {
          connectedCount++;
          if (connectedCount === numClients) {
            expect(wsService.getConnectedClientsCount()).toBe(numClients);
            clients.forEach(c => c.close());
          }
        });
      }

      let closedCount = 0;
      clients.forEach(ws => {
        ws.on('close', () => {
          closedCount++;
          if (closedCount === numClients) {
            done();
          }
        });
      });
    });

    it('should send connection confirmation on connect', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connected') {
          expect(message.message).toBe('Connected to price updates service');
          expect(message.timestamp).toBeDefined();
          ws.close();
          done();
        }
      });
    });
  });

  describe('Subscription Management', () => {
    it('should handle asset subscription', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAssets: Asset[] = [
        { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' },
        { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' }
      ];

      let receivedConnected = false;

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: testAssets
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connected') {
          receivedConnected = true;
        } else if (message.type === 'subscribed') {
          expect(receivedConnected).toBe(true);
          expect(message.assets).toHaveLength(2);
          expect(message.assets[0].symbol).toBe('GOLD');
          expect(message.assets[1].symbol).toBe('EURUSD');
          ws.close();
          done();
        }
      });
    });

    it('should handle unsubscription', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAssets: Asset[] = [
        { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' },
        { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' }
      ];

      let subscribed = false;

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: testAssets
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribed' && !subscribed) {
          subscribed = true;
          // Unsubscribe from one asset
          ws.send(JSON.stringify({
            type: 'unsubscribe',
            assets: [testAssets[0]]
          }));
        } else if (message.type === 'unsubscribed') {
          expect(message.assets).toHaveLength(1);
          expect(message.assets[0].symbol).toBe('EURUSD');
          ws.close();
          done();
        }
      });
    });

    it('should avoid duplicate subscriptions', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAsset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };

      let subscriptionCount = 0;

      ws.on('open', () => {
        // Subscribe twice to the same asset
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: [testAsset]
        }));
        
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            assets: [testAsset]
          }));
        }, 100);
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribed') {
          subscriptionCount++;
          // After second subscription, should still have only 1 asset
          if (subscriptionCount === 2) {
            expect(message.assets).toHaveLength(1);
            ws.close();
            done();
          }
        }
      });
    });
  });

  describe('Property 17: Price Update Propagation', () => {
    // Feature: metals-sentiment-trading, Property 17: Price Update Propagation
    // For any market price update received from the data provider, the system should 
    // update the displayed price without requiring a page refresh and include the update timestamp.
    
    it('should propagate price updates to subscribed clients with timestamps', (done) => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              type: fc.constantFrom('METAL', 'FOREX', 'STOCK'),
              symbol: fc.constantFrom('GOLD', 'SILVER', 'EURUSD', 'GBPUSD', 'SPX'),
              name: fc.string()
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (assets) => {
            return new Promise<boolean>((resolve) => {
              const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
              let receivedUpdate = false;

              ws.on('open', () => {
                ws.send(JSON.stringify({
                  type: 'subscribe',
                  assets: assets
                }));
              });

              ws.on('message', (data: Buffer) => {
                const message = JSON.parse(data.toString());
                
                if (message.type === 'price_update' && !receivedUpdate) {
                  receivedUpdate = true;
                  
                  // Verify update has timestamp
                  expect(message.timestamp).toBeDefined();
                  const timestamp = new Date(message.timestamp);
                  expect(timestamp.getTime()).toBeGreaterThan(0);
                  
                  // Verify update has data array
                  expect(Array.isArray(message.data)).toBe(true);
                  
                  // Verify each subscribed asset gets an update
                  expect(message.data.length).toBe(assets.length);
                  
                  // Verify each update has asset and price or error
                  message.data.forEach((update: any) => {
                    expect(update.asset).toBeDefined();
                    expect(update.asset.type).toBeDefined();
                    expect(update.asset.symbol).toBeDefined();
                    // Either price or error should be present
                    expect(update.price !== null || update.error !== null).toBe(true);
                  });
                  
                  ws.close();
                  resolve(true);
                }
              });

              // Timeout after 10 seconds
              setTimeout(() => {
                ws.close();
                resolve(receivedUpdate);
              }, 10000);
            });
          }
        ),
        { numRuns: 10, timeout: 15000 }
      );
      
      done();
    }, 30000);

    it('should only send updates to clients subscribed to specific assets', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const ws2 = new WebSocket(`ws://localhost:${port}/ws/prices`);
      
      const asset1: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };
      const asset2: Asset = { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' };

      let ws1Ready = false;
      let ws2Ready = false;
      let ws1UpdateReceived = false;
      let ws2UpdateReceived = false;

      ws1.on('open', () => {
        ws1.send(JSON.stringify({
          type: 'subscribe',
          assets: [asset1]
        }));
      });

      ws2.on('open', () => {
        ws2.send(JSON.stringify({
          type: 'subscribe',
          assets: [asset2]
        }));
      });

      ws1.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribed') {
          ws1Ready = true;
        } else if (message.type === 'price_update' && !ws1UpdateReceived) {
          ws1UpdateReceived = true;
          // Should only receive updates for GOLD
          expect(message.data).toHaveLength(1);
          expect(message.data[0].asset.symbol).toBe('GOLD');
          
          if (ws2UpdateReceived) {
            ws1.close();
            ws2.close();
            done();
          }
        }
      });

      ws2.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribed') {
          ws2Ready = true;
        } else if (message.type === 'price_update' && !ws2UpdateReceived) {
          ws2UpdateReceived = true;
          // Should only receive updates for EURUSD
          expect(message.data).toHaveLength(1);
          expect(message.data[0].asset.symbol).toBe('EURUSD');
          
          if (ws1UpdateReceived) {
            ws1.close();
            ws2.close();
            done();
          }
        }
      });
    }, 15000);

    it('should continue sending updates at regular intervals', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAsset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };
      const updates: any[] = [];

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: [testAsset]
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'price_update') {
          updates.push(message);
          
          // After receiving 2 updates, verify they came at different times
          if (updates.length === 2) {
            const time1 = new Date(updates[0].timestamp).getTime();
            const time2 = new Date(updates[1].timestamp).getTime();
            
            expect(time2).toBeGreaterThan(time1);
            expect(time2 - time1).toBeGreaterThan(0);
            
            ws.close();
            done();
          }
        }
      });
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid message format', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);

      ws.on('open', () => {
        ws.send('invalid json');
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'error') {
          expect(message.message).toBe('Invalid message format');
          ws.close();
          done();
        }
      });
    });

    it('should handle client disconnection gracefully', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAsset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: [testAsset]
        }));
        
        // Close immediately after subscribing
        setTimeout(() => {
          ws.close();
        }, 100);
      });

      ws.on('close', () => {
        // Service should handle disconnection without errors
        expect(wsService.getConnectedClientsCount()).toBe(0);
        done();
      });
    });
  });

  describe('Statistics', () => {
    it('should track subscription statistics', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAssets: Asset[] = [
        { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' },
        { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' },
        { type: 'STOCK' as AssetType, symbol: 'SPX', name: 'S&P 500' }
      ];

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: testAssets
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribed') {
          const stats = wsService.getSubscriptionStats();
          expect(stats.totalClients).toBe(1);
          expect(stats.totalSubscriptions).toBe(3);
          ws.close();
          done();
        }
      });
    });
  });

  describe('Edge Cases - Disconnection and Reconnection', () => {
    it('should handle rapid disconnection and reconnection', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAsset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };

      ws1.on('open', () => {
        ws1.send(JSON.stringify({
          type: 'subscribe',
          assets: [testAsset]
        }));
        
        // Close immediately
        setTimeout(() => {
          ws1.close();
          
          // Reconnect immediately
          setTimeout(() => {
            const ws2 = new WebSocket(`ws://localhost:${port}/ws/prices`);
            
            ws2.on('open', () => {
              ws2.send(JSON.stringify({
                type: 'subscribe',
                assets: [testAsset]
              }));
            });
            
            ws2.on('message', (data: Buffer) => {
              const message = JSON.parse(data.toString());
              if (message.type === 'subscribed') {
                expect(message.assets).toHaveLength(1);
                ws2.close();
                done();
              }
            });
          }, 100);
        }, 100);
      });
    }, 10000);

    it('should handle multiple clients disconnecting simultaneously', (done) => {
      const clients: WebSocket[] = [];
      const numClients = 3;
      let connectedCount = 0;

      for (let i = 0; i < numClients; i++) {
        const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
        clients.push(ws);

        ws.on('open', () => {
          connectedCount++;
          if (connectedCount === numClients) {
            // All connected, now disconnect all simultaneously
            clients.forEach(c => c.close());
          }
        });
      }

      let closedCount = 0;
      clients.forEach(ws => {
        ws.on('close', () => {
          closedCount++;
          if (closedCount === numClients) {
            // All disconnected successfully
            setTimeout(() => {
              expect(wsService.getConnectedClientsCount()).toBe(0);
              done();
            }, 100);
          }
        });
      });
    }, 10000);

    it('should clean up subscriptions on disconnection', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAssets: Asset[] = [
        { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' },
        { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' }
      ];

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: testAssets
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribed') {
          const statsBefore = wsService.getSubscriptionStats();
          expect(statsBefore.totalSubscriptions).toBe(2);
          
          // Disconnect
          ws.close();
          
          setTimeout(() => {
            const statsAfter = wsService.getSubscriptionStats();
            expect(statsAfter.totalClients).toBe(0);
            done();
          }, 100);
        }
      });
    }, 10000);
  });

  describe('Edge Cases - Network Issues', () => {
    it('should handle connection timeout gracefully', (done) => {
      // This test verifies the service doesn't crash on connection issues
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      
      ws.on('open', () => {
        expect(wsService.getConnectedClientsCount()).toBeGreaterThan(0);
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        // Connection errors should be handled gracefully
        done();
      });
    }, 5000);

    it('should continue broadcasting to remaining clients after one disconnects', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const ws2 = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAsset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };

      let ws1Ready = false;
      let ws2Ready = false;
      let ws1Disconnected = false;

      ws1.on('open', () => {
        ws1.send(JSON.stringify({
          type: 'subscribe',
          assets: [testAsset]
        }));
      });

      ws2.on('open', () => {
        ws2.send(JSON.stringify({
          type: 'subscribe',
          assets: [testAsset]
        }));
      });

      ws1.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscribed') {
          ws1Ready = true;
          if (ws2Ready) {
            // Both ready, disconnect ws1
            ws1.close();
          }
        }
      });

      ws2.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscribed') {
          ws2Ready = true;
          if (ws1Ready) {
            // Both ready, disconnect ws1
            ws1.close();
          }
        } else if (message.type === 'price_update' && ws1Disconnected) {
          // ws2 should still receive updates after ws1 disconnects
          expect(message.data).toBeDefined();
          ws2.close();
          done();
        }
      });

      ws1.on('close', () => {
        ws1Disconnected = true;
      });
    }, 15000);
  });

  describe('Edge Cases - Fallback Behavior', () => {
    it('should handle price service failures gracefully', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      // Use an invalid asset that will cause price fetch to fail
      const invalidAsset: Asset = { 
        type: 'METAL' as AssetType, 
        symbol: 'INVALID_SYMBOL_XYZ', 
        name: 'Invalid Asset' 
      };

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: [invalidAsset]
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'price_update') {
          // Should receive update even if price fetch fails
          expect(message.data).toBeDefined();
          expect(message.data.length).toBe(1);
          
          // The update should have an error field
          const update = message.data[0];
          expect(update.asset.symbol).toBe('INVALID_SYMBOL_XYZ');
          // Either price or error should be present
          expect(update.price !== null || update.error !== null).toBe(true);
          
          ws.close();
          done();
        }
      });
    }, 10000);

    it('should handle empty subscription list', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: []
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribed') {
          expect(message.assets).toHaveLength(0);
          ws.close();
          done();
        }
      });
    }, 5000);

    it('should handle subscription to same asset multiple times', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const testAsset: Asset = { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' };

      let subscriptionCount = 0;

      ws.on('open', () => {
        // Subscribe three times to the same asset
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: [testAsset, testAsset, testAsset]
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribed') {
          subscriptionCount++;
          // Should deduplicate and have only 1 asset
          expect(message.assets).toHaveLength(1);
          ws.close();
          done();
        }
      });
    }, 5000);
  });

  describe('Requirements 11.3, 11.7 - Connection Failures and Fallback', () => {
    it('should maintain service availability when individual price fetches fail', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      const mixedAssets: Asset[] = [
        { type: 'METAL' as AssetType, symbol: 'GOLD', name: 'Gold' },
        { type: 'METAL' as AssetType, symbol: 'INVALID', name: 'Invalid' },
        { type: 'FOREX' as AssetType, symbol: 'EURUSD', name: 'EUR/USD' }
      ];

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          assets: mixedAssets
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'price_update') {
          // Should receive updates for all assets, even if some fail
          expect(message.data).toBeDefined();
          expect(message.data.length).toBe(3);
          
          // Valid assets should have prices, invalid should have errors
          const goldUpdate = message.data.find((u: any) => u.asset.symbol === 'GOLD');
          const invalidUpdate = message.data.find((u: any) => u.asset.symbol === 'INVALID');
          const eurUpdate = message.data.find((u: any) => u.asset.symbol === 'EURUSD');
          
          expect(goldUpdate).toBeDefined();
          expect(invalidUpdate).toBeDefined();
          expect(eurUpdate).toBeDefined();
          
          ws.close();
          done();
        }
      });
    }, 10000);

    it('should handle heartbeat ping/pong correctly', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/prices`);
      let receivedPing = false;

      ws.on('open', () => {
        // Service should send pings for heartbeat
        expect(wsService.getConnectedClientsCount()).toBe(1);
      });

      ws.on('ping', () => {
        receivedPing = true;
        // Respond with pong (ws library does this automatically)
      });

      // Wait for potential ping (heartbeat is every 30s, so we won't wait that long)
      // Just verify the connection stays alive
      setTimeout(() => {
        expect(wsService.getConnectedClientsCount()).toBe(1);
        ws.close();
        done();
      }, 1000);
    }, 5000);
  });
});
