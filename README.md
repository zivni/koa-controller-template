# Koa Controller Template
This is a sample template to run a Koa js app for JSON API servicing using a controller.

The template also using [InversifyJS](https://inversify.io/) for [IoC](https://en.wikipedia.org/wiki/Inversion_of_control) in the project.

The project is written in Typescript.

## Why
First, I don't like frameworks: They are too complex, too large, and it takes a lot of time to learn them.  

Secondly, I like to control my code, make changes when I need them. I do use libraries as I can generally swap them quite easily (if not in the current project, then in a new one).

And why controllers? they make the writing of API route handling code less redundant and let the programer focus on business logic and not repeat the same code for every route.

## How to run 
1. Copy the code to a new project.
2. Open it in VsCode.
3. Choose "Reopen in container" (dev containers are great)
4. In the terminal run `cd /workspaces/koa-controller-template/frontend && yarn run build-local` (This creates files from the frontend example project so we'll see some UI)
5. In the debug view, choose "server watch debug" ("server once debug" if you need to debug startup code before the debugger attaches in the watch mode)
6. See in the ports tab what address is mapped to port 4002, and open that address in your browser.  
Pressing the "get data" button will call the server to fetch some data.

## Project structure
### Main folders
There are two main folders in the template: 
1. `server` - server side
2. `frontend` - a bare react UI that is bundled with vite 

There is also an `integrationInterfaces` folder that is used for interfaces and types that are used by both the server and the frontend.

### The frontend structure.
The main entry point is `frontend/src/main.tsx`

### The server structure
#### Server entry point
The server entry point is `server/src/app.ts`.

It shows how to use the `NODE_APP_INSTANCE` environment variable to run different server side applications that use a common code (e.g. backend/frontend sites or workers). The template just implemented the `site` app.

If you need to run more server apps, just add more configurations to the `.vscode/launch.json` and give them a different `NODE_APP_INSTANCE` value.

#### Koa app (site)
The `site` app runs the `server/src/koa/koaApp.ts` which uses the `RootRouter` as the main router (uses the [@koa/router](https://www.npmjs.com/package/@koa/router) package).

Each controller is connected to a router which group similar controllers, The grouping could be done logically, but more important by the use. For example public controllers vs restricted controllers, so the logic to handle authorization should be in the router middleware (by using `ctx.throw(401, "need to sign in")`)

Look at `server/src/controllers/restricted/restrictedRouter.ts` For and example. It shows who to bind the `articlesController` to the router using the `bindControllerToParentRouter` function.

### The Controller
The controller is where you define your API endpoints and business logic. It uses decorators to map routes and inject parameters, keeping the code clean and focused.

#### Basic Usage
1.  **Define a Class**: Decorate a class with `@Controller(prefix)`. The prefix is pre-pended to all route paths defined in the class.
2.  **Define Routes**: Decorate methods with `@Route(path, options)`.

**Example:**
```typescript
@Controller('/articles')
export class ArticlesController {
    // Basic GET request
    @Route("/get/plain/:id")
    public async getArticle({ id }: { id: string }, requestOptions: RequestOptions) {
        return { id, title: "Sample Article" };
    }
}
```

#### Parameter Decorators
Instead of accessing the params and body by argument position, you can inject them directly into your method arguments:

*   `@RouteParam("name")`: Extracts a URL parameter. It automatically handles type conversion for `Number` and `Date`.
*   `@ReqBody`: Injects the request body (typically for POST requests).
*   `@ReqOption("key")`: Injects a property from `RequestOptions` (e.g., `ctx` for the full context, or helper functions).
*   `@ReqState("key")`: Injects a value from `ctx.state` (useful for data passed by middleware, like user details).

**Example with Decorators:**
```typescript
@Route("/post/decorator/:id")
public async postArticle(
    @RouteParam("id") id: number,          // auto-converted to number
    @ReqBody body: any,                    // request body
    @ReqState("userId") userId: string     // from ctx.state.userId
) {
    return { id, userId, receivedData: body };
}
```

#### Route Options
The `@Route` decorator accepts an options object as the second argument:
*   `method`: HTTP method, `"get"` (default) or `"post"`.
*   `routeName`: Assigns a name to the route. Required if using access token reloading hooks.
*   `responseContentType`: Sets the `Content-Type` header (e.g., `"application/json"`).
*   `headers`: Object containing static response headers.
*   `disableBodyDateConversion`: If `true`, disables the automatic conversion of ISO 8601 date strings in the body to `Date` objects.
*   `postFileFieldName`: If set, handles `multipart/form-data` file uploads using `multer`. The file is available in `ctx.req.file`.
*   `returnType`: Controls how the return value is handled.
    *   `basic` (default): Returns the object as the response body (JSON).
    *   `stream`: For streaming responses. The handler should write to the stream provided in `RequestOptions`.
    *   `descriptionObject`: Expects the method to return a `RouteMethodReturnDescription` object. This allows dynamic setting of:
        *   `data`: The response body.
        *   `httpStatus`: HTTP status code (e.g., 201, 404).
        *   `headers`: Dynamic response headers.
        *   `contentType`: Specific content type for this response.

#### Controller Options & Composition
The `@Controller` decorator takes an optional configuration object as a second argument:

```typescript
@Controller('/api/users', {
    middlewares: [someAuthMiddleware],  // Apply Koa middleware to all routes in this controller
    controllersIocTypes: [IOC_TYPES.UserCommentsController] // Bind child controllers
})
```

*   **middlewares**: An array of Koa middlewares that run before any route in this controller.
*   **controllersIocTypes**: An array of IoC symbols (from `iocDefinitions.ts`). This allows you to nest controllers (e.g., `/api/users/:id/comments`). The child controller must be registered in the IoC container.

#### Advanced Features
*   **Automatic Date Parsing**: JSON request bodies have ISO date strings automatically converted to `Date` objects unless `disableBodyDateConversion` is set.
*   **Streaming**: Set `returnType: ControllerRouteReturnType.stream` to stream data.
*   **Access Control**: Middleware can be applied at the router level (see `RestrictedRouter.ts`) to populate `ctx.state` (e.g., auth info), which can then be injected into controllers via `@ReqState`.
*   **IoC Integration**: The `Controller` decorator works with InversifyJS, allowing you to inject services (like `ILoggerFactory`) into the controller's constructor.
