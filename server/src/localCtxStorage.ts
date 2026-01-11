import { injectable } from 'inversify';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ILocalCtxStorage, ILocalCtxStorageProps } from './LocalCtxStorageInterface';

@injectable()
export class LocalCtxStorage implements ILocalCtxStorage, ILocalCtxStorageProps {
    public readonly ctxStorage: AsyncLocalStorage<ILocalCtxStorageProps>
    constructor() {
        this.ctxStorage = new AsyncLocalStorage<ILocalCtxStorageProps>();
    }
    public get requestId() {
        return this.ctxStorage.getStore()?.requestId || "__no_request_id__"
    }

}