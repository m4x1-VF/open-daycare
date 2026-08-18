import { LoginForm } from "@/app/_components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid md:grid-cols-[1.05fr_1fr]">
      <div className="hidden md:flex relative overflow-hidden bg-gradient-to-br from-auth-brand-start via-auth-brand-mid to-auth-brand-end flex-col justify-between py-14 px-15 text-white">
        <div className="absolute w-[420px] h-[420px] rounded-full bg-white/12 -top-35 -right-30" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-white/10 -bottom-28 -left-20" />

        <div className="flex items-center gap-3.5 relative">
          <div className="w-[46px] h-[46px] rounded-[14px] bg-white/22 flex items-center justify-center">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </div>
          <span className="font-fredoka font-semibold text-[21px] tracking-[0.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <h1 className="font-fredoka font-semibold text-[42px] leading-[1.12] mb-[18px]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="text-[17px] leading-[1.6] max-w-[430px] text-white/92">
            Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.
          </p>
        </div>

        <div className="relative text-[14px] text-white/90">🌿 Guardería Sala Soles</div>
      </div>

      <div className="flex items-center justify-center p-10">
        <LoginForm />
      </div>
    </div>
  );
}
