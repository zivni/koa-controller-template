import { Readable } from "node:stream";
import Router, { RouterMiddleware } from "@koa/router";
import multer from "@koa/multer"
import { DefaultContext, DefaultState, ParameterizedContext } from "koa"
import { decorate, injectFromBase, injectable } from "inversify";
import { iocContainer } from '../settings/iocDefinitions';
import { RequestOptions } from "../commonInterfaces";
import { routeBodyArgumentMetadataKey, RouteParameterMetaData, routeParameterMetadataKey, RouteRequestOptionMetaData, routeRequestOptionMetadataKey, RouteStateVarMetaData, routeStateVarMetadataKey } from "./routeArgDecorators";


const upload = multer();

export const routeNamesToReloadAccessTokensBeforeCall: string[] = [];
export const routeNamesToReloadAccessTokensAfterCall: string[] = [];

export enum ControllerRouteReturnType {
    basic = 0,
    stream = 1,
    descriptionObject = 2,
}

export interface ControllerAttachedClassMethods {
    getUrl: (routeName: string, ...args: string[]) => string | Error
}

interface RouteOptions {
    method?: "get" | "post"
    returnType?: ControllerRouteReturnType
    responseContentType?: string | false
    throwStreamError?: boolean
    routeName?: string
    postFileFieldName?: string
    headers?: Record<string, string | string[]>
    reloadAccessTokenBefore?: boolean //must be used with 'routeName'
    reloadAccessTokenAfter?: boolean //must be used with 'routeName'
    disableBodyDateConversion?: boolean
}

export interface RouteMethodReturnDescription {
    data?: any
    contentType?: string
    httpStatus?: number
    headers?: Record<string, string | string[]>
}

const routeMetadataKey = Symbol("routeMetadataKey");

type RouteDefinitionMetaData = {
    route: string | string[];
    options: RouteOptions;
    func: ControllerFunction;
    routeParameters: RouteParameterMetaData[]
    routeRequestOptions: RouteRequestOptionMetaData[];
    routeStateVariables: RouteStateVarMetaData[];
    routeBodyParameterIndex: number | undefined;
};
type GetControllerFunction<Params extends unknown[] = unknown[]> = (...params: [...Params, RequestOptions?]) => Promise<any>;
type PostControllerFunction<Params extends unknown[] = unknown[], Body = unknown> = (...params: [...Params, Body?, RequestOptions?]) => Promise<any>;
type ControllerFunction = GetControllerFunction | PostControllerFunction

const routeParameterConverters = {
    "Number": (val: string) => Number(val),
    "Date": (val: string) => new Date(val),
}

export function Route(route: string | string[], options: RouteOptions = {}) {
    return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<ControllerFunction>) {
        let func = descriptor.value;

        const routeParameters: RouteParameterMetaData[] = Reflect.getOwnMetadata(routeParameterMetadataKey, target, propertyName) || [];
        const routeRequestOptions: RouteRequestOptionMetaData[] = Reflect.getOwnMetadata(routeRequestOptionMetadataKey, target, propertyName) || [];
        const routeStateVariables: RouteStateVarMetaData[] = Reflect.getOwnMetadata(routeStateVarMetadataKey, target, propertyName) || [];
        const routeBodyParameterIndex: number | undefined = Reflect.getOwnMetadata(routeBodyArgumentMetadataKey, target, propertyName);

        const existingRouteDefinitions: RouteDefinitionMetaData[] = Reflect.getOwnMetadata(routeMetadataKey, target) || [];
        existingRouteDefinitions.push({ route, options, func, routeParameters, routeRequestOptions, routeStateVariables, routeBodyParameterIndex })
        Reflect.defineMetadata(routeMetadataKey, existingRouteDefinitions, target);
    }
}

