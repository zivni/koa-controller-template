import { Container } from "inversify";
import "reflect-metadata"; //should be imported only once according to docs.
import { AppStartupConfig } from "../appStartupConfig";

import { IConfiguration } from "./configurationInterface";
import { Configuration } from "./configuration";
import { KoaApp } from "../koa/koaApp";
import { UrlResolver } from "../koa/urlResolver";
import { LocalCtxStorage } from "../localCtxStorage";
import { LoggerFactory } from "../logger/logger";
import { ILoggerFactory } from "../logger/loggerInterface";
import { IWebApp } from "../webAppInterface";
import { IOC_TYPES } from "./iocTypes";
import { KoaAppRouterBase } from "../koa/koaAppRouterInterface";
import { RootRouter } from "../koa/rootRouter";

// We need to set skipBaseClassChecks: true for the @Controller decorator wo work.
//see https://github.com/inversify/InversifyJS/blob/master/wiki/inheritance.md#workaround-e-skip-base-class-injectable-checks
const thisContainer = new Container({ defaultScope: "Singleton", autobind: true });

thisContainer.bind<IConfiguration>(IOC_TYPES.Configuration).to(Configuration);
thisContainer.bind<IWebApp>(IOC_TYPES.WebApp).to(KoaApp);
thisContainer.bind<UrlResolver>(IOC_TYPES.UrlResolver).to(UrlResolver);
thisContainer.bind<KoaAppRouterBase>(IOC_TYPES.RootRouter).to(RootRouter);
thisContainer.bind(IOC_TYPES.LocalCtxStorage).to(LocalCtxStorage)
thisContainer.bind(IOC_TYPES.AppStartUpConfig).to(AppStartupConfig)

thisContainer.bind<ILoggerFactory>(IOC_TYPES.LoggerFactory).to(LoggerFactory)

//Those are also needed to work with the  @Controller decorator:

export const iocContainer = thisContainer;