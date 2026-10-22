"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const logger = new common_1.Logger('DatabaseModule');
                    const uri = configService.get('mongodbUri') || 'mongodb://127.0.0.1:27017/apna_ghar';
                    if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
                        if (process.env.NODE_ENV === 'production') {
                            logger.error('🚨 CRITICAL: MONGODB_URI environment variable is not configured in Render! Set MONGODB_URI in Render Dashboard to your MongoDB Atlas cluster.');
                        }
                        else {
                            logger.warn('⚠️  Notice: Connecting to localhost MongoDB. On cloud platforms (Render), MONGODB_URI environment variable must be set to your MongoDB Atlas cluster.');
                        }
                    }
                    else {
                        const parts = uri.split('@');
                        const host = parts.length > 1 && parts[1] ? parts[1].split('/')[0] : 'remote';
                        logger.log(`Connecting to MongoDB cluster: ${host}`);
                    }
                    return {
                        uri,
                        lazyConnection: true,
                        autoIndex: process.env.NODE_ENV !== 'production',
                        serverSelectionTimeoutMS: 5000,
                        connectTimeoutMS: 10000,
                        retryAttempts: 2,
                        retryDelay: 1000,
                        connectionFactory: (connection) => {
                            connection.on('connected', () => {
                                logger.log('✅ MongoDB connected successfully!');
                            });
                            connection.on('error', (err) => {
                                logger.warn(`⚠️  MongoDB connection notice: ${err.message}`);
                            });
                            connection.on('disconnected', () => {
                                logger.warn('⚠️  MongoDB disconnected. Continuing background reconnection...');
                            });
                            return connection;
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        exports: [mongoose_1.MongooseModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map