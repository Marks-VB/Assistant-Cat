import { defineConfig, loadEnv, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

const SITEMAP_PAGES = [
  { path: '/', changefreq: 'monthly', priority: '1.0' },
  { path: '/termos.html', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacidade.html', changefreq: 'yearly', priority: '0.3' }
] as const;

/**
 * Valida e normaliza o domínio canônico recebido em VITE_SITE_URL.
 * Retorna null quando a variável não está definida (build sem domínio final).
 */
function normalizeSiteUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `[site-url] VITE_SITE_URL inválida ("${value}"). ` +
        'Informe uma URL absoluta, por exemplo: https://assistant-cat.exemplo.workers.dev'
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `[site-url] VITE_SITE_URL deve usar http ou https (recebido "${parsed.protocol}").`
    );
  }

  if (parsed.search || parsed.hash) {
    throw new Error(
      '[site-url] VITE_SITE_URL não deve conter query string nem fragmento (#).'
    );
  }

  // Remove barras finais: https://site.dev/// -> https://site.dev
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function replaceMetaContent(
  html: string,
  attribute: 'property' | 'name',
  key: string,
  content: string
): string {
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`);
  return html.replace(pattern, `$1${content}$2`);
}

/**
 * Plugin de metadados de produção.
 *
 * Com VITE_SITE_URL definida:
 *  - reescreve og:image/twitter:image para URL absoluta;
 *  - injeta og:url e <link rel="canonical">;
 *  - gera dist/sitemap.xml e adiciona "Sitemap:" em dist/robots.txt.
 *
 * Sem VITE_SITE_URL: mantém as metas relativas do index.html, não inventa
 * domínio e avisa no console qual variável configurar.
 */
function siteMetadataPlugin(siteUrl: string | null): Plugin {
  let config: ResolvedConfig | undefined;

  return {
    name: 'assistant-cat:site-metadata',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (!siteUrl) return html;

        const imageUrl = `${siteUrl}/og-image.png`;
        let output = replaceMetaContent(html, 'property', 'og:image', imageUrl);
        output = replaceMetaContent(output, 'name', 'twitter:image', imageUrl);

        const headTags = [
          `    <meta property="og:url" content="${siteUrl}/" />`,
          `    <link rel="canonical" href="${siteUrl}/" />`
        ].join('\n');

        return output.replace(/\n[ \t]*<\/head>/i, `\n${headTags}\n  </head>`);
      }
    },
    closeBundle() {
      if (!config) return;

      const outDir = path.resolve(config.root, config.build.outDir);

      if (!siteUrl) {
        config.logger.warn(
          '[site-url] VITE_SITE_URL não definida: og:image/twitter:image seguem relativos ' +
            'e o sitemap/robots não recebem o domínio canônico. ' +
            'Defina VITE_SITE_URL (ex.: https://assistant-cat.seu-subdominio.workers.dev) ' +
            'no build de produção.'
        );
        return;
      }

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- Gerado automaticamente no build a partir de VITE_SITE_URL. Não edite arquivos em dist/. -->',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...SITEMAP_PAGES.map(
          (page) =>
            `  <url><loc>${escapeXml(`${siteUrl}${page.path}`)}</loc>` +
            `<changefreq>${page.changefreq}</changefreq>` +
            `<priority>${page.priority}</priority></url>`
        ),
        '</urlset>',
        ''
      ].join('\n');

      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');

      const robotsPath = path.join(outDir, 'robots.txt');
      const robots = fs.existsSync(robotsPath)
        ? fs.readFileSync(robotsPath, 'utf8')
        : '';
      const rules = robots
        .replace(/^[ \t]*Sitemap:.*(?:\r?\n)?/gim, '')
        .replace(/\s+$/, '');
      const sitemapLine = `Sitemap: ${siteUrl}/sitemap.xml`;
      fs.writeFileSync(
        robotsPath,
        `${rules ? `${rules}\n\n` : ''}${sitemapLine}\n`,
        'utf8'
      );

      config.logger.info(`[site-url] domínio canônico aplicado: ${siteUrl}`);
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = normalizeSiteUrl(env.VITE_SITE_URL);

  return {
    plugins: [react(), tailwindcss(), siteMetadataPlugin(siteUrl)],
    server: {
      port: 5173,
      proxy: {
        '/api/gemini': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  };
});
