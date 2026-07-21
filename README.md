# Image Watch for VS Code

Inspect image-like values while a debugger is paused. The extension currently supports file images, NumPy arrays, Pillow images, PyTorch tensors, and OpenCV `cv::Mat` values exposed by compatible C++ debug adapters.

## Features

- Scan supported variables in the active stack frame
- Add persistent watch expressions
- Open from the debug toolbar or with `Ctrl+Shift+I`
- Zoom, pan, inspect pixels, link same-sized views, show grayscale histograms, and apply a heatmap
- Optional automatic scan at the first breakpoint of a debug session
- Package and install the local extension with `./pack.ps1`

## Development

```powershell
npm install
npm run compile
npm run lint
npm test
./pack.ps1
```

Press `F5` in VS Code to start an Extension Development Host.

## Architecture

Debugger access, container extraction, data transformation, state management, and rendering are separate layers. See [docs/architecture.md](docs/architecture.md) for the module boundaries and the process for adding new containers or runtimes.

The domain protocol already reserves a point-cloud visualization type. Planned extractors include `cv::GpuMat`, Eigen, LibTorch, PCL/Open3D, and additional PyTorch tensor layouts. A Rust provider can be added later without changing the panel or existing renderers.

## License

MIT
