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
import { IOC_DAL_TYPES, IOC_TYPES } from "./iocTypes";
import { KoaAppRouterBase } from "../koa/koaAppRouterInterface";
import { RootRouter } from "../koa/rootRouter";
import { SqlDdlRunner } from "../dal/sqlite/base/sqlDdlRunner";
import { IArticlesDal } from "../dal/interfaces/articlesDalInterface";
import { ArticlesDal } from "../dal/sqlite/articlesDal";
import { IArticleLikesDal } from "../dal/interfaces/articleLikesDalInterface";
import { ArticleLikesDal } from "../dal/sqlite/articleLikesDal";

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

//DAL bindings:
thisContainer.bind(IOC_TYPES.SqlDdlRunner).to(SqlDdlRunner);
thisContainer.bind<IArticlesDal>(IOC_DAL_TYPES.articles).to(ArticlesDal);
thisContainer.bind<IArticleLikesDal>(IOC_DAL_TYPES.articleLikes).to(ArticleLikesDal);


//Those are also needed to work with the  @Controller decorator:

export const iocContainer = thisContainer;