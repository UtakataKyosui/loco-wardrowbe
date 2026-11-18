import type { ReactNode } from "react";
import "./auth.css";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main className="c--authPage">
      <section className="c--authCard">
        <div>
          <p className="c--authBrand">Kinfolk</p>
          <h1 className="c--authTitle">{title}</h1>
        </div>
        {children}
      </section>
    </main>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}

export function AuthField({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
}: AuthFieldProps) {
  return (
    <div className="c--authField">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
