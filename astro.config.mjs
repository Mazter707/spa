import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import lit from '@astrojs/lit';

export default defineConfig({
	site: 'https://example.pages.dev',
	output: 'static',
	trailingSlash: 'always',
	sitemap: true,
	integrations: [sitemap(), mdx(), lit(), icon()],
});
