
import { inject, injectable } from "inversify";
import { IArticlesDal } from "../../dal/interfaces/articlesDalInterface";
import { IOC_DAL_TYPES } from "../../settings/iocTypes";

const SAMPLE_TITLES = [
    "The Future of Technology",
    "Understanding Climate Change",
    "Art in the Digital Age",
    "Health and Wellness Tips",
    "Travel Destinations 2026",
    "The Science of Sleep",
    "Sustainable Living Guide",
    "Rise of Artificial Intelligence",
];

const SAMPLE_AUTHORS = [
    "Alice Johnson",
    "Bob Smith",
    "Carol Williams",
    "David Brown",
    "Emma Davis",
];

const SAMPLE_CONTENT = [
    "This article explores the latest trends and innovations shaping our world today.",
    "A deep dive into the subject matter with expert insights and analysis.",
    "Discover what experts are saying about this fascinating topic.",
    "An in-depth look at how this issue affects our daily lives.",
    "Everything you need to know about this subject, explained clearly.",
    "Recent research has uncovered surprising findings that challenge conventional wisdom.",
];

@injectable()
export class CreateArticlesTask {
    constructor(
        @inject(IOC_DAL_TYPES.articles) private readonly articlesDal: IArticlesDal,
    ) { }

    public async run(numberOfArticles: number) {
        const now = new Date();
        for (let i = 0; i < numberOfArticles; i++) {
            const id = Date.now() + i;
            const baseTitle = SAMPLE_TITLES[i % SAMPLE_TITLES.length];
            const title = `${baseTitle} #${id}`;
            const content = SAMPLE_CONTENT[Math.floor(Math.random() * SAMPLE_CONTENT.length)];
            const authorName = SAMPLE_AUTHORS[Math.floor(Math.random() * SAMPLE_AUTHORS.length)];
            await this.articlesDal.createArticle({ id, title, content, authorName, createdAt: now, updatedAt: now });
        }
    }
}