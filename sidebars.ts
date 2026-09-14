import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  learnSidebar: [
    'intro',
    {
      type: 'category',
      label: '01 Calculus',
      collapsed: false,
      items: ['calculus/derivative-by-definition'],
    },
    {
      type: 'category',
      label: '02 Linear Algebra',
      items: ['linear-algebra/inverse-matrix'],
    },
    {
      type: 'category',
      label: '03 Differential Equations',
      items: ['differential-equations/introduction'],
    },
    {
      type: 'category',
      label: '04 Laplace Transform',
      items: ['laplace/introduction', 'laplace/inverse-laplace-transform'],
    },
    {
      type: 'category',
      label: '05 Engineering Modeling',
      items: ['modeling/dc-motor'],
    },
    {
      type: 'category',
      label: '06 Control Systems',
      items: ['control/first-order-system'],
    },
    {
      type: 'category',
      label: '07 Signals & Systems',
      items: ['signals/standard-signals'],
    },
    {
      type: 'category',
      label: '08 Electrical Engineering Applications',
      items: ['electrical/rlc-circuit'],
    },
  ],
};

export default sidebars;
