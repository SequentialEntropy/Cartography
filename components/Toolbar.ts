import { markDirty } from "./Canvas.js"
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
        const file = (target.files as FileList)[0];
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const json = JSON.parse(e.target?.result as string);
                WORLD.import(json);
                markDirty()
            } catch (err) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
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
}