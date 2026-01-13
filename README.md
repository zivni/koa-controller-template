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
4. In the debug view, choose "server watch debug" ("server once debug" if you need to debug startup code before the debugger attaches in the watch mode)
5. See in the ports tab what address is mapped to port 4002, and open that address in your browser.  
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