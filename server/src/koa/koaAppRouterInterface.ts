import Router, { RouterMiddleware } from "@koa/router";
import { injectable } from "inversify";

export interface IKoaAppRouter {
    readonly router: Router;
    readonly routes: RouterMiddleware
}

@injectable()
export abstract class KoaAppRouterBase implements IKoaAppRouter {
    protected _router: Router = new Router();

    public get router(): Router {
        return this._router;
    }
    public get routes(): RouterMiddleware {
        return this._router.routes();
    }
}