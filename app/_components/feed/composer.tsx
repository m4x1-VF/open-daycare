interface ComposerProps {
  onClick: () => void;
}

export default function Composer({ onClick }: ComposerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full text-left items-center gap-[14px] bg-card border border-border rounded-[18px] py-[14px] px-[18px] mb-6 shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)] cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-coral text-white font-fredoka font-semibold text-base flex items-center justify-center flex-none">
        C
      </div>
      <span className="flex-1 text-text-faint text-[15px]">
        Compartí un momento…
      </span>
      <span className="w-[38px] h-[38px] rounded-xl bg-nav-active-bg text-heart flex items-center justify-center flex-none">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </span>
    </button>
  );
}
