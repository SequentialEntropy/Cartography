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
    <img />
    <img />
    <img />
    ...
</div>
*/

export function Toolbar(WORLD: World) {
    const Toolbar = document.getElementById("toolbar")

    if (!Toolbar) throw new Error("#toolbar not found - unable to load toolbar")
    
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

    const Label = document.createElement("label")
    Label.htmlFor = "upload"
    Toolbar.appendChild(Label)

    const UploadIcon = document.createElement("img")
    UploadIcon.src = "assets/bundle.png"
    Label.appendChild(UploadIcon)

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

    const DownloadIcon = document.createElement("img")
    const downloadAnchor = document.createElement("a");
    DownloadIcon.src = "assets/bundle_open_front.png"
    DownloadIcon.addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(WORLD.grid));
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "track_layout.json");
        downloadAnchor.click();
    })
    Toolbar.appendChild(DownloadIcon)

    const fpsMeter = document.createElement("span")
    fpsMeter.id = "fpsMeter"
    Toolbar.appendChild(fpsMeter)
}