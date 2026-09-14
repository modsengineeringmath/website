import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const config: Config = {
  title: "Mod's Engineering Mathematics",
  tagline: 'Engineering Mathematics Made Clear',
  favicon: 'images/logo/brand-mark.svg',
  url: 'https://modsengineeringmath.com',
  baseUrl: '/',
  organizationName: 'modsengineeringmath',
  projectName: 'website',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'th',
    locales: ['th'],
    localeConfigs: {
      th: {label: 'ไทย', htmlLang: 'th-TH'},
    },
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'learn',
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          showLastUpdateTime: true,
          showLastUpdateAuthor: false,
          editUrl: 'https://github.com/modsengineeringmath/website/edit/docusaurus-v2/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.7,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      '@cmfcmf/docusaurus-search-local',
      {
        indexDocs: true,
        indexBlog: false,
        indexPages: true,
        indexDocSidebarParentCategories: 2,
        includeParentCategoriesInPageTitle: true,
        language: 'en',
        maxSearchResults: 10,
        lunr: {
          b: 0.75,
          k1: 1.2,
          titleBoost: 5,
          contentBoost: 1,
          tagsBoost: 3,
          parentCategoriesBoost: 2,
        },
      },
    ],
  ],
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css',
      type: 'text/css',
      crossorigin: 'anonymous',
    },
  ],
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'engineering mathematics, คณิตศาสตร์วิศวกรรม, calculus, linear algebra, Laplace transform, control systems',
      },
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: "Mod's Engineering Mathematics",
        url: 'https://modsengineeringmath.com/',
        sameAs: [
          'https://youtube.com/@modsengineeringmath',
          'https://facebook.com/modsengineeringmath',
        ],
      }),
    },
  ],
  themeConfig: {
    image: 'images/home/social-card.svg',
    metadata: [
      {name: 'description', content: 'คลังความรู้คณิตศาสตร์วิศวกรรม จาก Calculus และ Linear Algebra สู่ Laplace Transform, Mathematical Modeling และ Control Systems'},
      {property: 'og:type', content: 'website'},
      {name: 'twitter:card', content: 'summary_large_image'},
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Mod's Engineering Mathematics",
      hideOnScroll: true,
      items: [
        {to: '/', label: 'Home', position: 'left', exact: true},
        {to: '/learn/', label: 'Learn', position: 'left'},
        {to: '/courses', label: 'Courses', position: 'left'},
        {to: '/resources', label: 'Resources', position: 'left'},
        {to: '/about', label: 'About', position: 'left'},
        {type: 'search', position: 'right'},
        {
          href: 'https://youtube.com/@modsengineeringmath',
          label: 'YouTube',
          position: 'right',
          className: 'navbar-youtube',
        },
        {
          href: 'https://facebook.com/modsengineeringmath',
          label: 'Facebook',
          position: 'right',
          className: 'navbar-facebook',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {label: 'Knowledge Hub', to: '/learn/'},
            {label: 'Calculus', to: '/learn/calculus/derivative-by-definition'},
            {label: 'Linear Algebra', to: '/learn/linear-algebra/inverse-matrix'},
            {label: 'Laplace Transform', to: '/learn/laplace/introduction'},
          ],
        },
        {
          title: 'Platform',
          items: [
            {label: 'Courses', to: '/courses'},
            {label: 'Resources', to: '/resources'},
            {label: 'Worksheet Generator', to: '/worksheet-generator'},
            {label: 'About', to: '/about'},
          ],
        },
        {
          title: 'Social',
          items: [
            {label: 'YouTube', href: 'https://youtube.com/@modsengineeringmath'},
            {label: 'Facebook', href: 'https://facebook.com/modsengineeringmath'},
            {label: 'Website', href: 'https://modsengineeringmath.com/'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Mod's Engineering Mathematics. Educational content for engineering and mathematics learners.`,
    },
    prism: {
      additionalLanguages: ['matlab'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
