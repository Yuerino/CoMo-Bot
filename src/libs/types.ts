import {WobBot} from "./WobBot";
import {ApplicationCommandDataResolvable, CommandInteraction, CommandInteractionOptionResolver} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";

interface CommandRunOptions {
    client: WobBot;
    interaction: CommandInteraction;
    args: CommandInteractionOptionResolver;
}

type CommandRunFunction = (args: CommandRunOptions) => void;

export interface ICommandOptions {
    readonly data: SlashCommandBuilder,
    readonly run: CommandRunFunction
}

export interface IDeployCommandOptions {
    readonly commands: ApplicationCommandDataResolvable[],
    readonly guildIDs?: string[]
}

export interface WobBotConfig {
    readonly botToken: string,
    readonly guildIDs: [],
    readonly environment: "dev" | "prod"
}