# TODO
- Texture support
    - Support for varying size (including oversized) minecart textures
    - Support for varying size (including oversized) rail textures
    - Support for connected textures (ctm/optifine) for rails

- Cubic bezier curve tool
    - Vector and raster mode
    - Chainable beziers
    - Lock control points with another

- Ruler tool

- Import Xaero's Minimap images

- Minecart tool
    - Click, drag and release to place minecart with initial velocity
        - Option to invert drag direction
    - Tab to cycle through active minecarts
        - Locks canvas to follow minecart
        - Esc to unfollow minecart
        - Delete/Backspace to remove minecart
        - W and S to provide player acceleration to minecarts
    - Skip ticking if no minecarts present
        - Reset tick counter to 0 when there are no active minecarts

- Profiler for measuring curve smoothing performance (cumulative sum of velocity deltaAngle per tick along path, lower = better & smoother, higher = worse & rougher)

- Deploy project on netlify, with github actions to auto build-and-deploy on new commit