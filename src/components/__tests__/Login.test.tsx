// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHAVE_LOCAL } from "@/auth/cliente";
import { avisoDoLogin, FormLogin, proximoSeguro } from "../login/FormLogin";

const q = (s: string) => new URLSearchParams(s);

describe("login", () => {
  it("next só aceita caminho interno", () => {
    expect(proximoSeguro("/produto/ambar?estrategia=total")).toBe("/produto/ambar?estrategia=total");
    expect(proximoSeguro("//evil.com")).toBe("/");
    expect(proximoSeguro("https://evil.com")).toBe("/");
    expect(proximoSeguro(null)).toBe("/");
  });

  it("avisos: erro > saiu > sessão expirada (flag local)", () => {
    expect(avisoDoLogin(q("erro=1"), true)?.texto).toBe("Senha incorreta. Tente novamente.");
    expect(avisoDoLogin(q("saiu=1"), true)?.texto).toBe("Você saiu.");
    expect(avisoDoLogin(q(""), true)?.texto).toBe("Sua sessão expirou. Entre novamente.");
    expect(avisoDoLogin(q(""), false)).toBeNull();
  });

  it("form POST /api/login com senha (label visível, current-password, required) e next oculto", () => {
    render(<FormLogin params={q("next=%2Fguia%23termo-mdp&erro=1")} />);
    const senha = screen.getByLabelText("Senha");
    expect(senha).toHaveAttribute("type", "password");
    expect(senha).toHaveAttribute("autocomplete", "current-password");
    expect(senha).toBeRequired();
    expect(senha).toHaveAttribute("aria-invalid", "true");
    const form = senha.closest("form")!;
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/login");
    expect(form.querySelector('input[name="next"]')).toHaveValue("/guia#termo-mdp");
    expect(screen.getByRole("alert")).toHaveTextContent("Senha incorreta");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
  });

  it("sessão expirada: flag local presente mostra o aviso", async () => {
    localStorage.setItem(CHAVE_LOCAL, "1");
    render(<FormLogin params={q("")} />);
    expect(await screen.findByText("Sua sessão expirou. Entre novamente.")).toBeTruthy();
  });
});
