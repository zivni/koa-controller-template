export interface ArticleLikesTable {
    id: number;
    articleId: number;
    isUpvote: boolean;
    createdAt: Date;
}