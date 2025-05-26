import { GRID, markDirty } from "./Canvas.js"

export const ToolTypes = Object.freeze({
    NS: "NS",
    EW: "EW",
    NE: "NE",
    SE: "SE",
    NW: "NW",
    SW: "SW",
    ERASE: "ERASE",
    BEZIER: "BEZIER"
})

export let selectedTool = ToolTypes.NS

/*
<div id="toolbar">
    <img />
    <img />
    <img />
    ...
</div>
*/

export function Toolbar() {
    const Toolbar = document.getElementById("toolbar")
    
    for (const tool in ToolTypes) {
        const Icon = document.createElement("img")

        if (selectedTool === tool) Icon.classList.add("selected")
        Icon.src = `assets/${tool}.png`
        Icon.addEventListener("click", () => {
            selectedTool = tool
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
    UploadButton.addEventListener("change", e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const json = JSON.parse(e.target.result);
                Object.assign(GRID, json);
                markDirty()
            } catch (err) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);

    })
}