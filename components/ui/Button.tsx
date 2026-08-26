import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

type Variant = 'primary' | 'secondary' | 'danger';

type Shared = {
  variant?: Variant;
  /** Icon-only. Requires aria-label. Keeps the 44px target. */
  icon?: boolean;
  block?: boolean;
  children?: ReactNode;
};

/* `className` and `style` are deliberately omitted from the public props.
   A caller cannot patch a Button at the call site — every visual
   difference has to become a named variant here. That is the rule that
   stops the next round of drift. */
type ButtonProps = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'>;

type LinkProps = Shared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'style' | 'href'> & {
    href: string;
  };

function classes({ variant = 'primary', icon, block }: Shared) {
  return ['btn', `btn--${variant}`, icon && 'btn--icon', block && 'btn--block']
    .filter(Boolean)
    .join(' ');
}

export function Button({ variant, icon, block, type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button className={classes({ variant, icon, block })} type={type} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant, icon, block, href, children, ...rest }: LinkProps) {
  return (
    <Link className={classes({ variant, icon, block })} href={href} {...rest}>
      {children}
    </Link>
  );
}
