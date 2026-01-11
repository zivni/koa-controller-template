import { inject, injectable } from "inversify";
import * as winston from "winston";

import { ILocalCtxStorageProps } from "../LocalCtxStorageInterface";
import { ILogger, ILoggerFactory } from "./loggerInterface";
import { IOC_TYPES } from "../settings/iocTypes";
import { IConfiguration } from "../settings/configurationInterface";


@injectable()
class LoggerBase {
    public readonly logger: winston.Logger;
    constructor(@inject(IOC_TYPES.Configuration) config: IConfiguration) {
        const formats = [
            winston.format.errors({ stack: true }),
            winston.format.json(),
        ]
        let consoleTransportOptions = {}
        if (config.logPretty) {
            formats.push(winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }))
            consoleTransportOptions = {
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }
        }

        const transports: winston.transport[] = [
            new winston.transports.Console(consoleTransportOptions),
        ];

        this.logger = winston.createLogger({
            level: config.logLevel,
            silent: config.logSilent,
            format: winston.format.combine(
                ...formats
            ),
            transports: transports
        });
    }
}

class Logger implements ILogger {
    private logger: winston.Logger;
    constructor(loggerBase: LoggerBase, metadata?: Object, private localCtxStorage?: ILocalCtxStorageProps) {
        if (metadata) {
            this.logger = loggerBase.logger.child(metadata);
        } else {
            this.logger = loggerBase.logger;
        }
    }

    public error = (msg: string, ex?: Error, meta?: object) => {
        const requestIdObj = this.getRequestID();
        this.logger.error(msg + ": ", { message: ex?.message || "", exception: ex, stack: ex?.stack, requestID: this.localCtxStorage.requestId, ...meta });
    }

    public info = (msg: string, meta?: object) => {
        this.logger.info(msg, { requestID: this.localCtxStorage.requestId, ...meta })
    }

    public debug = (msg: string, meta?: object) => {
        this.logger.debug(msg, { requestID: this.localCtxStorage.requestId, ...meta });
    }

    public warn = (msg: string, meta?: object, ex?: Error) => {
        this.logger.warn(msg, { requestID: this.localCtxStorage.requestId, ...meta, exception: ex ? { message: ex.message, stack: ex.stack } : undefined });
    }



    private getRequestID(): any {
        return { requestID: this.localCtxStorage.requestId };
    }
}

@injectable()
export class LoggerFactory implements ILoggerFactory {
    constructor(private loggerBase: LoggerBase, @inject(IOC_TYPES.LocalCtxStorage) private localCtxStorage: ILocalCtxStorageProps) {
    }

    public getNewLogger = (metadata?: Object, loggerId?: string) => {
        const loggingId = loggerId;
        const logger = new Logger(this.loggerBase, { ...metadata, loggingId }, this.localCtxStorage);
        return logger;
    }
}