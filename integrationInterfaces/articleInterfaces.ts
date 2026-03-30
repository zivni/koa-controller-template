export interface Article {
    id: number;
    title: string;
    content: string;
    authorName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ArticleWithLikes extends Article {
    likesCount: number;
    dislikesCount: number;
}