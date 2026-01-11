import { injectable } from "inversify";
import config from "config";
import { IConfiguration } from "./configurationInterface";


const booleanRegex = /^\s*(true|1|on)\s*$/i;

@injectable()
export class Configuration implements IConfiguration {
    public get port(): number {
        return config.get("port")
    }

    public get logSilent(): boolean {
        return config.get("log.silent")
    }

    public get logLevel(): string {
        return config.get("log.level")
    }

    public get logPretty(): boolean {
        return config.get("log.pretty")
    }
}