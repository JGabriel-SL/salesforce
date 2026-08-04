/* Assinatura visual Sankhya: campo código + descrição lado a lado. */

export function FieldRow({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  );
}

export function CodedFieldRow({
  icon,
  label,
  code,
  value,
  onCodeChange,
  onValueChange,
  readOnly = false,
}: {
  icon?: React.ReactNode;
  label: string;
  code: string;
  value: string;
  onCodeChange?: (v: string) => void;
  onValueChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  const disabled = readOnly || (!onCodeChange && !onValueChange);
  return (
    <FieldRow icon={icon} label={label}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={code}
          disabled={disabled}
          onChange={(e) => onCodeChange?.(e.target.value)}
          className="w-24 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 disabled:cursor-default disabled:hover:border-slate-200"
        />
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange?.(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-default disabled:bg-slate-50/50 disabled:hover:border-slate-200"
        />
      </div>
    </FieldRow>
  );
}

export function EditableRow({
  icon,
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: "text" | "date";
  readOnly?: boolean;
}) {
  return (
    <FieldRow icon={icon} label={label}>
      <input
        type={type}
        value={value}
        disabled={readOnly || !onChange}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-default disabled:bg-slate-50/50 disabled:hover:border-slate-200"
      />
    </FieldRow>
  );
}

interface NumberCellProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  width?: string;
  disabled?: boolean;
}

/** Célula numérica editável do padrão de tabela densa. */
export function NumberCell({
  value,
  onChange,
  step = 1,
  min,
  max,
  prefix,
  suffix,
  width = "w-24",
  disabled = false,
}: NumberCellProps) {
  return (
    <div
      className={`ml-auto flex items-center justify-end gap-1 rounded-md border border-slate-200 px-2 py-1 text-right transition-colors focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 ${
        disabled ? "bg-slate-50/60" : "bg-white"
      } ${width}`}
    >
      {prefix && <span className="text-xs text-slate-400">{prefix}</span>}
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="w-full bg-transparent text-right text-sm tabular-nums text-slate-900 outline-none disabled:text-slate-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
    </div>
  );
}
