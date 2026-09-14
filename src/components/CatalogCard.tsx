import React from 'react';
import Link from '@docusaurus/Link';
import styles from './CatalogCard.module.css';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  meta: string[];
  href: string;
  status: string;
  actionLabel: string;
};

export default function CatalogCard({
  eyebrow,
  title,
  description,
  meta,
  href,
  status,
  actionLabel,
}: Props): React.JSX.Element {
  return (
    <article className={styles.card}>
      <div className={styles.topline}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <span className={styles.status}>{status}</span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <ul aria-label="รายละเอียด">
        {meta.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <Link className="button button--primary button--block" to={href}>
        {actionLabel}
      </Link>
    </article>
  );
}
