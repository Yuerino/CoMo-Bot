import {ICommandOptions} from "./types";

export class Command {
    constructor(commandOptions: ICommandOptions) {
        Object.assign(this, commandOptions);
    }
}