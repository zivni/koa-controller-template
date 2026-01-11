import { RequestOptions } from "../commonInterfaces";

export const routeParameterMetadataKey = Symbol("routeParameterMetadataKey");
export const routeBodyArgumentMetadataKey = Symbol("routeBodyArgumentMetadataKey");
export const routeRequestOptionMetadataKey = Symbol("routeRequestOptionMetadataKey");
export const routeStateVarMetadataKey = Symbol("routeStateVarMetadataKey");

//#region Types
export type RouteParameterMetaData = {
    parameterIndex: number;
    parameterName: string;
    parameterType: string;
    options: RouteParameterOptions;
};
export type RouteParameterOptions = {
    disableTypeConversion?: boolean;
};

export type RouteInjectedValueMetaData<Key extends PropertyKey> = {
    parameterIndex: number;
    key: Key;
};
export type RouteRequestOptionMetaData = RouteInjectedValueMetaData<keyof RequestOptions>;
export type RouteStateVarMetaData = RouteInjectedValueMetaData<keyof ExtractedRequestState>;

type RequestContext = NonNullable<RequestOptions["ctx"]>;
type ExtractedRequestState = RequestContext extends { state: infer State } ? State : never;

type IsAny<T> = 0 extends (1 & T) ? true : false;
type DecoratorTypeError<Message extends string> = never & { __decoratorTypeError__: Message };
type DecoratorParameterName<Key extends PropertyKey> = string & Key;

type EnforceParameterMatchesSource<
    Method extends (...args: any[]) => any,
    Index extends number,
    Source,
    Key extends keyof Source,
    Decorator extends string,
    SourceLabel extends string
> = Parameters<Method> extends infer Params
    ? Params extends unknown[]
    ? Index extends keyof Params
    ? Params[Index] extends infer Param
    ? IsAny<Param> extends true
    ? DecoratorTypeError<`${Decorator} parameter '${DecoratorParameterName<Key>}' must be explicitly typed as ${SourceLabel}`>
    : Param extends Source[Key]
    ? Source[Key] extends Param
    ? Method
    : DecoratorTypeError<`${Decorator} parameter '${DecoratorParameterName<Key>}' type mismatch with ${SourceLabel}`>
    : DecoratorTypeError<`${Decorator} parameter '${DecoratorParameterName<Key>}' type mismatch with ${SourceLabel}`>
    : DecoratorTypeError<`${Decorator} parameter '${DecoratorParameterName<Key>}' type mismatch with ${SourceLabel}`>
    : DecoratorTypeError<`${Decorator} parameter '${DecoratorParameterName<Key>}' index is out of range`>
    : DecoratorTypeError<`${Decorator} parameter '${DecoratorParameterName<Key>}' type metadata unavailable`>
    : DecoratorTypeError<`${Decorator} parameter '${DecoratorParameterName<Key>}' type metadata unavailable`>;
//#endregion

export function RouteParam(parameterName: string, options: RouteParameterOptions = {}) {
    return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
        const existingRouteParameters: RouteParameterMetaData[] = Reflect.getOwnMetadata(routeParameterMetadataKey, target, propertyKey) || [];
        const propertyTypes = Reflect.getOwnMetadata("design:paramtypes", target, propertyKey);
        const parameterType = propertyTypes[parameterIndex].name;
        existingRouteParameters.push({ parameterIndex, parameterName, parameterType, options });
        Reflect.defineMetadata(routeParameterMetadataKey, existingRouteParameters, target, propertyKey);
    }
}

export function ReqBody(target: any, propertyKey: string | symbol, parameterIndex: number) {
    let existingBodyParameterIndex: number | null = Reflect.getOwnMetadata(routeBodyArgumentMetadataKey, target, propertyKey) || null;
    if (existingBodyParameterIndex !== null) {
        console.error("Only one @ReqBody is allowed per method");
        process.exit(1);
    }
    existingBodyParameterIndex = parameterIndex;
    Reflect.defineMetadata(routeBodyArgumentMetadataKey, parameterIndex, target, propertyKey);
}


export function ReqOption<K extends keyof RequestOptions>(parameterName: K) {
    return function <
        TKey extends string | symbol,
        TTarget extends object & Record<TKey, (...args: any[]) => any>,
        TIndex extends keyof Parameters<TTarget[TKey]> & number
    >(
        target: TTarget & Record<TKey, EnforceParameterMatchesSource<TTarget[TKey], TIndex, RequestOptions, K, "@ReqOption", "RequestOptions field type">>,
        propertyKey: TKey,
        parameterIndex: TIndex
    ) {
        const existingRouteRequestOptions: RouteRequestOptionMetaData[] =
            Reflect.getOwnMetadata(routeRequestOptionMetadataKey, target, propertyKey) || [];
        existingRouteRequestOptions.push({ parameterIndex, key: parameterName });
        Reflect.defineMetadata(routeRequestOptionMetadataKey, existingRouteRequestOptions, target, propertyKey);
    };
}

export function ReqState<K extends keyof ExtractedRequestState>(stateKey: K) {
    return function <
        TKey extends string | symbol,
        TTarget extends object & Record<TKey, (...args: any[]) => any>,
        TIndex extends keyof Parameters<TTarget[TKey]> & number
    >(
        target: TTarget & Record<TKey, EnforceParameterMatchesSource<TTarget[TKey], TIndex, ExtractedRequestState, K, "@ReqState", "Koa state field type">>,
        propertyKey: TKey,
        parameterIndex: TIndex
    ) {
        const existingRouteStateVars: RouteStateVarMetaData[] =
            Reflect.getOwnMetadata(routeStateVarMetadataKey, target, propertyKey) || [];
        existingRouteStateVars.push({ parameterIndex, key: stateKey });
        Reflect.defineMetadata(routeStateVarMetadataKey, existingRouteStateVars, target, propertyKey);
    };
}
