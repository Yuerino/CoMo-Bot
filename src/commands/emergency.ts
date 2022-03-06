import {SlashCommandBuilder} from "@discordjs/builders";
import {Command} from "../libs/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName("emergency")
        .setDescription("report a message"),
    run: async ({interaction}) => {
        await interaction.reply("Unimplemented command");
    }
});