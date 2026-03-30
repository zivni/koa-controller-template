import { injectFromBase } from "inversify";
import { Kysely, Transaction } from "kysely";
import { SqlBase } from "./sqlBase";
import { Database } from "../../database";
import { getSqliteErrorCode } from "./sqliteErrors";

@injectFromBase()
export abstract class SqlDal extends SqlBase {

    abstract get setup(): Record<string, (db: Kysely<any>) => Promise<void>>

    public async runInTransaction(cb: (trx: Transaction<Database>) => Promise<void>) {
        await this.db.transaction().execute(cb)
    }

    protected getErrorCode(error: any) {
        return getSqliteErrorCode(error);
    }
}