import { injectable, inject } from "inversify"
import { Kysely, SqliteDialect, sql } from "kysely"
import SQLite from 'better-sqlite3'
import { SerializePlugin } from "kysely-plugin-serialize"
import { LoggerFactory } from "../../../logger/logger"
import { ILogger } from "../../../logger/loggerInterface"
import { IConfiguration } from "../../../settings/configurationInterface"
import { IOC_TYPES } from "../../../settings/iocTypes"
import { Database } from "../../database"

@injectable()
export abstract class SqlBase {
    constructor(
        @inject(IOC_TYPES.Configuration) protected config: IConfiguration,
        @inject(IOC_TYPES.LoggerFactory) loggerFactory: LoggerFactory,
    ) {
        this._logger = loggerFactory.getNewLogger({ dal: this.constructor.name }, "sql_base")
    }
    private _logger: ILogger

    private static _dbInstance: Kysely<Database>
    private createDbInstance() {
        const sqlite = new SQLite(this.config.db.databaseFilePath, this.config.db.options)
        const dialect = new SqliteDialect({
            database: sqlite,
        })
        const db = new Kysely<Database>({
            dialect,
            plugins: [new SerializePlugin(),]
        });
        void this.testSqliteConnection(db)
        return db;

    }

    private async testSqliteConnection(db: Kysely<Database>): Promise<void> {
        try {
            await sql`select 1`.execute(db)
            this.logger.info("SQLite connection test successful")
        } catch (error) {
            this.logger.error("SQLite connection test failed", error as Error, {
                databaseFilePath: this.config.db.databaseFilePath,
            })
            process.exit(1);
        }
    }

    protected get db(): Kysely<Database> {
        if (!SqlBase._dbInstance) {
            SqlBase._dbInstance = this.createDbInstance();
        }
        return SqlBase._dbInstance;
    }

    protected get logger(): ILogger {
        return this._logger;
    }

}