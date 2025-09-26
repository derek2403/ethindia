import { Header } from '../components/Header';
import AtomicTransfer from '../components/AtomicTransfer';


export default function Transfer() {
  return (
    <div>
      <Header />
      <main className="p-4">
        <AtomicTransfer />
      </main>
    </div>
  );
}