export function Controller(prefix: string, { middlewares, controllersIocTypes }: { middlewares?: Array<RouterMiddleware>, controllersIocTypes?: (string | symbol)[] } = {}) {
    return function <T extends { new(...args: any[]): {} }>(target: T) {
        decorate(injectable(), target);

        const ControllerWithRouter = class extends target {
            constructor(...args: any[]) {
                super(...args);
                this._router = new Router({ prefix });
                this.getUrl = (routeName: string, ...args: string[]) => this._router.url(routeName, ...args)

                if (middlewares?.length) {
                    //@ts-expect-error https://github.com/koajs/router/issues/219
                    this._router.use(...middlewares)
                }
                if (controllersIocTypes?.length) {
                    controllersIocTypes.forEach(t => {
                        const childController = iocContainer.get(t);
                        bindControllerToController(this, childController)
                    })
                }

                //based on https://stackoverflow.com/a/55117327/1353412
                let existingRouteDefinitions: RouteDefinitionMetaData[] = []
                let target = Object.getPrototypeOf(this);
                while (target != Object.prototype) {
                    let childMetaData = Reflect.getOwnMetadata(routeMetadataKey, target) || [];
                    existingRouteDefinitions.push(...childMetaData);
                    target = Object.getPrototypeOf(target);
                }

                for (let routeDefinition of existingRouteDefinitions) {
                    const { route, func, routeParameters } = routeDefinition;
                    let options = routeDefinition.options;
                    if (!options) options = { method: "get" }
                    switch (options.method) {
                        case "post":
                            const postFunctionCall = async (ctx: DefaultContext, requestOptions: RequestOptions) => {
                                requestOptions.testBoolQuery = testBoolQuery(ctx)
                                const paramArgs: any[] = getRouteParameters(routeDefinition, ctx, requestOptions, options.disableBodyDateConversion);
                                const body = options.disableBodyDateConversion ? ctx.request.body : convertBodyDates(ctx);
                                return await func.call(this, ...paramArgs, body, requestOptions)
                            }
                            const middlewares = [getRouteMiddleware(options, postFunctionCall)]
                            if (options.postFileFieldName) {
                                middlewares.unshift(upload.single(options.postFileFieldName))
                            }
                            if (options.reloadAccessTokenAfter || options.reloadAccessTokenBefore) {
                                if (!options.routeName) {
                                    throw "routeName must be specified with reloadAccessTokenAfter or reloadAccessTokenBefore"
                                }
                                if (options.reloadAccessTokenAfter) {
                                    routeNamesToReloadAccessTokensAfterCall.push(options.routeName);
                                }
                                if (options.reloadAccessTokenBefore) {
                                    routeNamesToReloadAccessTokensBeforeCall.push(options.routeName);
                                }
                            }
                            if (options.routeName) {
                                if (Array.isArray(route)) {
                                    throw "routeName cannot be used with an array of routes"
                                }
                                this._router.post(options.routeName, route, ...middlewares);
                            } else {
                                this._router.post(route, ...middlewares);
                            }
                            break;
                        default:
                            const getFunctionCall = async (ctx: DefaultContext, requestOptions: RequestOptions) => {
                                requestOptions.testBoolQuery = testBoolQuery(ctx)
                                const paramArgs: any[] = getRouteParameters(routeDefinition, ctx, requestOptions, options.disableBodyDateConversion);
                                return await func.call(this, ...paramArgs, requestOptions)
                            }
                            if (options.reloadAccessTokenAfter || options.reloadAccessTokenBefore) {
                                if (!options.routeName) {
                                    throw "routeName must be specified with reloadAccessTokenAfter or reloadAccessTokenBefore"
                                }
                                if (options.reloadAccessTokenAfter) {
                                    routeNamesToReloadAccessTokensAfterCall.push(options.routeName);
                                }
                                if (options.reloadAccessTokenBefore) {
                                    routeNamesToReloadAccessTokensBeforeCall.push(options.routeName);
                                }
                            }
                            if (options.routeName) {
                                if (Array.isArray(route)) {
                                    throw "routeName cannot be used with an array of routes"
                                }
                                this._router.get(options.routeName, route, getRouteMiddleware(options, getFunctionCall))
                            } else {
                                this._router.get(route, getRouteMiddleware(options, getFunctionCall))
                            }
                            break;
                    }

                }
            }
            protected _router: Router;

            protected getUrl: (routeName: string, ...args: string[]) => string | Error

            public get router(): Router {
                return this._router;
            }
            public get routes(): RouterMiddleware {
                return this._router.routes();
            }
        };

        decorate(injectFromBase(), ControllerWithRouter);

        return ControllerWithRouter;
    }
}


