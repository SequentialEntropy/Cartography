import { markDirty } from "./Canvas.js";
export var ToolTypes;
(function (ToolTypes) {
    ToolTypes["NS"] = "NS";
    ToolTypes["EW"] = "EW";
    ToolTypes["NE"] = "NE";
    ToolTypes["SE"] = "SE";
    ToolTypes["NW"] = "NW";
    ToolTypes["SW"] = "SW";
    ToolTypes["ERASE"] = "ERASE";
    ToolTypes["BEZIER"] = "BEZIER";
})(ToolTypes || (ToolTypes = {}));
export let selectedTool = ToolTypes.NS;
/*
<div id="toolbar">
    <img />
    <img />
    <img />
    ...
</div>
*/
export function Toolbar(WORLD) {
    const Toolbar = document.getElementById("toolbar");
    if (!Toolbar)
        throw new Error("#toolbar not found - unable to load toolbar");
    for (const tool in ToolTypes) {
        const Icon = document.createElement("img");
        if (selectedTool === tool)
            Icon.classList.add("selected");
        Icon.src = `assets/${tool}.png`;
        Icon.addEventListener("click", () => {
            selectedTool = tool;
            Array.from(Toolbar.children).forEach(Btn => {
                Btn.classList.remove("selected");
            });
            Icon.classList.add("selected");
        });
        Toolbar.appendChild(Icon);
    }
    const Label = document.createElement("label");
    Label.htmlFor = "upload";
    Toolbar.appendChild(Label);
    const UploadIcon = document.createElement("img");
    UploadIcon.src = "assets/bundle.png";
    Label.appendChild(UploadIcon);
    const UploadButton = document.getElementById("upload");
    if (!UploadButton)
        throw new Error("#upload not found - unable to load upload button");
    UploadButton.onchange = e => {
        const target = e.target;
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            var _a;
            try {
                const json = JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                WORLD.import(json);
                markDirty();
            }
            catch (err) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    };
    const DownloadIcon = document.createElement("img");
    const downloadAnchor = document.createElement("a");
    DownloadIcon.src = "assets/bundle_open_front.png";
    DownloadIcon.addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(WORLD.grid));
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "track_layout.json");
        downloadAnchor.click();
    });
    Toolbar.appendChild(DownloadIcon);
    const fpsMeter = document.createElement("span");
    fpsMeter.id = "fpsMeter";
    Toolbar.appendChild(fpsMeter);
}
