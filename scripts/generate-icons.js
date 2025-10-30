const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建 SVG 图标
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#10b981"/>
  <path d="M ${size * 0.25} ${size * 0.5} L ${size * 0.4} ${size * 0.65} L ${size * 0.75} ${size * 0.3}"
        stroke="white"
        stroke-width="${size * 0.15}"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"/>
</svg>
`;

const publicDir = path.join(__dirname, '..', 'public');

async function generateIcons() {
  try {
    // 生成 192x192 图标
    const svg192 = Buffer.from(createSVG(192));
    await sharp(svg192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ 生成 icon-192.png');

    // 生成 512x512 图标
    const svg512 = Buffer.from(createSVG(512));
    await sharp(svg512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ 生成 icon-512.png');

    console.log('\n图标生成成功！');
  } catch (error) {
    console.error('生成图标失败:', error);
    process.exit(1);
  }
}

generateIcons();