function getRouteParameters(routeDefinition: RouteDefinitionMetaData, ctx: DefaultContext, requestOptions: RequestOptions, disableBodyDateConversion: boolean) {
    const {
        routeParameters,
        routeRequestOptions = [],
        routeStateVariables = [],
        routeBodyParameterIndex
    } = routeDefinition;
    const paramArgs: any[] = [];
    for (let param of routeParameters) {
        let val = ctx.params[param.parameterName];
        if (!param.options.disableTypeConversion && routeParameterConverters[param.parameterType]) {
            val = routeParameterConverters[param.parameterType](val);
        }
        paramArgs[param.parameterIndex] = val;
    }
    for (let reqOption of routeRequestOptions) {
        paramArgs[reqOption.parameterIndex] = requestOptions[reqOption.key];
    }
    const ctxState = ctx?.state;
    if (ctxState) {
        for (let stateVar of routeStateVariables) {
            paramArgs[stateVar.parameterIndex] = ctxState[stateVar.key];
        }
    }
    if (Number.isInteger(routeBodyParameterIndex)) {
        paramArgs[routeBodyParameterIndex] = disableBodyDateConversion ? ctx.request.body : convertBodyDates(ctx);
    }
    if (paramArgs.length === 0) paramArgs.push(ctx.params);
    return paramArgs;
}

function getRouteMiddleware(options: RouteOptions, functionCall: (ctx: DefaultContext, { stream, abortController }: RequestOptions) => Promise<any>) {
    return async (ctx: ParameterizedContext) => {
        switch (options.returnType) {
            case ControllerRouteReturnType.stream: {
                var stream = ctx.body = new Readable();
                stream._read = function () { };
                stream.pipe(ctx.res);
                ctx.type = options.responseContentType || 'text/undefined-content';
                if (options.headers) {
                    ctx.set(options.headers)
                }

                let finished = false;
                const abortController = new AbortController();
                ctx.req.once("close", () => {
                    if (!finished) {
                        abortController.abort();
                    }
                });

                try {
                    await functionCall(ctx, { stream, abortController, ctx });
                } catch (error) {
                    throw error;
                } finally {
                    finished = true;
                    stream.push(null);
                }
                break;
            }
            case ControllerRouteReturnType.descriptionObject: {
                const result: RouteMethodReturnDescription = await functionCall(ctx, { stream: null, abortController: null, ctx });
                if (!result) {
                    ctx.status = 200;
                    return;
                }
                ctx.body = result.data;
                if (result.contentType) {
                    ctx.type = result.contentType;
                } else if (options.responseContentType) {
                    ctx.type = options.responseContentType;
                }

                if (options.headers) {
                    ctx.set(options.headers)
                }

                if (result.headers) {
                    ctx.set(result.headers)
                }


                ctx.status = result.httpStatus || 200;

                break;
            }

            default: {
                ctx.body = await functionCall(ctx, { stream: null, abortController: null, ctx });
                if (options.responseContentType) {
                    ctx.type = options.responseContentType;
                }
                if (options.headers) {
                    ctx.set(options.headers)
                }

                ctx.status = 200;
                break;
            }
        }
    };
}

export function bindControllerToParentRouter(router: Router, controller: any) {
    router.use(controller.routes);
}

export function bindControllerToController(thisController: any, childController: any) {
    thisController.router.use(childController.routes);
}

const booleanRegex = /^\s*(true|1|on)\s*$/i;
const testBoolQuery = (ctx: DefaultContext) => (queryName: string) => {
    if (Array.isArray(ctx.query[queryName])) return false
    return booleanRegex.test(ctx.query[queryName])
}

function convertBodyDates(ctx: DefaultContext) {
    if (ctx.headers["content-type"] == "application/json" && typeof ctx.request.body === "object") {
        return JSON.parse(JSON.stringify(ctx.request.body), dateParser);
    }
    return ctx.request.body;
}


const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;
export const dateParser = (key: string, value: any) => {

    if (typeof value === 'string' && ISO_8601.test(value)) {
        var newValue;
        if (!value.endsWith("Z")) {
            newValue = `${value}Z`;
            console.error("WARNING date without Z ending", value)
        }
        else newValue = value
        return new Date(newValue);
    }
    return value;
}