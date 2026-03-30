import { injectable, injectFromBase } from "inversify";
import { Kysely, sql } from "kysely";
import { ArticleWithLikes } from "../../../../integrationInterfaces/articleInterfaces";
import { SqlErrorCode } from "../sqlErrorsCodes";
import { IArticlesDal, SearchArticlesParams } from "../interfaces/articlesDalInterface";
import { ArticlesTable } from "../tables/articlesDbTypes";
import { SqlDal } from "./base/sqlDal";

@injectable()
@injectFromBase()
export class ArticlesDal extends SqlDal implements IArticlesDal {

    get setup(): Record<string, (db: Kysely<any>) => Promise<void>> {
        return {
            "2026-03-30T09:25:42.848Z-ArticlesDal": async (db) => {
                await db.schema
                    .createTable("articles")
                    .ifNotExists()
                    .addColumn("id", "integer", (col) => col.primaryKey().notNull())
                    .addColumn("title", "text", (col) => col.notNull())
                    .addColumn("content", "text", (col) => col.notNull())
                    .addColumn("authorName", "text", (col) => col.notNull())
                    .addColumn("createdAt", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
                    .addColumn("updatedAt", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
                    .execute();
            },
        };
    }

    public async searchArticles(params: SearchArticlesParams): Promise<ArticleWithLikes[]> {
        let query = this.db
            .selectFrom("articles")
            .leftJoin("articleLikes", "articleLikes.articleId", "articles.id")
            .select((eb) => [
                "articles.id",
                "articles.title",
                "articles.content",
                "articles.authorName",
                "articles.createdAt",
                "articles.updatedAt",
                eb.fn.count<number>("articleLikes.id").filterWhere("articleLikes.isUpvote", "=", true).as("likesCount"),
                eb.fn.count<number>("articleLikes.id").filterWhere("articleLikes.isUpvote", "=", false).as("dislikesCount"),
            ])
            .groupBy("articles.id");

        if (params.titlePart) {
            query = query.where("articles.title", "like", `%${params.titlePart}%`);
        }

        const rows = await query.execute();
        return rows.map((row) => ({
            ...row,
            likesCount: Number(row.likesCount),
            dislikesCount: Number(row.dislikesCount),
        }));
    }

    public async getArticleById(id: number): Promise<ArticlesTable | null> {
        const result = await this.db
            .selectFrom("articles")
            .selectAll()
            .where("articles.id", "=", id)
            .executeTakeFirst();
        return result ?? null;
    }

    public async createArticle(article: Partial<ArticlesTable>): Promise<void> {
        try {
            await this.db
                .insertInto("articles")
                .values(article as ArticlesTable)
                .execute();
        } catch (error) {
            if (this.getErrorCode(error) === SqlErrorCode.uniqueKey) return;
            throw error;
        }
    }

    public async updateArticle(id: number, article: Partial<ArticlesTable>): Promise<void> {
        await this.db
            .updateTable("articles")
            .set(article)
            .where("id", "=", id)
            .execute();
    }

    public async deleteArticle(id: number): Promise<void> {
        await this.db
            .deleteFrom("articles")
            .where("id", "=", id)
            .execute();
    }
}