import {CoMoBot} from "./CoMoBot";
import {ApplicationCommandDataResolvable, CommandInteraction, CommandInteractionOptionResolver} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";

interface CommandRunOptions {
    client: CoMoBot;
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

export interface CoMoBotConfig {
    readonly botToken: string,
    readonly guildIDs: string[],
    readonly ticketChannelID: string,
    readonly reportEmoji: string,
    readonly environment: "dev" | "prod"
}