export function getImageRendererHelpersScript(): string {
    return /* js */`
function pixelChannelValues(img, r, g, b, a) {
  const channels = img && !img.isFile ? img.channels : 3;
  if (channels === 1) return [r];
  const order = img && img.channelOrder ? img.channelOrder : 'bgr';
  if (channels === 4) return order === 'rgba' ? [r, g, b, a] : [b, g, r, a];
  return order === 'rgb' || order === 'rgba' ? [r, g, b] : [b, g, r];
}

function fillRgba(px, raw, ch, channelOrder) {
  const n = px.length >>> 2;
  for (let i = 0; i < n; i++) {
    if (ch === 1) { px[i*4]=px[i*4+1]=px[i*4+2]=raw[i]; px[i*4+3]=255; }
    else if (ch === 3) {
      if (channelOrder === 'rgb') {
        px[i*4]=raw[i*3]; px[i*4+1]=raw[i*3+1]; px[i*4+2]=raw[i*3+2];
      } else {
        px[i*4]=raw[i*3+2]; px[i*4+1]=raw[i*3+1]; px[i*4+2]=raw[i*3];
      }
      px[i*4+3]=255;
    }
    else if (ch === 4) {
      if (channelOrder === 'rgba') {
        px[i*4]=raw[i*4]; px[i*4+1]=raw[i*4+1]; px[i*4+2]=raw[i*4+2];
      } else {
        px[i*4]=raw[i*4+2]; px[i*4+1]=raw[i*4+1]; px[i*4+2]=raw[i*4];
      }
      px[i*4+3]=raw[i*4+3];
    }
  }
}
`;
}
