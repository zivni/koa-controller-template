import { inject, injectable } from "inversify";
import { getClientIp } from "request-ip"
import { KoaAppRouterBase } from "./koaAppRouterInterface";
import { UrlResolver } from "./urlResolver";
import { LoggerFactory } from "../logger/logger";
import { IOC_TYPES } from "../settings/iocTypes";
import { ILogger } from "../logger/loggerInterface";
import { ApiError } from "../ApiError";
import { ILocalCtxStorageProps } from "../LocalCtxStorageInterface";
import { ServerErrorCodes } from "../../../integrationInterfaces/siteInterfaces";
import { IndexPage } from "../indexPage/indexPage";
import { RestrictedRouter } from "../controllers/restricted/restrictedRouter";


@injectable()
export class RootRouter extends KoaAppRouterBase {
    constructor(
        @inject(IOC_TYPES.LoggerFactory) loggerFactory: LoggerFactory,
        @inject(IOC_TYPES.UrlResolver) urlResolver: UrlResolver,
        @inject(IOC_TYPES.LocalCtxStorage) private localCtxStorage: ILocalCtxStorageProps,
        indexPage: IndexPage,
        restrictedRouter: RestrictedRouter,
    ) {
        super();
        const logger = loggerFactory.getNewLogger(null, this.constructor.name);
        this.appLogger = logger;

        this.setup();
        urlResolver.setRouter(this._router);

        this._router.use("/restricted", restrictedRouter.routes);

        this._router.get(/^\//, async (ctx, next) => {
            ctx.body = await indexPage.get(ctx);
        })
        try {
            logger.debug("registered urls:")
            this._router.stack.forEach(i => {
                const { name, methods, path } = i;
                logger.debug("registered url", { name: name ?? undefined, path, methods: methods.filter(m => m !== "HEAD") });
            })
        } catch { }
    }
    private appLogger: ILogger

    private setup() {
        this._router.use(async (ctx, next) => {
            try {
                await next();
                if (ctx.response.is("json")) {
                    ctx.body = {
                        data: ctx.body,
                        requestId: this.localCtxStorage.requestId,
                        error: null,
                    }
                }
            } catch (error) {
                if (error instanceof ApiError) {
                    this.appLogger.warn(error.message, { url: ctx.url }, error)
                    ctx.status = 400;
                    ctx.body = {
                        data: null,
                        requestId: this.localCtxStorage.requestId,
                        error,
                    }
                } else if (error.status === 401) {
                    ctx.status = 401;
                    ctx.body = {
                        data: null,
                        requestId: this.localCtxStorage.requestId,
                        error: {
                            message: "Not Authorized",
                            errorCode: ServerErrorCodes.NOT_AUTHORIZED,
                            parms: {},
                        },
                    }
                } else {
                    this.appLogger.error(error.message, error, { url: ctx.url })
                    ctx.status = 500;
                    ctx.body = {
                        data: null,
                        requestId: this.localCtxStorage.requestId,
                        error: {
                            message: "General Error",
                            errorCode: ServerErrorCodes.GENERAL_ERROR,
                            parms: {},
                        },
                    }
                }

            }
        })
    }
}

