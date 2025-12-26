import { Globe } from "@/components/magicui/globe";

export function NuplyGlobe() {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[400px] flex items-center justify-center bg-white rounded-lg overflow-hidden">
      {/* Texte */}
      <h2 className="absolute top-8 text-[#823F91] text-[512px] md:text-[536px] lg:text-[1100px] font-bold tracking-tight z-10">
        Retrouvez les traditions du monde entier
      </h2>
      
      {/* Globe */}
      <div className="relative w-full h-full">
        <Globe className="top-0" />
      </div>
    </div>
  );
}

