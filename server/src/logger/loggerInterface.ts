export interface ILogger {
    error(msg: string, ex?: Error, meta?: object): void
    info(msg: string, meta?: object): void
    debug(msg: string, meta?: object): void
    warn(msg: string, meta?: object, ex?: Error): void
}

export interface ILoggerFactory {
    getNewLogger(metadata?: Object, loggerId?: string): ILogger
}