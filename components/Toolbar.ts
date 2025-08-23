import { BACKGROUND, markDirty, MIPMAP_LEVELS, MipmapImage } from "./Canvas.js"
import { World } from "../world/World.js"

export enum ToolTypes {
    NS = "NS",
    EW = "EW",
    NE = "NE",
    SE = "SE",
    NW = "NW",
    SW = "SW",
    ERASE = "ERASE",
    BEZIER = "BEZIER"
}

export let selectedTool = ToolTypes.NS

/*
<div id="toolbar">
    <!-- DYNAMIC TOOLS -->
    <span id="tools">
        <img />
        <img />
        <img />
        ...
    </span>

    <!-- STATIC TOOLS -->
    <img />
    <img />
    ...
</div>
*/

export function Toolbar(WORLD: World) {
    const Toolbar = document.getElementById("tools")
    if (!Toolbar) throw new Error("#tools not found - unable to load toolbar")
    
    for (const tool in ToolTypes) {
        const Icon = document.createElement("img")

        if (selectedTool === tool) Icon.classList.add("selected")
        Icon.src = `assets/${tool}.png`
        Icon.addEventListener("click", () => {
            selectedTool = tool as ToolTypes
            Array.from(Toolbar.children).forEach(Btn => {
                Btn.classList.remove("selected")
            });
            Icon.classList.add("selected")
        })

        Toolbar.appendChild(Icon)
    }

    const UploadButton = document.getElementById("upload")
    if (!UploadButton) throw new Error("#upload not found - unable to load upload button")
    UploadButton.onchange = e => {
        const target = e.target as HTMLInputElement;
        for (const file of target.files as FileList) {
            if (file.type === "application/json") { // If file is JSON
                importJSON(file, WORLD)
            } else if (file.type.startsWith("image/")) { // If file is an image
                importImage(file)
            }
        }
    }

    const DownloadButton = document.getElementById("download")
    if (!DownloadButton) throw new Error("#download not found - unable to load download button")
    DownloadButton.onclick = () => {
        const downloadAnchor = document.createElement("a");
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(WORLD.grid));
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "track_layout.json");
        downloadAnchor.click();
    }

    const tickcounter = document.getElementById("tickCounter")
    if (tickcounter) {
        let timeouts: number[] = []
        let intervals: number[] = []
        tickcounter.onmousedown = () => {
            WORLD.gameLoop()
            timeouts.push(setTimeout(() => {
                intervals.push(setInterval(() => {WORLD.gameLoop()}, 50))
            }, 250))
        }
        tickcounter.onmouseup = () => {
            timeouts.forEach(e => clearTimeout(e))
            intervals.forEach(e => clearInterval(e))
        }
        tickcounter.onmouseout = tickcounter.onmouseup
    }
}

function importJSON(file: File, WORLD: World) {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const json = JSON.parse(e.target?.result as string);
            WORLD.import(json);
            markDirty()
        } catch (err) {
            alert(`File ${file.name} contains invalid JSON.`);
        }
    };
    reader.readAsText(file);
}

function importImage(file: File) {
    const regex = /x(-?[0-9]+)_z(-?[0-9]+)/
    const coordinates = regex.exec(file.name)

    let img: MipmapImage = new Image()
    img.src = URL.createObjectURL(file)

    const x = (coordinates === null) ? 0 : Number.parseInt(coordinates[1])
    const z = (coordinates === null) ? 0 : Number.parseInt(coordinates[2])

    img.onload = () => {
        BACKGROUND.push({
            image: generate_mipmaps(img),
            x: x,
            z: z
        })
        markDirty()
    }
}

function generate_mipmaps(img: MipmapImage) {
    const mipmaps: MipmapImage[] = [img]

    for (let i = 0; i < MIPMAP_LEVELS; i++) {
        const canvas = document.createElement("canvas")
        canvas.width = (img as HTMLImageElement).width / 2
        canvas.height = (img as HTMLImageElement).height / 2

        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        mipmaps.push(canvas)
        img = canvas
    }

    return mipmaps
}