import { SqlErrorCode } from "../../sqlErrorsCodes";

export function getSqliteErrorCode(error: Error & { code: string }) {
    switch (error.code) {
        case "SQLITE_CONSTRAINT_UNIQUE":
        case "SQLITE_CONSTRAINT_PRIMARYKEY":
            return SqlErrorCode.uniqueKey;
    }

    return SqlErrorCode.unknown;
}
