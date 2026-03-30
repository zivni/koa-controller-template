import { injectable, injectFromBase } from "inversify";
import { Kysely, sql } from "kysely";
import { IArticleLikesDal } from "../interfaces/articleLikesDalInterface";
import { ArticleLikesTable } from "../tables/articleLikesDbTypes";
import { SqlDal } from "./base/sqlDal";

@injectable()
@injectFromBase()
export class ArticleLikesDal extends SqlDal implements IArticleLikesDal {

    get setup(): Record<string, (db: Kysely<any>) => Promise<void>> {
        return {
            "2026-03-30T10:29:26.780Z-ArticleLikesDal": async (db) => {
                await db.schema
                    .createTable("articleLikes")
                    .ifNotExists()
                    .addColumn("id", "integer", (col) => col.primaryKey().notNull())
                    .addColumn("articleId", "integer", (col) => col.notNull().references("articles.id").onDelete("cascade").onUpdate("cascade"))
                    .addColumn("isUpvote", "boolean", (col) => col.notNull())
                    .addColumn("createdAt", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
                    .execute();
            },
        };
    }

    public async likeArticle(articleId: number, isUpvote: boolean): Promise<void> {
        await this.db
            .insertInto("articleLikes")
            .values({ articleId, isUpvote } as ArticleLikesTable)
            .execute();
    }
}
