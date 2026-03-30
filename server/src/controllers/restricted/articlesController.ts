import { inject } from "inversify";
import { RequestOptions, RequestState } from "../../commonInterfaces";
import { Controller, Route } from "../../koa/routerDecorator";
import { RouteParam, ReqOption, ReqState, ReqBody } from "../../koa/routeArgDecorators";
import { ILogger, ILoggerFactory } from "../../logger/loggerInterface";
import { IOC_TYPES } from "../../settings/iocTypes";
import { CreateArticlesTask } from "./createArticlesTask";

import { IArticlesDal } from "../../dal/interfaces/articlesDalInterface";
import { IOC_DAL_TYPES } from "../../settings/iocTypes";

@Controller('/articles')
export class ArticlesController {
    constructor(
        @inject(IOC_TYPES.LoggerFactory) loggerFactory: ILoggerFactory,
        private readonly createArticlesTask: CreateArticlesTask,
        @inject(IOC_DAL_TYPES.articles) private readonly articlesDal: IArticlesDal,
    ) {
        this.logger = loggerFactory.getNewLogger(null, this.constructor.name);
    }
    private logger: ILogger

    @Route("/get/plain/:id{/:title}")
    public async getArticles({ id, title }: { id: string, title?: string }, requestOptions: RequestOptions) {
        this.logger.info("getArticles called", { id, title, url: requestOptions.ctx.url });
        return { id, title: title || "Sample Article" };
    }

    @Route("/generate/:count")
    public async generateArticles(@RouteParam("count") count: number) {
        this.logger.info("generateArticles called", { count });
        await this.createArticlesTask.run(count);
        return { generated: count };
    }

    @Route("/search", { method: "post" })
    public async searchArticlesPost(@ReqBody body: { titlePart?: string }) {
        this.logger.info("searchArticlesPost called", { titlePart: body.titlePart });
        return this.articlesDal.searchArticles({ titlePart: body.titlePart });
    }

    @Route("/get/decorator/:id/:date{/:title}")
    public async getArticlesNewWay(
        @RouteParam("id") id: number,
        @RouteParam("date") date: Date,
        @RouteParam("title") title: string,
        @ReqOption("testBoolQuery") testBoolQuery: RequestOptions["testBoolQuery"],
        @ReqOption("ctx") ctx: RequestOptions["ctx"],
        @ReqState("stamp") stamp: RequestState["stamp"],
        @ReqState("userId") userId: RequestState["userId"],
        requestOptions: RequestOptions
    ) {
        const testQuery = testBoolQuery ? testBoolQuery("someQuery") : null;
        return {
            id,
            title: title || "Sample Article1",
            date, localDate: date.toLocaleDateString(),
            idPlusOne: id + 1,
            testQuery,
            url: ctx.url,
            userId,
            stamp
        };
    }

    @Route("/post/plain/:id{/:title}", { method: "post" })
    public async postArticles({ id, title }: { id: string, title?: string }, body: any) {
        return { id, title: title || "Sample Article", ...body };
    }

    @Route("/post/decorator/:id{/:title}", { method: "post" })
    public async postArticlesNewWay(@ReqBody body: any, @RouteParam("id") id: number, @RouteParam("title") title: string, requestOptions?: RequestOptions) {
        return { id, idPlusOne: id + 1, title: title || "Sample Article", localDate: body.date?.toLocaleDateString(), ...body };
    }
}