---
name: dal-table
description: 'Add or modify database tables, indexes, and seed data. Use when the user asks to add a new table, add/remove/alter columns, create indexes, insert default data, or create a new DAL.'
argument-hint: 'Describe the table and columns to add or modify'
---

# DAL Table

## When to Use

- Adding a new database table
- Adding or removing columns from an existing table
- Creating a new DAL class for a table
- Updating the `Database` interface with a new table type

## Architecture Overview

- **[server/src/dal/database.ts](../../server/src/dal/database.ts)**: `Database` interface — one property per table, typed to its table interface
- **[server/src/dal/tables/](../../server/src/dal/tables/)**: Table type files — one file per table, defines the row shape
- **[server/src/dal/interfaces/](../../server/src/dal/interfaces/)**: DAL interfaces — one file per DAL, defines the public methods
- **[server/src/dal/sqlite/](../../server/src/dal/sqlite/)**: DAL implementations — extend `SqlDal`, run Kysely queries, define `setup` migrations
- **[server/src/settings/iocTypes.ts](../../server/src/settings/iocTypes.ts)**: `IOC_DAL_TYPES` — one symbol per DAL
- **[server/src/settings/iocDefinitions.ts](../../server/src/settings/iocDefinitions.ts)**: IoC bindings — binds each DAL symbol to its implementation class

## Step-by-Step: Adding a New Table

### 1. Create the Table Types File
Create `server/src/dal/tables/<tableName>DbTypes.ts`:
```typescript
export interface TagsTable {
    id: number
    name: string
    createdAt: Date
}
```

### 2. Register the Table in `Database`
Add the table to [server/src/dal/database.ts](../../server/src/dal/database.ts):
```typescript
import { TagsTable } from "./tables/tagsDbTypes";

export interface Database {
    articles: ArticlesTable;
    articleLikes: ArticleLikesTable;
    tags: TagsTable;  // <-- new
}
```

### 3. Create the DAL Interface
Create `server/src/dal/interfaces/<tableName>DalInterface.ts`:
```typescript
import { TagsTable } from "../tables/tagsDbTypes";

export interface ITagsDal {
    getTagById(id: number): Promise<TagsTable | null>;
    createTag(tag: Partial<TagsTable>): Promise<void>;
}
```

### 4. Create the DAL Implementation
Create `server/src/dal/sqlite/<tableName>Dal.ts`.

**Critical**: every entry in `setup` must have a key that starts with an ISO-8601 timestamp (use the current time when writing, e.g. `new Date().toISOString()`). Kysely uses these keys as migration names — they must be unique across all DALs and must be added in chronological order so migrations run incrementally.

A single `setup` entry can do multiple things: create the table, add indexes on it, and insert default/seed data — as long as they all belong to the same logical migration unit.

```typescript
import { injectable, injectFromBase } from "inversify";
import { Kysely, sql } from "kysely";
import { ITagsDal } from "../interfaces/tagsDalInterface";
import { TagsTable } from "../tables/tagsDbTypes";
import { SqlDal } from "./base/sqlDal";

@injectable()
@injectFromBase()
export class TagsDal extends SqlDal implements ITagsDal {

    get setup(): Record<string, (db: Kysely<any>) => Promise<void>> {
        return {
            "2026-03-31T12:00:00.000Z-TagsDal": async (db) => {
                // Create table
                await db.schema
                    .createTable("tags")
                    .ifNotExists()
                    .addColumn("id", "integer", (col) => col.primaryKey().notNull())
                    .addColumn("name", "text", (col) => col.notNull())
                    .addColumn("createdAt", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
                    .execute();

                // Add index
                await db.schema
                    .createIndex("tags_name_idx")
                    .ifNotExists()
                    .on("tags")
                    .column("name")
                    .execute();

                // Insert default data
                await db.insertInto("tags")
                    .values([
                        { id: 1, name: "general" },
                        { id: 2, name: "news" },
                    ] as TagsTable[])
                    .onConflict((oc) => oc.doNothing())
                    .execute();
            },
        };
    }

    public async getTagById(id: number): Promise<TagsTable | null> {
        const result = await this.db
            .selectFrom("tags")
            .selectAll()
            .where("tags.id", "=", id)
            .executeTakeFirst();
        return result ?? null;
    }

    public async createTag(tag: Partial<TagsTable>): Promise<void> {
        await this.db
            .insertInto("tags")
            .values(tag as TagsTable)
            .execute();
    }
}
```

### 5. Add to `IOC_DAL_TYPES`
Add a symbol to [server/src/settings/iocTypes.ts](../../server/src/settings/iocTypes.ts):
```typescript
export const IOC_DAL_TYPES = {
    articles: Symbol("ArticlesDal"),
    articleLikes: Symbol("ArticleLikesDal"),
    tags: Symbol("TagsDal"),  // <-- new
}
```

### 6. Bind in `iocDefinitions.ts`
Add the binding to [server/src/settings/iocDefinitions.ts](../../server/src/settings/iocDefinitions.ts):
```typescript
import { ITagsDal } from "../dal/interfaces/tagsDalInterface";
import { TagsDal } from "../dal/sqlite/tagsDal";

thisContainer.bind<ITagsDal>(IOC_DAL_TYPES.tags).to(TagsDal);
```

## Altering an Existing Table

**Before writing a new migration entry, ask the user:**
> "Has this migration already run in any environment (local or deployed)?"

- **If yes** — add a **new** timestamped entry to `setup`. Never modify an existing entry that has already executed.
- **If no** — you can edit the existing entry in place instead of adding a new one, which keeps the migration history clean.

### Adding a new migration entry (migration already ran)
The new key must have a timestamp **after** all existing keys in the project:

```typescript
get setup(): Record<string, (db: Kysely<any>) => Promise<void>> {
    return {
        "2026-03-30T09:25:42.848Z-ArticlesDal": async (db) => { /* original, do not touch */ },
        "2026-03-31T15:00:00.000Z-ArticlesDal-addSlug": async (db) => {
            await db.schema
                .alterTable("articles")
                .addColumn("slug", "text")
                .execute();
        },
    };
}
```

### Editing an existing entry (migration has NOT run yet)
Simply update the entry in place — add/remove columns, indexes, or seed data within the same migration function. No new key needed.

## Key Rules

- **Migration key format**: `"<ISO-8601 timestamp>-<DalClassName>"` — use the actual current time when writing the migration, not a placeholder
- **Ask first**: if the user is altering an existing table, ask whether the migration has run before deciding to add a new entry or edit in place
- **Never edit an existing `setup` entry that has already run** — always add a new timestamped entry in that case
- A single setup entry can include table creation, index creation, and seed/default data inserts
- Keys are compared lexicographically by Kysely's migrator, so the timestamp prefix guarantees correct ordering across all DALs
- Each DAL must be registered in `IOC_DAL_TYPES` and bound in `iocDefinitions.ts`, otherwise `SqlDdlRunner` will not pick up its `setup` migrations
