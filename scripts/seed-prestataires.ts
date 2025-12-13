import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })



// ⚠️ UTILISER LE SERVICE ROLE KEY (pas l'anon key)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!



if (!supabaseUrl || !supabaseServiceKey) {

  console.error('❌ Variables d\'environnement manquantes!')

  process.exit(1)

}



const supabase = createClient(supabaseUrl, supabaseServiceKey, {

  auth: {

    autoRefreshToken: false,

    persistSession: false

  }

})



const prestataires = [

  {

    email: 'karim.benali.photo@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Karim',

    nom: 'Benali',

    role: 'prestataire',

    nom_entreprise: 'Maghreb Wedding Photography',

    type_prestation: 'photographe',

    ville_exercice: 'Paris',

    tarif_min: 1500,

    tarif_max: 3500,

    cultures_gerees: ['maghrébin', 'français'],

    description: 'Photographe spécialisé dans les mariages maghrébins depuis 10 ans.',

    rating: 4.8,

    total_reviews: 47,

    is_verified: true

  },

  {

    email: 'priya.sharma.photo@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Priya',

    nom: 'Sharma',

    role: 'prestataire',

    nom_entreprise: 'Bollywood Dreams Photography',

    type_prestation: 'photographe',

    ville_exercice: 'Lyon',

    tarif_min: 2000,

    tarif_max: 4500,

    cultures_gerees: ['indien', 'pakistanais'],

    description: 'Spécialiste des mariages indiens. Portfolio de plus de 100 mariages bollywood.',

    rating: 4.9,

    total_reviews: 63,

    is_verified: true

  },

  {

    email: 'aminata.diallo.photo@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Aminata',

    nom: 'Diallo',

    role: 'prestataire',

    nom_entreprise: 'Afro Elegance Photography',

    type_prestation: 'photographe',

    ville_exercice: 'Marseille',

    tarif_min: 1200,

    tarif_max: 3000,

    cultures_gerees: ['africain', 'antillais'],

    description: 'Photographe passionnée par les mariages africains et antillais.',

    rating: 4.7,

    total_reviews: 34,

    is_verified: true

  },

  {

    email: 'rachid.mansouri.traiteur@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Rachid',

    nom: 'Mansouri',

    role: 'prestataire',

    nom_entreprise: 'Saveurs d\'Orient',

    type_prestation: 'traiteur',

    ville_exercice: 'Paris',

    tarif_min: 45,

    tarif_max: 85,

    cultures_gerees: ['maghrébin', 'moyen-oriental'],

    description: 'Cuisine authentique marocaine, algérienne. Couscous, tajines, méchoui.',

    rating: 4.9,

    total_reviews: 89,

    is_verified: true

  },

  {

    email: 'raj.kumar.traiteur@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Raj',

    nom: 'Kumar',

    role: 'prestataire',

    nom_entreprise: 'Spice Kingdom Catering',

    type_prestation: 'traiteur',

    ville_exercice: 'Lille',

    tarif_min: 50,

    tarif_max: 90,

    cultures_gerees: ['indien', 'pakistanais'],

    description: 'Cuisine indienne et pakistanaise authentique. Chef formé à Mumbai.',

    rating: 4.8,

    total_reviews: 56,

    is_verified: true

  },

  {

    email: 'fatou.ndiaye.traiteur@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Fatou',

    nom: 'Ndiaye',

    role: 'prestataire',

    nom_entreprise: 'Délices d\'Afrique',

    type_prestation: 'traiteur',

    ville_exercice: 'Lyon',

    tarif_min: 40,

    tarif_max: 75,

    cultures_gerees: ['africain', 'antillais'],

    description: 'Spécialités sénégalaises, ivoiriennes et antillaises.',

    rating: 4.7,

    total_reviews: 41,

    is_verified: true

  },

  {

    email: 'mehdi.alaoui.dj@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Mehdi',

    nom: 'Alaoui',

    role: 'prestataire',

    nom_entreprise: 'DJ Mehdi Events',

    type_prestation: 'dj',

    ville_exercice: 'Paris',

    tarif_min: 800,

    tarif_max: 2000,

    cultures_gerees: ['maghrébin', 'moyen-oriental'],

    description: 'DJ spécialisé musique orientale. Raï, chaabi, rnb.',

    rating: 4.6,

    total_reviews: 78,

    is_verified: true

  },

  {

    email: 'arjun.patel.dj@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Arjun',

    nom: 'Patel',

    role: 'prestataire',

    nom_entreprise: 'Bollywood Beats DJ',

    type_prestation: 'dj',

    ville_exercice: 'Toulouse',

    tarif_min: 1000,

    tarif_max: 2500,

    cultures_gerees: ['indien', 'pakistanais'],

    description: 'DJ Bollywood et musique indienne moderne.',

    rating: 4.8,

    total_reviews: 52,

    is_verified: true

  },

  {

    email: 'ibrahim.kone.dj@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Ibrahim',

    nom: 'Koné',

    role: 'prestataire',

    nom_entreprise: 'Afro Vibes Entertainment',

    type_prestation: 'dj',

    ville_exercice: 'Marseille',

    tarif_min: 700,

    tarif_max: 1800,

    cultures_gerees: ['africain', 'antillais'],

    description: 'DJ afrobeat, coupé-décalé, zouk, kompa.',

    rating: 4.7,

    total_reviews: 65,

    is_verified: true

  },

  {

    email: 'leila.zaidi.deco@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Leila',

    nom: 'Zaïdi',

    role: 'prestataire',

    nom_entreprise: 'Oriental Dreams Décoration',

    type_prestation: 'decorateur',

    ville_exercice: 'Paris',

    tarif_min: 2500,

    tarif_max: 8000,

    cultures_gerees: ['maghrébin', 'moyen-oriental'],

    description: 'Décoration traditionnelle marocaine haut de gamme.',

    rating: 4.9,

    total_reviews: 43,

    is_verified: true

  },

  {

    email: 'neha.kapoor.deco@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Neha',

    nom: 'Kapoor',

    role: 'prestataire',

    nom_entreprise: 'Indian Elegance Decor',

    type_prestation: 'decorateur',

    ville_exercice: 'Lyon',

    tarif_min: 3000,

    tarif_max: 10000,

    cultures_gerees: ['indien', 'pakistanais'],

    description: 'Décoration indienne luxueuse. Mandap personnalisé.',

    rating: 4.8,

    total_reviews: 38,

    is_verified: true

  },

  {

    email: 'hassan.berrada.salle@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Hassan',

    nom: 'Berrada',

    role: 'prestataire',

    nom_entreprise: 'Le Palais des Mille et Une Nuits',

    type_prestation: 'salle',

    ville_exercice: 'Paris',

    tarif_min: 5000,

    tarif_max: 15000,

    cultures_gerees: ['maghrébin', 'moyen-oriental'],

    description: 'Salle orientale 200-500 personnes. Architecture mauresque.',

    rating: 4.7,

    total_reviews: 92,

    is_verified: true

  },

  {

    email: 'vikram.reddy.salle@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Vikram',

    nom: 'Reddy',

    role: 'prestataire',

    nom_entreprise: 'Taj Mahal Reception Hall',

    type_prestation: 'salle',

    ville_exercice: 'Bordeaux',

    tarif_min: 6000,

    tarif_max: 18000,

    cultures_gerees: ['indien', 'pakistanais'],

    description: 'Grande salle 300-600 personnes avec cuisine indienne.',

    rating: 4.8,

    total_reviews: 67,

    is_verified: true

  },

  {

    email: 'samira.tazi.beauty@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Samira',

    nom: 'Tazi',

    role: 'prestataire',

    nom_entreprise: 'Beauté Orientale by Samira',

    type_prestation: 'maquilleur',

    ville_exercice: 'Paris',

    tarif_min: 200,

    tarif_max: 600,

    cultures_gerees: ['maghrébin', 'moyen-oriental'],

    description: 'Maquilleuse spécialiste mariages orientaux.',

    rating: 4.9,

    total_reviews: 156,

    is_verified: true

  },

  {

    email: 'meera.singh.beauty@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Meera',

    nom: 'Singh',

    role: 'prestataire',

    nom_entreprise: 'Bollywood Glam Studio',

    type_prestation: 'maquilleur',

    ville_exercice: 'Nice',

    tarif_min: 250,

    tarif_max: 800,

    cultures_gerees: ['indien', 'pakistanais'],

    description: 'Maquilleuse mariée indienne. Mehndi artist.',

    rating: 4.8,

    total_reviews: 134,

    is_verified: true

  },

  {

    email: 'yasmine.elfassi.fleur@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Yasmine',

    nom: 'El Fassi',

    role: 'prestataire',

    nom_entreprise: 'Fleurs d\'Orient',

    type_prestation: 'fleuriste',

    ville_exercice: 'Lyon',

    tarif_min: 800,

    tarif_max: 3000,

    cultures_gerees: ['maghrébin', 'moyen-oriental'],

    description: 'Compositions florales orientales et modernes.',

    rating: 4.7,

    total_reviews: 48,

    is_verified: true

  },

  {

    email: 'maya.reddy.fleur@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Maya',

    nom: 'Reddy',

    role: 'prestataire',

    nom_entreprise: 'Lotus & Marigold Flowers',

    type_prestation: 'fleuriste',

    ville_exercice: 'Paris',

    tarif_min: 1000,

    tarif_max: 4000,

    cultures_gerees: ['indien', 'pakistanais'],

    description: 'Fleuriste spécialiste mariages indiens.',

    rating: 4.9,

    total_reviews: 71,

    is_verified: true

  },

  {

    email: 'amine.lakhal.video@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Amine',

    nom: 'Lakhal',

    role: 'prestataire',

    nom_entreprise: 'Cinematic Weddings',

    type_prestation: 'videaste',

    ville_exercice: 'Paris',

    tarif_min: 1800,

    tarif_max: 4500,

    cultures_gerees: ['maghrébin', 'français'],

    description: 'Vidéaste film de mariage cinématographique.',

    rating: 4.9,

    total_reviews: 71,

    is_verified: true

  },

  {

    email: 'rohan.mehta.video@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Rohan',

    nom: 'Mehta',

    role: 'prestataire',

    nom_entreprise: 'Bollywood Cinema Productions',

    type_prestation: 'videaste',

    ville_exercice: 'Nantes',

    tarif_min: 2000,

    tarif_max: 5000,

    cultures_gerees: ['indien', 'pakistanais'],

    description: 'Production vidéo mariage style bollywood.',

    rating: 4.8,

    total_reviews: 59,

    is_verified: true

  },

  {

    email: 'nadia.benjelloun.patisserie@nuply.fr',

    password: 'NuplyTest2024!',

    prenom: 'Nadia',

    nom: 'Benjelloun',

    role: 'prestataire',

    nom_entreprise: 'Délices du Maghreb',

    type_prestation: 'patissier',

    ville_exercice: 'Marseille',

    tarif_min: 500,

    tarif_max: 2000,

    cultures_gerees: ['maghrébin', 'moyen-oriental'],

    description: 'Pâtisserie orientale artisanale 100% maison.',

    rating: 4.8,

    total_reviews: 83,

    is_verified: true

  },

]



