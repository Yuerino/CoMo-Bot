import {Event} from "../libs/Event";
import {comobot} from "../comobot";
import {CommandInteractionOptionResolver} from "discord.js";

export default new Event(comobot, "interactionCreate", async (interaction): Promise<void> => {
    if (!interaction.isCommand()) return;
    const command = comobot.commands.get(interaction.commandName);
    if (!command) return;
    command.run({
        client: comobot,
        interaction: interaction,
        args: interaction.options as CommandInteractionOptionResolver
    });
})