import { ArticleLikesTable } from "./tables/articleLikesDbTypes";
import { ArticlesTable } from "./tables/articlesDbTypes";

export interface Database {
    articles: ArticlesTable;
    articleLikes: ArticleLikesTable;
}