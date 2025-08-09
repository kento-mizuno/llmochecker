import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/sections/HeroSection'
import { FeatureSection } from '@/components/sections/FeatureSection'
import { HowItWorksSection } from '@/components/sections/HowItWorksSection'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />
        <HowItWorksSection />
      </main>
      
      <Footer />
    </div>
  )
}