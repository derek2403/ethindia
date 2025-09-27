import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header = () => {
  return (
    <header className="flex justify-end items-center p-4">
      <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl p-1">
        <div className="relative z-10 [&>div]:!bg-transparent [&>div]:!border-transparent [&>div]:!backdrop-blur-none [&>div]:!shadow-none">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};
