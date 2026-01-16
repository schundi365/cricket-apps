"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
var ws_1 = __importDefault(require("ws"));
var priceService_1 = require("./priceService");
var WebSocketService = /** @class */ (function () {
    function WebSocketService(server) {
        this.broadcastInterval = null;
        this.heartbeatInterval = null;
        this.wss = new ws_1.default.Server({ server: server, path: '/ws/prices' });
        this.priceService = new priceService_1.PriceService();
        this.setupWebSocketServer();
    }
    WebSocketService.prototype.setupWebSocketServer = function () {
        var _this = this;
        this.wss.on('connection', function (ws) {
            console.log('WebSocket client connected');
            ws.isAlive = true;
            ws.subscribedAssets = [];
            // Handle pong responses for heartbeat
            ws.on('pong', function () {
                ws.isAlive = true;
            });
            ws.on('message', function (message) {
                _this.handleMessage(ws, message);
            });
            ws.on('close', function () {
                console.log('WebSocket client disconnected');
                _this.handleDisconnection(ws);
            });
            ws.on('error', function (error) {
                console.error('WebSocket error:', error);
            });
            // Send initial connection confirmation
            _this.sendMessage(ws, {
                type: 'connected',
                message: 'Connected to price updates service',
                timestamp: new Date().toISOString()
            });
        });
        // Start broadcasting price updates
        this.startBroadcasting();
        // Start heartbeat to detect dead connections
        this.startHeartbeat();
    };
    WebSocketService.prototype.handleMessage = function (ws, message) {
        try {
            var data = JSON.parse(message);
            if (data.type === 'subscribe') {
                this.handleSubscription(ws, data.assets);
            }
            else if (data.type === 'unsubscribe') {
                this.handleUnsubscription(ws, data.assets);
            }
        }
        catch (error) {
            console.error('Error handling WebSocket message:', error);
            this.sendMessage(ws, {
                type: 'error',
                message: 'Invalid message format',
                timestamp: new Date().toISOString()
            });
        }
    };
    WebSocketService.prototype.handleSubscription = function (ws, assets) {
        if (!ws.subscribedAssets) {
            ws.subscribedAssets = [];
        }
        var _loop_1 = function (asset) {
            var exists = ws.subscribedAssets.some(function (a) { return a.type === asset.type && a.symbol === asset.symbol; });
            if (!exists) {
                ws.subscribedAssets.push(asset);
            }
        };
        // Add new assets to subscription list (avoid duplicates)
        for (var _i = 0, assets_1 = assets; _i < assets_1.length; _i++) {
            var asset = assets_1[_i];
            _loop_1(asset);
        }
        console.log("Client subscribed to ".concat(ws.subscribedAssets.length, " assets"));
        this.sendMessage(ws, {
            type: 'subscribed',
            assets: ws.subscribedAssets,
            timestamp: new Date().toISOString()
        });
        // Send immediate price update for subscribed assets
        this.sendPriceUpdate(ws);
    };
    WebSocketService.prototype.handleUnsubscription = function (ws, assets) {
        if (!ws.subscribedAssets) {
            return;
        }
        // Remove assets from subscription list
        ws.subscribedAssets = ws.subscribedAssets.filter(function (subscribed) {
            return !assets.some(function (asset) {
                return asset.type === subscribed.type && asset.symbol === subscribed.symbol;
            });
        });
        console.log("Client unsubscribed, now tracking ".concat(ws.subscribedAssets.length, " assets"));
        this.sendMessage(ws, {
            type: 'unsubscribed',
            assets: ws.subscribedAssets,
            timestamp: new Date().toISOString()
        });
    };
    WebSocketService.prototype.handleDisconnection = function (ws) {
        if (ws.subscribedAssets) {
            ws.subscribedAssets = [];
        }
    };
    WebSocketService.prototype.sendPriceUpdate = function (ws) {
        return __awaiter(this, void 0, void 0, function () {
            var priceUpdates, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ws.subscribedAssets || ws.subscribedAssets.length === 0) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.all(ws.subscribedAssets.map(function (asset) { return __awaiter(_this, void 0, void 0, function () {
                                var price, error_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 3]);
                                            return [4 /*yield*/, this.priceService.getCurrentPrice(asset)];
                                        case 1:
                                            price = _a.sent();
                                            return [2 /*return*/, { asset: asset, price: price, error: null }];
                                        case 2:
                                            error_2 = _a.sent();
                                            console.error("Failed to fetch price for ".concat(asset.symbol, ":"), error_2.message);
                                            return [2 /*return*/, { asset: asset, price: null, error: error_2.message }];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        priceUpdates = _a.sent();
                        this.sendMessage(ws, {
                            type: 'price_update',
                            data: priceUpdates,
                            timestamp: new Date().toISOString()
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error sending price update:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WebSocketService.prototype.sendMessage = function (ws, message) {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify(message));
        }
    };
    WebSocketService.prototype.startBroadcasting = function () {
        var _this = this;
        // Broadcast price updates every 5 seconds
        this.broadcastInterval = setInterval(function () {
            _this.broadcastPriceUpdates();
        }, 5000);
    };
    WebSocketService.prototype.broadcastPriceUpdates = function () {
        return __awaiter(this, void 0, void 0, function () {
            var clients, _i, clients_1, client;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clients = Array.from(this.wss.clients);
                        _i = 0, clients_1 = clients;
                        _a.label = 1;
                    case 1:
                        if (!(_i < clients_1.length)) return [3 /*break*/, 4];
                        client = clients_1[_i];
                        if (!(client.readyState === ws_1.default.OPEN)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.sendPriceUpdate(client)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WebSocketService.prototype.startHeartbeat = function () {
        var _this = this;
        // Check connection health every 30 seconds
        this.heartbeatInterval = setInterval(function () {
            var clients = Array.from(_this.wss.clients);
            clients.forEach(function (ws) {
                if (ws.isAlive === false) {
                    console.log('Terminating dead connection');
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    };
    WebSocketService.prototype.getConnectedClientsCount = function () {
        return this.wss.clients.size;
    };
    WebSocketService.prototype.getSubscriptionStats = function () {
        var clients = Array.from(this.wss.clients);
        var totalSubscriptions = clients.reduce(function (sum, client) { var _a; return sum + (((_a = client.subscribedAssets) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        return {
            totalClients: clients.length,
            totalSubscriptions: totalSubscriptions
        };
    };
    WebSocketService.prototype.stop = function () {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
            this.broadcastInterval = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.wss.close();
    };
    return WebSocketService;
}());
exports.WebSocketService = WebSocketService;
