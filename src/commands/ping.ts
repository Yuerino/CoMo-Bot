import {Command} from "../libs/Command";
import {SlashCommandBuilder} from "@discordjs/builders";

export default new Command({
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("replies with Pong"),
    run: async ({client, interaction}) => {
        await interaction.reply({
            content: `🏓 Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`,
            ephemeral: true
        });
    }
});