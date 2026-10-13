import { Hero } from "@/components/sections/hero";
import { CategoryRail } from "@/components/sections/categories";
import { Featured } from "@/components/sections/featured";
import { SpecLab } from "@/components/sections/spec-lab";
import { AskNodal } from "@/components/sections/ask-nodal";
import { Process } from "@/components/sections/process";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryRail />
      <Featured />
      <SpecLab />
      <AskNodal />
      <Process />
    </>
  );
}
