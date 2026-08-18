import Link from "next/link";

export function ActivateAccountForm() {
  return (
    <div className="w-full max-w-[440px]">
      <div className="w-[58px] h-[58px] rounded-[18px] bg-gradient-to-br from-[#F8C3A8] to-auth-brand-mid flex items-center justify-center mb-[22px] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
        <svg
          width="30"
          height="30"
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

      <h1 className="font-fredoka font-semibold text-[32px] leading-[1.15] mb-2 text-text">
        Bienvenida a OpenDayCare
      </h1>
      <p className="mb-[26px] text-auth-muted text-[15.5px] leading-[1.55]">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
      </p>

      <div className="flex items-center gap-3.5 bg-white border-[1.5px] border-auth-input-border rounded-2xl py-3.5 px-4 mb-[22px]">
        <div className="w-11 h-11 rounded-full bg-auth-invite-bg text-auth-invite-text font-fredoka font-semibold text-[19px] flex items-center justify-center">
          M
        </div>
        <div>
          <div className="text-[13px] text-auth-muted">Te invitaron a seguir a</div>
          <div className="font-fredoka font-semibold text-[17px] text-text">
            Mateo · Sala Soles
          </div>
        </div>
      </div>

      <div className="text-[12px] font-bold tracking-[0.7px] text-auth-muted mb-2">
        CÓDIGO DE INVITACIÓN
      </div>
      <input
        type="text"
        value="7K4P9"
        readOnly
        className="w-full py-3.5 px-4 rounded-[14px] border-[1.5px] border-auth-input-border bg-white text-[18px] tracking-[3px] font-bold text-auth-input-text mb-[18px] font-fredoka"
      />

      <div className="text-[12px] font-bold tracking-[0.7px] text-auth-muted mb-2">
        EMAIL
      </div>
      <input
        type="email"
        value="lucia.fernandez@gmail.com"
        readOnly
        className="w-full py-3.5 px-4 rounded-[14px] border-[1.5px] border-auth-input-border bg-white text-[15px] text-auth-input-text mb-[18px]"
      />

      <div className="text-[12px] font-bold tracking-[0.7px] text-auth-muted mb-2">
        CREAR CONTRASEÑA
      </div>
      <input
        type="password"
        value="contraseña"
        readOnly
        className="w-full py-3.5 px-4 rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white text-[15px] text-auth-input-text mb-[18px]"
      />

      <label className="flex items-start gap-3 bg-auth-consent-bg rounded-[14px] py-3.5 px-4 mb-6">
        <span className="flex-none w-6 h-6 rounded-[8px] bg-auth-consent-check flex items-center justify-center mt-0.5">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="text-[14px] text-auth-consent-text leading-[1.45]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
        </span>
      </label>

      <Link
        href="#"
        className="block text-center w-full py-[15px] rounded-[15px] bg-gradient-to-b from-auth-btn-start to-auth-btn-end text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
      >
        Activar mi cuenta
      </Link>

      <p className="text-center mt-[22px] text-auth-muted text-[14.5px]">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="text-auth-link font-extrabold"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
