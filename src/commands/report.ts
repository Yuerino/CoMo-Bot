import {SlashCommandBuilder} from "@discordjs/builders";
import {Command} from "../libs/Command";
import {DiscordAPIError, MessageEmbed} from "discord.js";

export default new Command({
    commandDMOnly: true,
    data: new SlashCommandBuilder()
        .setName("report")
        .setDescription("report a message"),
    run: async ({client, interaction}) => {
        try {
            await client.reportManager.handleCommand(interaction);
        } catch (err) {
            if (err instanceof DiscordAPIError && err.code === 50007) {
                await interaction.reply({
                    embeds: [new MessageEmbed().setTitle("Error").setDescription("Your private chat is disabled! Please enable it in Privacy Settings and try again.")],
                    ephemeral: true
                })
            } else {
                throw(err);
            }
        }
    }
});