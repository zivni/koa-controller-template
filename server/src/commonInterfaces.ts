import { ParameterizedContext, DefaultContext } from "koa";
import { Readable } from "node:stream";

export interface RequestState {
    userId?: string;
    stamp?: number;
}

export interface RequestOptions {
    stream?: Readable
    abortController?: AbortController
    ctx?: ParameterizedContext<RequestState, DefaultContext>
    testBoolQuery?: (queryName: string) => boolean
}

declare module 'koa' {
    interface DefaultState extends RequestState { }
}


export type Stringify<T> = {
    readonly [P in keyof T]: string;
};

export type Numberify<T> = {
    readonly [P in keyof T]: number;
};

// https://github.com/Microsoft/TypeScript/issues/12936#issuecomment-2088768988
export type ShallowExact<T, U extends T> = { [Key in keyof U]: Key extends keyof T ? U[Key] : never };
