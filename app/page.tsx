import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Stats from "@/components/Stats";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import PageView from "@/components/PageView";
import { ServicesSkeleton, PortfolioSkeleton, StatsSkeleton } from "@/components/Skeletons";

export default function Home() {
  return (
    <>
      <PageView />
      <Navbar />
      <Hero />
      <Suspense fallback={<ServicesSkeleton />}>
        <Services />
      </Suspense>
      <Suspense fallback={<PortfolioSkeleton />}>
        <Portfolio />
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Contact />
      <Footer />
    </>
  );
}
