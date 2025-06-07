# Cartography

A browser-based simulation and editor for minecart tracks inspired by Minecraft.

## Overview

This project aims to provide a one-to-one port of minecart physics into the browser, while also serving as an easy-to-use tool to plan out railway routes in your Minecraft world. It includes a 2D tile-based track editor and a physics engine for simulating cart movement.

## Features

- Import and export track layouts as JSON
- Drag to place or erase rails
- Pan and zoom around the canvas

More to come soon...

## Format

Each rail is stored as a mapping of coordinates to rail shape. Only occupied tiles are stored in the JSON, and empty (air) tiles are ignored.
Valid rail shapes are: NS, EW, NE, SE, NW, SW.

Example JSON format:
```json
{
    "0,0": "SE",
    "1,0": "EW",
    "2,0": "SW",
    "0,1": "NS",
    "2,1": "NS",
    "0,2": "NE",
    "1,2": "EW",
    "2,2": "NW"
}
```
This creates a circular track near the origin.