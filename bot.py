from discord.ext import commands

import config


class WobBot(commands.Bot):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

        self.config = config

    async def on_ready(self) -> None:
        print(f"Bot logged in as {self.user}")