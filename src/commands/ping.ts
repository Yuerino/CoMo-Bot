import {Command} from "../libs/Command";
import {SlashCommandBuilder} from "@discordjs/builders";

export default new Command({
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("replies with Pong"),
    run: async ({interaction}) => {
        await interaction.reply("Pong");
    }
});