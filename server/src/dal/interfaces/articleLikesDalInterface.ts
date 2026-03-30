export interface IArticleLikesDal {
    likeArticle(articleId: number, isUpvote: boolean): Promise<void>;
}