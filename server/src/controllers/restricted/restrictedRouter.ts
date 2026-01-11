import { injectable } from "inversify";
import { ArticlesController } from "./articlesController";
import { KoaAppRouterBase } from "../../koa/koaAppRouterInterface";
import { bindControllerToParentRouter } from "../../koa/routerDecorator";

@injectable()
export class RestrictedRouter extends KoaAppRouterBase {
    constructor(
        articlesController: ArticlesController,
    ) {
        super();
        this.setup();
        bindControllerToParentRouter(this._router, articlesController);
    }

    private setup() {
        this._router.use(async (ctx, next) => {
            ctx.state.userId = "sampleUserId";
            await next();
        });
    }
}