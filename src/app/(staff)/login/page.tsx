import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getCurrentUser } from "@/server/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "HOUSEKEEPING" ? "/staff" : "/admin");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const demo =
    process.env.DEMO_MODE === "true" && process.env.DEMO_PASSWORD
      ? {
          password: process.env.DEMO_PASSWORD,
          accounts: [
            { label: "Admin · Elif", email: "admin@istanbulhostel.example" },
            { label: "Manager · Marko", email: "manager@istanbulhostel.example" },
            { label: "Reception · Selin", email: "reception@istanbulhostel.example" },
            { label: "Housekeeping · Ayşe", email: "ayse@istanbulhostel.example" },
          ],
        }
      : undefined;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden bg-ink lg:block">
        <Image src="/images/place-galata.jpg" alt="" fill priority sizes="50vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-paper">
          <Logo tone="light" />
          <p className="mt-4 max-w-sm font-display text-[28px] leading-tight">Reservations, rooms and guests — in one calm place.</p>
          <p className="mt-3 text-[13px] text-paper/60">Hostel management platform by Medya 333</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <h1 className="mt-8 font-display text-[34px] leading-tight lg:mt-0">Staff sign-in</h1>
          <p className="mt-2 text-[14.5px] text-slate">For hostel team members only.</p>
          <div className="mt-8">
            <LoginForm next={next} demo={demo} />
          </div>
          <Link href="/" className="mt-10 inline-block text-[13.5px] text-slate hover:text-ink">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
