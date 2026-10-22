// Reaplica o ícone adaptativo full-bleed (fundo sólido + gato na zona segura).
// O capacitor-assets gera um XML com inset que deixa bordas transparentes na máscara.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');

const adaptiveIcon = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

await writeFile(path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher.xml'), adaptiveIcon);
await writeFile(path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), adaptiveIcon);
await writeFile(
  path.join(resDir, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#121212</color>
</resources>
`
);

console.log('Ícone adaptativo ajustado (fundo #121212, full-bleed).');
