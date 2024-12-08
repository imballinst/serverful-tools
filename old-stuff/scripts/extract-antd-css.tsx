// scripts/genAntdCss.tsx
import { extractStyle } from '@ant-design/static-style-extract';
import fs from 'fs';

const outputPath = './app/antd.min.css';

const css = extractStyle();

fs.writeFileSync(outputPath, css);
