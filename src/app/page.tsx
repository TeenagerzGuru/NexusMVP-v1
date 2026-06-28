import { LandingPage } from "@/components/landing-page";
import { getBrand } from "@/lib/brand/resolve";

export default async function HomePage() {
  const brand = await getBrand();
  return <LandingPage brand={brand} />;
}
