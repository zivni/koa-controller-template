import { ArticleWithLikes } from "../../../../integrationInterfaces/articleInterfaces";
import { ArticlesTable } from "../tables/articlesDbTypes";

export interface SearchArticlesParams {
    titlePart?: string;
}

export interface IArticlesDal {
    searchArticles(params: SearchArticlesParams): Promise<ArticleWithLikes[]>;
    getArticleById(id: number): Promise<ArticlesTable | null>;
    createArticle(article: Partial<ArticlesTable>): Promise<void>;
    updateArticle(id: number, article: Partial<ArticlesTable>): Promise<void>;
    deleteArticle(id: number): Promise<void>;
}