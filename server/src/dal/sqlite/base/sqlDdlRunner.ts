import { injectable, injectFromBase } from "inversify";
import { Migrator, MigrationProvider, Migration, Kysely } from "kysely";
import { SqlBase } from "./sqlBase";
import { SqlDal } from "./sqlDal";
import { iocContainer } from "../../../settings/iocDefinitions";
import { IOC_DAL_TYPES } from "../../../settings/iocTypes";


@injectable()
@injectFromBase()
export class SqlDdlRunner extends SqlBase {
    public async updateDB() {
        const logger = this.logger;
        logger.info("start DB update")
        const migrator = this.getMigrator();
        const { error, results } = await migrator.migrateToLatest()

        results?.forEach((it) => {
            if (it.status === 'Success') {
                logger.info(`migration "${it.migrationName}" was executed successfully`)
            } else if (it.status === 'Error') {
                logger.error(`failed to execute migration "${it.migrationName}"`)
            }
        })

        if (error) {
            logger.error('failed to tun DB migrations', error as Error)
            console.error(error)
            process.exit(1)
        }
        logger.info("DB ended")
    }

    private getMigrator() {
        const iocDalKeys = Object.values(IOC_DAL_TYPES);
        const provider = new OurMigrationProvider();
        for (const iocDalKey of iocDalKeys) {
            const dal = iocContainer.get<SqlDal>(iocDalKey);
            dal.setup && provider.addMigrations(dal.setup);
        }

        const migrator = new Migrator({
            db: super.db,
            provider,
        });
        return migrator;
    }
}

class OurMigrationProvider implements MigrationProvider {
    private migrations: Record<string, Migration> = {};

    public async getMigrations(): Promise<Record<string, Migration>> {
        return this.migrations;
    }

    public addMigrations(updates: Record<string, (db: Kysely<any>) => Promise<void>>) {
        for (const key in updates) {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                const up = updates[key];
                this.migrations[key] = {
                    up
                };
            }
        }
    }

}