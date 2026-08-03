'use client';

/**
 * تنويه إسناد PhET — إلزامي قانونيًا في كل مكان تُعرض فيه المحاكيات.
 * نص الإسناد كامل (لا يُختصر ولا يُخفى) + رابط phet.colorado.edu.
 * نستخدم النص فقط — لا شعار PhET — لتجنّب أي استخدام يُفسَّر كترويجي.
 *
 * المرجع: https://phet.colorado.edu/en/licensing/html
 * "PhET Interactive Simulations, University of Colorado Boulder" يجب
 * ذكره كاملًا مع الرابط، ولا يجوز إخفاؤه أو استبداله.
 */
export function PhetAttribution({
  variant = 'bar',
}: {
  variant?: 'bar' | 'inline';
}) {
  if (variant === 'inline') {
    return (
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--ink-soft)',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        المحاكاة مقدَّمة من{' '}
        <a
          href="https://phet.colorado.edu"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--violet-600)', fontWeight: 800 }}
        >
          PhET Interactive Simulations, University of Colorado Boulder
        </a>
        . منصّتنا توفّر البحث والوصول والإدارة فقط، والمحاكيات تخضع لترخيص
        وشروط PhET.
      </p>
    );
  }

  return (
    <div
      role="note"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        marginTop: 12,
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--ink)',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        هذه المحاكاة مقدَّمة من{' '}
        <a
          href="https://phet.colorado.edu"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--violet-600)', fontWeight: 800 }}
        >
          PhET Interactive Simulations, University of Colorado Boulder
          (phet.colorado.edu)
        </a>
        ، ومتاحة مجانًا. منصّة بيسان توفّر البحث والوصول إليها وإدارة
        الواجبات حولها، بينما تخضع المحاكيات لشروط وترخيص PhET.
      </p>
    </div>
  );
}
