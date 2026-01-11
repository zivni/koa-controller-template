export class ApiError extends Error {
    constructor(message: string, public readonly errorCode: string, private parms?: { [key: string]: any }) {
        super(message);
    }

    public toJSON() {
        return ({
            message: this.message,
            errorCode: this.errorCode,
            parms: this.parms,
        })
    }
}

export class AbortApiError extends Error { }

export class JsonParseError extends Error {
    constructor(public parsedString: string, causeError: Error) {
        super("Error parsing JSON ", { cause: causeError })
    }
}