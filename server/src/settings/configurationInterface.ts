export interface IConfiguration {
    readonly port: number
    readonly logSilent: boolean
    readonly logLevel: string
    readonly logPretty: boolean
    readonly db: SbSqliteConfig
}

export interface SbSqliteConfig {
    readonly databaseFilePath: string
    readonly options?: any
}