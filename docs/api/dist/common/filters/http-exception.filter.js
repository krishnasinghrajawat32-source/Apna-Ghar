"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const shared_constants_1 = require("@apna-ghar/shared-constants");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode = shared_constants_1.ERROR_CODES.INTERNAL_SERVER_ERROR;
        let message = 'An unexpected internal error occurred';
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
            }
            else if (typeof res === 'object' && res !== null) {
                const errorObj = res;
                message = errorObj.message || exception.message;
                errorCode = errorObj.code || this.mapStatusToErrorCode(status);
                if (Array.isArray(errorObj.message)) {
                    message = errorObj.message.join('; ');
                    details = { validationErrors: errorObj.message };
                }
            }
        }
        else if (exception instanceof Error) {
            this.logger.error(`Unhandled Exception on ${request.method} ${request.url}: ${exception.message}`, exception.stack);
        }
        const errorPayload = {
            success: false,
            error: {
                code: errorCode,
                message,
                ...(details ? { details } : {}),
            },
        };
        response.status(status).json(errorPayload);
    }
    mapStatusToErrorCode(status) {
        switch (status) {
            case common_1.HttpStatus.BAD_REQUEST:
                return shared_constants_1.ERROR_CODES.VALIDATION_ERROR;
            case common_1.HttpStatus.UNAUTHORIZED:
                return shared_constants_1.ERROR_CODES.AUTH_UNAUTHORIZED;
            case common_1.HttpStatus.FORBIDDEN:
                return shared_constants_1.ERROR_CODES.AUTH_FORBIDDEN;
            case common_1.HttpStatus.NOT_FOUND:
                return shared_constants_1.ERROR_CODES.RESOURCE_NOT_FOUND;
            case common_1.HttpStatus.CONFLICT:
                return shared_constants_1.ERROR_CODES.BED_NOT_AVAILABLE;
            case common_1.HttpStatus.TOO_MANY_REQUESTS:
                return shared_constants_1.ERROR_CODES.RATE_LIMIT_EXCEEDED;
            default:
                return shared_constants_1.ERROR_CODES.INTERNAL_SERVER_ERROR;
        }
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=http-exception.filter.js.map