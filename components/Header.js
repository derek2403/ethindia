import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header = () => {
  return (
    <header className="flex justify-end items-center p-4">
      <div className="bg-white/10 border border-white/30 rounded-xl backdrop-blur-md shadow-lg">
        <ConnectButton />
      </div>
    </header>
  );
};
