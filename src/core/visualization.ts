export type VisualizationKind = 'image' | 'pointCloud';
export type VisualizationSource = 'file' | 'scan' | 'watch';
export type ScalarType = 'uint8' | 'uint16' | 'int16' | 'int32' | 'float16' | 'float32' | 'float64' | 'unknown';

export interface VisualizationOrigin {
    providerId: string;
    extractorId: string;
    runtime?: string;
}

export interface VisualizationBase {
    id: string;
    kind: VisualizationKind;
    name: string;
    source: VisualizationSource;
    typeInfo?: string;
    origin?: VisualizationOrigin;
}

export type ChannelOrder = 'gray' | 'rgb' | 'bgr' | 'rgba' | 'bgra' | 'unknown';

export interface ImageVisualization extends VisualizationBase {
    kind: 'image';
    width: number;
    height: number;
    channels: number;
    dtype: ScalarType;
    channelOrder: ChannelOrder;
    encoding: 'base64';
    base64Data: string;
    isFile: boolean;
    mimeType?: string;
}

export interface PointCloudAttribute {
    name: string;
    components: number;
    dtype: ScalarType;
    encoding: 'base64';
    base64Data: string;
}

export interface PointCloudVisualization extends VisualizationBase {
    kind: 'pointCloud';
    pointCount: number;
    positions: PointCloudAttribute;
    colors?: PointCloudAttribute;
    intensity?: PointCloudAttribute;
}

export type VisualizationItem = ImageVisualization | PointCloudVisualization;

export function isImageVisualization(item: VisualizationItem): item is ImageVisualization {
    return item.kind === 'image';
}
