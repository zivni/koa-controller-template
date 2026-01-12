import path from "node:path";
import { injectable, inject } from "inversify";
import Koa from "koa";
import { LoggerFactory } from "../logger/logger";
import { ILogger } from "../logger/loggerInterface";
import { IOC_TYPES } from "../settings/iocTypes";
import { getPageTemplate } from "./htmlPageTemplate";

@injectable()
export class IndexPage {
    private logger: ILogger;
    private jsFiles: string[];
    private cssFiles: string[];

    constructor(
        @inject(IOC_TYPES.LoggerFactory) loggerFactory: LoggerFactory,
    ) {
        this.logger = loggerFactory.getNewLogger();
        const filesPath = path.resolve(__dirname, "../../public/dist/", "frontend_files.json");
        try {
            const json = require(filesPath);
            const resources = Object.values(json) as string[];
            this.cssFiles = resources.filter(r => path.extname(r).toLowerCase() === ".css")
            this.jsFiles = resources.filter(r => path.extname(r).toLowerCase() === ".js")
        } catch (ex) {
            this.logger.error("Error loading index page resource files", ex, { filesPath })
        }
    }

    public async get(ctx: Koa.Context) {
        // you can test here for authorization and return different pages or throw a 401 error

        return getPageTemplate({
            jsFiles: this.jsFiles,
            cssFiles: this.cssFiles,
            title: "Koa Controller Template"
        });
    }
}