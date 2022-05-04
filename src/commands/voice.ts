import {Command} from "../libs/Command";
import {SlashCommandBuilder} from "@discordjs/builders";

export default new Command({
    data: new SlashCommandBuilder()
        .setName("voice")
        .setDescription("Commands for voice channel")
        .addSubcommand(command => command
            .setName("create")
            .setDescription("Create a new voice channel")
            .addStringOption(option => option
                .setName("name")
                .setDescription("Name for the voice channel")
                .setRequired(true)))
        .addSubcommand(command => command
            .setName("set_category")
            .setDescription("Set category channel for voice")
            .addChannelOption(option => option
                .setName("category_channel")
                .setDescription("The category channel for voice")
                .setRequired(true)))
        .addSubcommand(command => command
            .setName("close")
            .setDescription("Close your voice channel")
            .addChannelOption(option => option
                .setName("voice_channel")
                .setDescription("close this voice channel (Admin only option)")))
        .addSubcommand(command => command
            .setName("change_name")
            .setDescription("Change name of your voice channel")
            .addStringOption(option => option
                .setName("name")
                .setDescription("New name for the voice channel")
                .setRequired(true))
            .addChannelOption(option => option
                .setName("voice_channel")
                .setDescription("set name of this voice channel (Admin only option)")))
        .addSubcommand(command => command
            .setName("change_limit")
            .setDescription("Change user amount limit of your voice channel")
            .addIntegerOption(option => option
                .setName("limit")
                .setDescription("amount of user limit of the voice channel")
                .setMinValue(2)
                .setMaxValue(42)
                .setRequired(true))
            .addChannelOption(option => option
                .setName("voice_channel")
                .setDescription("set the user amount limit for this voice channel (Admin only option)"))),
    run: async ({client, interaction}) => {
        await client.voiceManager.handleCommand(interaction);
    }
});