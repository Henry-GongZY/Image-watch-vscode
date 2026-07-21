# Architecture

Image Watch separates debugger integration, container extraction, data transformation, state, and rendering. A new runtime or container should be added through a provider or extractor instead of adding branches to the panel.

## Data Flow

```text
VS Code command / Webview message
              |
              v
       ImageWatchPanel
        |           |
        v           v
VisualizationStore  VisualizationService
                           |
                           v
                    ProviderRegistry
                    |              |
                    v              v
             Python provider   C++ provider
             |    |    |           |
             v    v    v           v
          Torch NumPy Pillow   OpenCV Mat
                    |
                    v
            VisualizationItem
                    |
                    v
              Webview renderer
```

## Layers

### Domain protocol

`src/core/visualization.ts` defines the renderer-facing protocol. `VisualizationItem` is a discriminated union with `image` and `pointCloud` variants. Providers must return this protocol and must not call Webview APIs.

Image payloads include scalar type and channel order. This prevents the renderer from assuming that every three-channel value is BGR. Point-cloud payloads use named binary attributes so positions, colors, and intensity can evolve independently.

### Debug access

`src/debug/dapClient.ts` owns Debug Adapter Protocol requests, active-frame selection, evaluation, variable enumeration, and memory reads. Extractors receive this abstraction instead of a VS Code panel.

### Providers and extractors

A provider selects a runtime family and owns scanning policy. An extractor recognizes one container and converts it to a domain item.

- Python provider: Torch Tensor, NumPy ndarray, Pillow image
- C++ provider: OpenCV `cv::Mat`
- Future C++ extractors: `cv::GpuMat`, Eigen matrices, PCL/Open3D point clouds, LibTorch tensors
- Future Rust provider: image and point-cloud containers exposed by Rust debug adapters

Debugger-specific C++ syntax belongs in `src/providers/cpp/cppDialect.ts`. Container layout and memory rules belong in the extractor. Neither belongs in the panel or renderer.

### State and coordination

`VisualizationStore` owns stable scan keys, watch expressions, cleanup, and replacement semantics. `ImageWatchPanel` only coordinates commands, file loading, status messages, and the service/store boundary.

### Rendering

The Webview consumes `VisualizationItem` fields and does not know which debugger or extractor produced them. Image channel conversion uses `channelOrder`. A future point-cloud renderer can consume the `pointCloud` variant without changing Python or C++ providers.

## Adding A Container

1. Implement `ContainerExtractor`.
2. Keep debugger expressions and memory access inside the extractor or runtime dialect.
3. Return an `ImageVisualization` or `PointCloudVisualization`.
4. Register the extractor in its provider.
5. Add pure tests for shape, dtype, layout, and byte-length rules.

For GPU containers, extraction should explicitly copy data to host memory through a debugger expression or helper. The renderer should never be responsible for device transfers.

Shapes such as `N x 3` are inherently ambiguous because they may represent a narrow grayscale image or 3D points. Point-cloud extractors must use container type, variable metadata, or an explicit visualization mode instead of changing the generic image-layout heuristic.
