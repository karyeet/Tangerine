# Tangerine

A Node.js Discord music bot made using Discord.js & lavalink.

Features:
- Multiple Sources through Lavalink and Lavasrc: YouTube, Spotify, Deezer, Soundcloud, etc
- Basic functions: join, leave, loop, play, skip, remove from queue
- Interactive queue command
- Supports playlists/albums, the entire playlist is shown as a single item until it reaches the front of the queue

Todo:
- seek
- expandplaylist command
- Playlist/album search
- Docker Container
- Tests
- Improve readme

## Setup:

You'll need Node v20 or greaterm, NPM, and a Lavalink node with the Lavasrc plugin and installed and setup.

1. Clone or download the source: 

    ```git clone https://github.com/karyeet/Tangerine```

2. Move into the folder:

    ```cd Tangerine```

3. Install dependencies: 

    ```npm install```

4. Compile typescript: 

    ```npm run compile```

5. Copy the example config and rename to config.json

    ```cp config.json.example config.json```
6. Edit and fill out config.json in your favorite text editor

7. Start the bot

    ```node .```

    
