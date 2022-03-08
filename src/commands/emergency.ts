import {SlashCommandBuilder} from "@discordjs/builders";
import {Command} from "../libs/Command";

export default new Command({
    commandDMOnly: true,
    data: new SlashCommandBuilder()
        .setName("emergency")
        .setDescription("delete and report a message"),
    run: async ({client, interaction}) => {
        await client.reportManager.handleCommand(interaction);
    }
});