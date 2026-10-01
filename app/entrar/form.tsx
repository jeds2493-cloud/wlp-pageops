"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { SubmitButton } from "@/components/edit";
import { inputCls } from "@/components/ui";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [error, action] = useActionState(login, "");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-600">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
          className={inputCls}
        />
      </label>
      {error && (
        <p id="login-error" role="alert" className="text-sm font-medium text-signal-red">
          {error}
        </p>
      )}
      <SubmitButton>
        <LockKeyhole aria-hidden className="size-4" /> Entrar
      </SubmitButton>
    </form>
  );
}
