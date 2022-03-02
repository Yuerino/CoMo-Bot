import sys
import traceback

import config
from bot import WobBot

client = WobBot(
    description="Development bot for WobBot",
    command_prefix="!"
)

for extension in config.COG_EXTENSIONS:
    # noinspection PyBroadException
    try:
        client.load_extension(extension)
    except Exception:
        print(f'Failed to load extension {extension}.', file=sys.stderr)
        traceback.print_exc()

client.run(config.DISCORD_TOKEN)
