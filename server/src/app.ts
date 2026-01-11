import { iocContainer } from './settings/iocDefinitions'; //must be first import of our code
import { IOC_TYPES } from './settings/iocTypes';
import { IWebApp } from './webAppInterface';
import { AppStartupConfig } from './appStartupConfig';
import { ILoggerFactory } from './logger/loggerInterface';

process.env.TZ = "Asia/Jerusalem";

const logger = iocContainer.get<ILoggerFactory>(IOC_TYPES.LoggerFactory).getNewLogger(null, "app");

let appInstanceType: typeof IOC_TYPES.WebApp;
switch (process.env.NODE_APP_INSTANCE) {
    case "site":
        appInstanceType = IOC_TYPES.WebApp;
        logger.info("Starting app", { app: "site" });
        break;
    case "migrations":
        appInstanceType = IOC_TYPES.importerApp;
        logger.info("Starting app", { app: "importer" });
        break;
    default:
        logger.error("NODE_APP_INSTANCE must be either 'site' or 'importer'");
        throw new Error("NODE_APP_INSTANCE must be either 'site' or 'importer'");
}

const appStartupConfig = iocContainer.get<AppStartupConfig>(IOC_TYPES.AppStartUpConfig);
const webApp = iocContainer.get<IWebApp>(appInstanceType);

appStartupConfig.dbSetup().then(async () => {

    webApp.start();
});
