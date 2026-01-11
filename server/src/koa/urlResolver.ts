import Router from "@koa/router";
import { injectable } from "inversify";

@injectable()
export class UrlResolver {
    private _router: Router
    public setRouter(router: Router) {
        if (this._router) {
            throw "Cannot call setRouter twice"
        }
        this._router = router;
    }

    public getUrl(routerName: string, ...args) {
        return this._router.url(routerName, ...args) as string;
    }
}