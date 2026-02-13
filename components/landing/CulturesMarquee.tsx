import Image from 'next/image'

export function CulturesMarquee() {
  const cultures = [
    "Marocaine", "Algérienne", "Tunisienne", "Sénégalaise", "Camerounaise", 
    "Ivoirienne", "Indienne", "Pakistanaise", "Libanaise", "Turque",
    "Italienne", "Espagnole", "Portugaise", "Chinoise", "Vietnamienne",
    "Antillaise", "Africaine", "Asiatique", "Européenne", "Multiculturelle"
  ]

  return (
    <section className="w-full py-14 overflow-hidden min-h-[140px]">
      {/* Titre */}
      <div className="text-center mb-8 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2">
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold uppercase tracking-[0.1em] text-gray-900 text-center sm:text-left">
            Retrouvez vos cultures
          </p>
          <Image
            src="/images/logo.svg"
            alt="NUPLY Logo"
            width={100}
            height={36}
            className="h-5 sm:h-6 md:h-7 w-auto"
          />
        </div>
      </div>
      
      {/* Container du marquee */}
      <div className="relative w-full overflow-hidden py-2">
        {/* Wrapper avec animation */}
        <div className="flex w-max animate-infinite-scroll">
          {/* Premier groupe d'éléments */}
          {cultures.map((culture, index) => (
            <span 
              key={`group1-${index}`}
              className="mx-7 text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ color: '#823F91' }}
            >
              {culture}
            </span>
          ))}
          
          {/* Duplication pour créer la boucle infinie */}
          {cultures.map((culture, index) => (
            <span 
              key={`group2-${index}`}
              className="mx-7 text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ color: '#823F91' }}
            >
              {culture}
            </span>
          ))}
          
          {/* Troisième groupe pour garantir la continuité */}
          {cultures.map((culture, index) => (
            <span 
              key={`group3-${index}`}
              className="mx-7 text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ color: '#823F91' }}
            >
              {culture}
            </span>
          ))}
        </div>
        
        {/* Dégradé sur les bords */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#FAF9F6] to-transparent z-10"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#FAF9F6] to-transparent z-10"></div>
      </div>
    </section>
  )
}
