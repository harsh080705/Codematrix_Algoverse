import { Link } from "react-router-dom";
import { clsx } from "clsx";
import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="hero-kicker mb-3 w-fit">{eyebrow}</p> : null}
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, detail, trend }: { label: string; value: string; detail?: string; trend?: string }) {
  return (
    <div className="section-card p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-2 flex items-end gap-3">
        <h3 className="font-display text-3xl font-bold text-white">{value}</h3>
        {trend ? <span className="rounded-full bg-mint-300/15 px-2.5 py-1 text-xs font-semibold text-mint-100">{trend}</span> : null}
      </div>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "mint" | "gold" }) {
  const className = clsx(
    "app-pill",
    tone === "mint" && "border-mint-300/30 bg-mint-300/10 text-mint-100",
    tone === "gold" && "border-gold-300/30 bg-gold-300/10 text-gold-100",
  );
  return <span className={className}>{children}</span>;
}

export function AppButton({
  children,
  href,
  onClick,
  variant = "primary",
  className,
  disabled = false,
  target,
  rel,
  type = "button",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
  disabled?: boolean;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
}) {
  const buttonClass = clsx(variant === "primary" ? "app-button-primary" : "app-button-secondary", className);
  if (href) {
    const external = /^https?:\/\//i.test(href) || href.startsWith("/api/");
    if (external) {
      return (
        <a href={href} className={buttonClass} onClick={onClick} target={target} rel={rel}>
          {children}
        </a>
      );
    }

    return (
      <Link to={href} className={buttonClass} onClick={onClick} target={target} rel={rel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={buttonClass} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function AgentCard({ agent }: { agent: { id: string; slug: string; name: string; category: string; description: string; pricing: { amount: number }; averageRating: number; totalRuns: number; featured?: boolean; trending?: boolean } }) {
  return (
    <div className="section-card group flex h-full flex-col p-5 transition duration-300 hover:-translate-y-1 hover:border-mint-300/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{agent.category}</p>
          <h3 className="mt-2 font-display text-xl font-bold text-white">{agent.name}</h3>
        </div>
        <div className="rounded-2xl bg-white/5 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">x402</p>
          <p className="font-display text-lg font-semibold text-mint-100">${agent.pricing.amount.toFixed(2)}</p>
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{agent.description}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <span>★ {agent.averageRating.toFixed(1)}</span>
        <span>•</span>
        <span>{agent.totalRuns} runs</span>
        {agent.featured ? <span>• featured</span> : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Badge tone={agent.trending ? "mint" : "neutral"}>{agent.trending ? "Trending" : "Live"}</Badge>
        <AppButton href={`/marketplace/${agent.id}`}>View Agent</AppButton>
      </div>
    </div>
  );
}
