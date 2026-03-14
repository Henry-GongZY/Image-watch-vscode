const fs = require('fs');
try {
  const src = fs.readFileSync('out/extension.js', 'utf8');
  
  const checks = [
    ['exports.activate    ', src.includes('exports.activate')],
    ['exports.deactivate  ', src.includes('exports.deactivate')],
    ['postMessage 架构    ', src.includes('postMessage')],
    ['Buffer base64       ', src.includes('base64')],
    ['numpy 提取          ', src.includes('tobytes')],
    ['Watch List          ', src.includes('watchList')],
    ['WebView HTML        ', src.includes('<!DOCTYPE html>')],
    ['Canvas 渲染         ', src.includes('putImageData')],
    ['BGR 转换            ', src.includes('raw[i*3+2]')],
    ['无 Uint8Array 直序  ', !src.includes('JSON.stringify(this.images')],
  ];

  checks.forEach(([name, ok]) => console.log((ok ? '✅' : '❌') + ' ' + name));

  const htmlStart = src.indexOf('<!DOCTYPE html>');
  const htmlEnd   = src.lastIndexOf('</html>') + 7;
  console.log('\nHTML 片段长度:', htmlEnd - htmlStart, '字符');
  console.log('out/extension.js 总大小:', src.length, '字符');
  console.log('\n所有关键特征检查完毕。');
} catch(e) { console.error('Error:', e.message); }
