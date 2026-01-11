import { AsyncLocalStorage } from 'node:async_hooks';

export interface ILocalCtxStorageProps {
    readonly requestId: string
}

export interface ILocalCtxStorage {
    readonly ctxStorage: AsyncLocalStorage<ILocalCtxStorageProps>
}