const apiPrefix = "/restricted";

export const getArticleUrl = (id: string, date: Date) => `${apiPrefix}/articles/get/decorator/${id}/${date.toISOString()}`;