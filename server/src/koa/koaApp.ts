import crypto from "node:crypto";
import * as path from "node:path"
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import serve from "koa-static";
import mount from "koa-mount"
import Router from '@koa/router';
import { inject, injectable } from 'inversify';
import { IWebApp } from '../webAppInterface';
import { ILogger } from '../logger/loggerInterface';
import { ILocalCtxStorage, ILocalCtxStorageProps } from "../LocalCtxStorageInterface";
import Application from "koa";
import { LoggerFactory } from "../logger/logger";
import { IOC_TYPES } from "../settings/iocTypes";
import { IConfiguration } from "../settings/configurationInterface";
import { KoaAppRouterBase } from "./koaAppRouterInterface";


type Writeable<T> = { -readonly [P in keyof T]: T[P] };
type KoaContext = Application.DefaultContext & Writeable<ILocalCtxStorageProps>;


const publicFolder = path.resolve(__dirname, "../public");

@injectable()
export class KoaApp implements IWebApp {
    private app = new Koa<Application.DefaultState, KoaContext>();
    private router: Router;
    private appLogger: ILogger

    constructor(@inject(IOC_TYPES.Configuration) private config: IConfiguration,
        @inject(IOC_TYPES.RootRouter) private rootRouter: KoaAppRouterBase,
        @inject(IOC_TYPES.LoggerFactory) private loggerFactory: LoggerFactory,
        @inject(IOC_TYPES.LocalCtxStorage) private localCtxStorage: ILocalCtxStorage,
    ) {
        this.router = rootRouter.router;
        this.appLogger = loggerFactory.getNewLogger(null, "koaApp");
    }

    public start = () => {

        this.setUp();
        this.app.listen(this.config.port, () => {
            this.appLogger.info(`start listening to port ${this.config.port}`);
        });
        this.app.on("error", (err, ctx) => {
            console.error(err, ctx?.href);
        })
    }

    private setUp = () => {
        this.app.use(mount("/static", serve(publicFolder)))
        this.app.use(async (ctx, next) => {
            ctx.requestId = crypto.randomUUID()
            await next()
        });
        this.app.use(async (ctx, next) => {
            await this.localCtxStorage.ctxStorage.run(ctx, async () => {
                this.loggerFactory.getNewLogger().debug(`Got ${ctx.req.url}`);
                await next();
            });
        });
        this.app.use(bodyParser({
            onerror: (err, ctx) => {
                this.loggerFactory.getNewLogger().error("body parse error", err);
                ctx.throw(422, 'body parse error');
            }
        }));
        this.app.use(this.router.routes())
            .use(this.router.allowedMethods());
    }
}