import { signOut } from "@/app/(auth)/login/actions";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <form action={signOut} className={className}>
      <button
        type="submit"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="w-full h-full flex items-center justify-center cursor-pointer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      </button>
    </form>
  );
}
