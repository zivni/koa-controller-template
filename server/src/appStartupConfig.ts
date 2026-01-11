import dayjs from "dayjs"
import duration from "dayjs/plugin/duration";
import utc from 'dayjs/plugin/utc';
import minMax from 'dayjs/plugin/minMax'
import { inject, injectable } from "inversify";
import { ILogger, ILoggerFactory } from "./logger/loggerInterface";

import { IOC_TYPES } from "./settings/iocTypes";

//days.js configuration
dayjs.extend(duration);
dayjs.extend(utc)
dayjs.extend(minMax);

@injectable()
export class AppStartupConfig {
    constructor(
        @inject(IOC_TYPES.LoggerFactory) loggerFactory: ILoggerFactory,
    ) {
        this.logger = loggerFactory.getNewLogger();
    }
    private logger: ILogger


    public async dbSetup() {

    }
}