async function seedPrestataires() {

  console.log('🌱 Démarrage du seeding...\n')

  

  let successCount = 0

  let errorCount = 0



  for (const p of prestataires) {

    try {

      console.log(`📝 Création de : ${p.nom_entreprise}`)



      const { data: authData, error: authError } = await supabase.auth.admin.createUser({

        email: p.email,

        password: p.password,

        email_confirm: true

      })



      if (authError) {

        console.error(`   ❌ Erreur: ${authError.message}`)

        errorCount++

        continue

      }



      const userId = authData.user.id

      console.log(`   ✅ User créé: ${userId}`)



      await supabase.from('profiles').insert({

        id: userId,

        role: p.role as 'prestataire',

        prenom: p.prenom,

        nom: p.nom,

        onboarding_completed: true

      })



      await supabase.from('prestataire_profiles').insert({

        user_id: userId,

        nom_entreprise: p.nom_entreprise,

        type_prestation: p.type_prestation,

        ville_exercice: p.ville_exercice,

        tarif_min: p.tarif_min,

        tarif_max: p.tarif_max,

        cultures_gerees: p.cultures_gerees

      })



      await supabase.from('prestataire_public_profiles').insert({

        prestataire_id: userId,

        description: p.description,

        rating: p.rating,

        total_reviews: p.total_reviews,

        is_verified: p.is_verified

      })



      console.log(`   🎉 ${p.nom_entreprise} créé!\n`)

      successCount++



    } catch (error: any) {

      console.error(`   ❌ Erreur: ${error.message}`)

      errorCount++

    }

  }



  console.log('\n' + '='.repeat(60))

  console.log('📊 RÉSUMÉ')

  console.log('='.repeat(60))

  console.log(`✅ Succès : ${successCount}/20`)

  console.log(`❌ Échecs : ${errorCount}/20`)

  console.log('='.repeat(60) + '\n')

}



seedPrestataires()

  .then(() => process.exit(0))

  .catch((error) => {

    console.error('❌ Erreur fatale:', error)

    process.exit(1)

  })

