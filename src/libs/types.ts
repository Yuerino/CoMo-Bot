import {CoMoBot} from "./CoMoBot";
import {
    ApplicationCommandDataResolvable,
    ClientEvents,
    CommandInteraction,
    CommandInteractionOptionResolver,
    DMChannel,
    Message,
    PartialMessage,
    PartialUser,
    User
} from "discord.js";
import {SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder} from "@discordjs/builders";

export interface CommandRunOptions {
    client: CoMoBot;
    interaction: CommandInteraction;
    args: CommandInteractionOptionResolver;
}

export interface CommandOptions {
    readonly data: Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand"> | SlashCommandSubcommandsOnlyBuilder;
    readonly run: (args: CommandRunOptions) => void;
    readonly commandDMOnly?: boolean;
}

export interface EventOptions<Key extends keyof ClientEvents> {
    readonly event: Key;
    readonly run: (...args: ClientEvents[Key]) => void;
}

export interface DeployCommandOptions {
    readonly commands: ApplicationCommandDataResolvable[];
    readonly guildIDs?: string[];
}

export interface TicketOptions {
    readonly user: User;
    readonly userDMChannel: DMChannel;
    readonly message?: Message;
    readonly createByReaction?: boolean;
}

export interface CreateTicketOptions {
    user: User | PartialUser;
    userDMChannel?: DMChannel;
    message?: Message | PartialMessage;
    readonly createByReaction?: boolean;
}

export interface ReportManagerOptions {
    readonly client: CoMoBot;
    readonly expireTime?: number;
}

export interface CoMoBotConfig {
    readonly botToken: string;
    readonly guildIDs: string[];
    readonly ticketChannelID: string;
    readonly reportEmoji: string;
    onDutyStaffIDs: string[];
    readonly environment: "dev" | "prod";
}