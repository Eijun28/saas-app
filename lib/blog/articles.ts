export interface BlogArticle {
  slug: string
  title: string
  description: string
  content: string
  author: string
  publishedAt: string
  updatedAt?: string
  tags: string[]
  readingTime: string
}

/**
 * Articles du blog NUPLY.
 *
 * Pour ajouter un article :
 * 1. Ajouter un objet dans le tableau `articles` ci-dessous
 * 2. Remplir slug (URL), title, description (meta SEO), content (HTML), tags
 * 3. Le contenu (content) est du HTML brut qui sera rendu dans une balise `prose`
 * 4. L'article apparaitra automatiquement sur /blog et sera accessible sur /blog/{slug}
 */
export const articles: BlogArticle[] = [
  {
    slug: 'guide-preparation-mariage-couples',
    title: 'Guide complet : comment bien préparer son mariage en 2025',
    description: 'Retrouvez toutes les étapes clés pour organiser votre mariage sereinement : budget, prestataires, planning, démarches administratives et conseils pratiques.',
    author: 'NUPLY',
    publishedAt: '2025-06-01',
    updatedAt: '2025-06-01',
    tags: ['Organisation', 'Budget', 'Conseils'],
    readingTime: '8 min',
    content: `
<p>Organiser un mariage demande du temps, de la méthode et une bonne dose d'anticipation. Que vous ayez 18 mois ou 6 mois devant vous, ce guide regroupe les étapes essentielles pour préparer votre jour J sans stress.</p>

<h2>1. Définir votre vision et votre budget</h2>

<p>Avant de contacter le moindre prestataire, prenez le temps de vous poser les bonnes questions en couple :</p>

<ul>
  <li><strong>Quel type de mariage souhaitez-vous ?</strong> Intime (30-50 invités), classique (80-150), ou grand format (200+) ?</li>
  <li><strong>Quelle ambiance ?</strong> Champêtre, élégant, bohème, multiculturel, minimaliste ?</li>
  <li><strong>Quel budget global ?</strong> En France, le budget moyen d'un mariage se situe entre 12 000 € et 30 000 €. Définissez votre fourchette réaliste.</li>
</ul>

<p>Conseil : répartissez votre budget par poste. Voici une répartition courante :</p>

<ul>
  <li><strong>Lieu de réception :</strong> 30 à 40 % du budget</li>
  <li><strong>Traiteur :</strong> 20 à 30 %</li>
  <li><strong>Photographe / vidéaste :</strong> 8 à 12 %</li>
  <li><strong>Musique / DJ :</strong> 5 à 8 %</li>
  <li><strong>Fleuriste / décoration :</strong> 5 à 10 %</li>
  <li><strong>Tenue (robe, costume) :</strong> 5 à 10 %</li>
  <li><strong>Divers (papeterie, transport, imprévus) :</strong> 5 à 10 %</li>
</ul>

<p>Avec un outil comme le <strong>module Budget de NUPLY</strong>, vous pouvez suivre chaque dépense par catégorie et visualiser en temps réel la répartition de votre budget.</p>

<h2>2. Établir un planning réaliste</h2>

<p>L'organisation d'un mariage s'étale généralement sur 12 à 18 mois. Voici un calendrier repère :</p>

<h3>12 à 18 mois avant</h3>
<ul>
  <li>Définir la date et le nombre d'invités</li>
  <li>Visiter et réserver le lieu de réception</li>
  <li>Choisir votre traiteur</li>
  <li>Commencer la recherche de prestataires clés (photographe, DJ)</li>
</ul>

<h3>9 à 12 mois avant</h3>
<ul>
  <li>Réserver le photographe et le vidéaste</li>
  <li>Choisir votre officiant (mairie, cérémonie laïque, religieuse)</li>
  <li>Commencer les essayages de robe / costume</li>
  <li>Envoyer les save-the-date</li>
</ul>

<h3>6 à 9 mois avant</h3>
<ul>
  <li>Sélectionner le fleuriste et définir la décoration</li>
  <li>Choisir le DJ ou le groupe de musique</li>
  <li>Organiser les détails logistiques (hébergement invités, transport)</li>
  <li>Commander la papeterie (faire-part, menu, plan de table)</li>
</ul>

<h3>3 à 6 mois avant</h3>
<ul>
  <li>Envoyer les faire-part</li>
  <li>Finaliser le menu avec le traiteur</li>
  <li>Organiser l'enterrement de vie (garçon / fille)</li>
  <li>Préparer vos voeux si cérémonie laïque</li>
</ul>

<h3>Le dernier mois</h3>
<ul>
  <li>Confirmer tous les prestataires et horaires</li>
  <li>Préparer le plan de table définitif</li>
  <li>Rassembler tous les documents administratifs pour la mairie</li>
  <li>Prévoir un planning minute du jour J</li>
</ul>

<h2>3. Choisir les bons prestataires</h2>

<p>Le choix des prestataires est l'étape la plus déterminante. Voici comment procéder efficacement :</p>

<ul>
  <li><strong>Comparez au moins 3 devis</strong> pour chaque prestation</li>
  <li><strong>Vérifiez les avis et portfolios</strong> avant de vous engager</li>
  <li><strong>Rencontrez-les en personne</strong> ou en visio pour évaluer le feeling</li>
  <li><strong>Lisez les contrats</strong> attentivement (conditions d'annulation, acompte, délais)</li>
</ul>

<p>Sur <strong>NUPLY</strong>, vous pouvez rechercher des prestataires vérifiés par métier et par localisation, leur envoyer des demandes de devis directement, et suivre l'état de chaque échange depuis votre messagerie intégrée.</p>

<h2>4. Les démarches administratives</h2>

<p>Ne négligez pas la partie administrative. Voici les étapes obligatoires en France :</p>

<ul>
  <li><strong>Retirer un dossier de mariage</strong> à la mairie du lieu de célébration ou de résidence</li>
  <li><strong>Fournir les documents requis :</strong> pièces d'identité, justificatifs de domicile, actes de naissance de moins de 3 mois, informations sur les témoins</li>
  <li><strong>Publier les bans :</strong> la mairie affiche les bans au moins 10 jours avant le mariage</li>
  <li><strong>Contrat de mariage :</strong> si vous optez pour un régime autre que la communauté réduite aux acquêts, consultez un notaire au moins 2 mois avant</li>
</ul>

<h2>5. Ne pas oublier le jour J</h2>

<p>Le jour du mariage, quelques bonnes pratiques pour que tout se passe bien :</p>

<ul>
  <li><strong>Déléguez :</strong> confiez la coordination à un proche ou un wedding planner</li>
  <li><strong>Préparez un kit d'urgence :</strong> mouchoirs, épingles, antidouleurs, chargeur de téléphone</li>
  <li><strong>Mangez et hydratez-vous :</strong> beaucoup de mariés oublient de manger le jour J</li>
  <li><strong>Profitez de chaque instant :</strong> la journée passe très vite</li>
</ul>

<h2>6. Mariages multiculturels : quelques spécificités</h2>

<p>Si vous organisez un mariage multiculturel, certains aspects méritent une attention particulière :</p>

<ul>
  <li><strong>Combiner les traditions :</strong> cérémonie, tenues, musiques, plats de chaque culture</li>
  <li><strong>Prévoir des traductions</strong> si certains invités ne parlent pas la même langue</li>
  <li><strong>Adapter le menu</strong> aux régimes alimentaires culturels ou religieux (halal, casher, végétarien)</li>
  <li><strong>Choisir des prestataires expérimentés</strong> dans les mariages multiculturels</li>
</ul>

<p>NUPLY est spécialement conçu pour accompagner les couples dans la préparation de mariages qui célèbrent la diversité et la richesse de chaque culture.</p>

<h2>En résumé</h2>

<p>Préparer un mariage, c'est un projet à part entière. Avec de l'organisation, un budget maîtrisé et les bons prestataires, vous pouvez transformer cette période en une aventure sereine et agréable. L'important est de garder en tête ce qui compte vraiment : célébrer votre amour entouré de vos proches.</p>
`,
  },
]

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return articles.find(a => a.slug === slug)
}

export function getAllArticles(): BlogArticle[] {
  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}
