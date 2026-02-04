# SoundArt

An audio-reactive WebGL visualizer built with SvelteKit.

![SoundArt Screenshot](static/screenshot.png)

## Features

-   **Real-time Audio Analysis**: Visuals react instantly to music and microphone input.
-   **High Performance**: Uses a Web Worker and OffscreenCanvas to keep the UI smooth (60fps).
-   **Layer System**: Combine multiple visual effects like Kaleidoscope, Mandala, and Starfield.
-   **Auto Mode**: Intelligent randomizer that changes visuals to the beat.
-   **Device Optimization**: Automatic presets for Phones, Laptops, and Desktops.

## Quick Start

Use the **Makefile** for all common tasks (build, dev, preview). No local JS toolchain required—Docker is used under the hood.

1.  Clone the repo:

    ```bash
    git clone https://github.com/ayedaemon/soundart.git
    cd soundart
    ```

2.  **(First time only)** Install dependencies:

    ```bash
    make init
    ```

3.  Start the HTTPS dev server (recommended for mic + mobile testing):

    ```bash
    make dev
    ```

    Open `https://localhost:5173` (accept the self-signed certificate warning).

4.  Build and preview the production static site:

    ```bash
    make build
    make preview
    ```

    Then open `http://localhost:4173`.

### Makefile commands

| Command       | Description                                      |
| ------------- | ------------------------------------------------- |
| `make init`   | Install npm dependencies (first-time setup)      |
| `make dev`    | HTTPS dev server with hot reload                 |
| `make build`  | Build static files to `build/`                    |
| `make preview`| Preview production build (runs `build` if needed)|
| `make clean`  | Remove build artifacts and Docker images         |
| `make help`   | Show this summary                                |

Production deploys are handled by GitHub Actions → GitHub Pages.

## Tech Stack

-   **Framework**: SvelteKit
-   **Language**: TypeScript
-   **Graphics**: WebGL 2.0 (Custom Engine)
-   **Build**: Vite

## License

MIT
