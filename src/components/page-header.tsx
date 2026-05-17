interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
  }
  
  export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    );
  }