export const IOC_TYPES = {
    Configuration: Symbol("Configuration"),
    WebApp: Symbol("WebApp"),
    LoggerFactory: Symbol("LoggerFactory"),
    LocalCtxStorage: Symbol("LocalCtxStorage"),
    AppStartUpConfig: Symbol("AppStartUpConfig"),
    UrlResolver: Symbol("UrlResolver"),
    RootRouter: Symbol("RootRouter"),
    importerApp: Symbol("importerApp"),
    SqlDdlRunner: Symbol("SqlDdlRunner"),

}

export const IOC_DAL_TYPES = {
    articles: Symbol("ArticlesDal"),
    articleLikes: Symbol("ArticleLikesDal"),
}