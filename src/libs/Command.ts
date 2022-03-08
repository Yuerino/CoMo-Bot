import {CommandOptions, CommandRunOptions} from "./types";
import {SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder} from "@discordjs/builders";

export class Command {
    public readonly data: Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand"> | SlashCommandSubcommandsOnlyBuilder;
    public readonly run: (args: CommandRunOptions) => void;
    private readonly commandDMOnly: boolean = false;

    constructor(commandOptions: CommandOptions) {
        this.data = commandOptions.data;
        this.run = commandOptions.run;
        if (commandOptions.commandDMOnly) this.commandDMOnly = commandOptions.commandDMOnly;
    }

    public isDMOnly() {
        return this.commandDMOnly;
    }
}