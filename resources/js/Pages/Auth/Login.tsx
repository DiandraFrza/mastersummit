/** @format */

import React, { useState, useEffect, useRef } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import Toast from "@/Components/Toast";
import type { PageProps } from "@/types";

export default function Login() {
  const { clinicSetting } = usePage<PageProps>().props;
  const [showPassword, setShowPassword] = useState(false);
  const loginInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    login: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    loginInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (errors.login) {
      loginInputRef.current?.focus();
    } else if (errors.password) {
      passwordInputRef.current?.focus();
    }
  }, [errors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("login"), {
      onFinish: () => reset("password"),
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center px-4 py-12 antialiased selection:bg-zinc-900 selection:text-white">
      <Head title="Masuk — Master Summit" />

      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-10 h-10 rounded-sm bg-zinc-900 flex items-center justify-center text-white mb-3 shadow-2xs">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight">{clinicSetting?.clinic_name || "Master Summit Clinic & Lab"}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{clinicSetting?.clinic_subtitle || "Clinic, Lab & MCU Management System"}</p>
        </div>

        {/* Login Surface */}
        <div className="bg-white border border-zinc-200/80 rounded-md p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username or Email Input */}
            <div>
              <label htmlFor="login" className="block text-xs font-medium text-zinc-700 mb-1">
                USERNAME
              </label>
              <input id="login" ref={loginInputRef} type="text" value={data.login} onChange={(e) => setData("login", e.target.value)} placeholder="Masukkan username" required disabled={processing} className={`w-full px-3 py-1.5 text-xs bg-zinc-50 border rounded-sm focus:bg-white focus:outline-none transition-colors ${errors.login ? "border-rose-400 focus:ring-1 focus:ring-rose-500 bg-rose-50/20" : "border-zinc-200/90 focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"}`} />
              {errors.login && <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.login}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-700 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <input id="password" ref={passwordInputRef} type={showPassword ? "text" : "password"} value={data.password} onChange={(e) => setData("password", e.target.value)} placeholder="••••••••" required disabled={processing} className={`w-full pl-3 pr-8 py-1.5 text-xs bg-zinc-50 border rounded-sm focus:bg-white focus:outline-none transition-colors ${errors.password ? "border-rose-400 focus:ring-1 focus:ring-rose-500 bg-rose-50/20" : "border-zinc-200/90 focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={data.remember} onChange={(e) => setData("remember", e.target.checked)} className="w-3.5 h-3.5 rounded-xs border-zinc-300 text-zinc-900 focus:ring-0" />
                <span className="text-zinc-600 text-[11px]">Ingat saya</span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={processing} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-sm shadow-2xs transition-colors cursor-pointer">
              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Masuk</span>
            </button>
          </form>
        </div>

        {/* <p className="mt-6 text-center text-[11px] text-zinc-400">Master Summit — Modern Monolith Clinic & Lab System</p> */}
      </div>

      <Toast />
    </div>
  );
}
