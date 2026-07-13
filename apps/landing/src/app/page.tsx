import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { AgentHarness } from '@/components/agent-harness';
import { Features } from '@/components/features';
import { Donate } from '@/components/donate';
import { Footer } from '@/components/footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AgentHarness />
        <Features />
        <Donate />
      </main>
      <Footer />
    </>
  );
}
