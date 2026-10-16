import JSZip from 'jszip';
import { getPluginFiles } from '../data/pluginCodeTemplates';
import { OjsVersion } from '../types/ojs';

export async function generateOjsPluginZip(version: OjsVersion = 'universal'): Promise<Blob> {
  const zip = new JSZip();
  const files = getPluginFiles(version);

  // OJS Generic Plugins live in plugins/generic/maasRemover/
  const rootFolder = zip.folder('maasRemover');
  if (!rootFolder) {
    throw new Error('Failed to create plugin folder inside archive');
  }

  for (const file of files) {
    // Relative to maasRemover/
    const subPath = file.path.replace(/^maasRemover\//, '');
    rootFolder.file(subPath, file.code);
  }

  // Also include a quick install info helper in the root
  zip.file('INSTALL_INSTRUCTIONS.txt', `MAAS REMOVER PLUGIN FOR OPEN JOURNAL SYSTEMS (OJS)
=====================================================
Target Version: ${version.toUpperCase()}
Generated on: ${new Date().toISOString()}

INSTALLATION INSTRUCTIONS:
1. Copy the 'maasRemover' folder into your OJS installation at:
   [ojs_root]/plugins/generic/maasRemover/

2. Check file permissions:
   Ensure your web server (e.g. www-data, apache, nginx) has read permissions.
   chown -R www-data:www-data plugins/generic/maasRemover/
   chmod -R 755 plugins/generic/maasRemover/

3. In OJS Admin:
   Navigate to: Settings > Website > Plugins > Installed Plugins
   Find 'MAAS Remover' under Generic Plugins and check the box to ENABLE it.

4. Usage:
   - Web GUI: Click 'Settings' next to MAAS Remover in the plugin list.
   - CLI: Run 'php plugins/generic/maasRemover/tools/maas_remover_cli.php --batch=100'

For full details, read maasRemover/README.md
`);

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return content;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
