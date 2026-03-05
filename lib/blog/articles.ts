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
    title: 'Guide complet : comment bien pr\u00e9parer son mariage en 2025',
    description: 'Retrouvez toutes les \u00e9tapes cl\u00e9s pour organiser votre mariage sereinement : budget, prestataires, planning, d\u00e9marches administratives et conseils pratiques.',
    author: 'NUPLY',
    publishedAt: '2025-06-01',
    updatedAt: '2025-06-01',
    tags: ['Organisation', 'Budget', 'Conseils'],
    readingTime: '8 min',
    content: `
<p>Organiser un mariage demande du temps, de la m\u00e9thode et une bonne dose d\u2019anticipation. Que vous ayez 18 mois ou 6 mois devant vous, ce guide regroupe les \u00e9tapes essentielles pour pr\u00e9parer votre jour J sans stress.</p>

<h2>1. D\u00e9finir votre vision et votre budget</h2>

<p>Avant de contacter le moindre prestataire, prenez le temps de vous poser les bonnes questions en couple :</p>

<ul>
  <li><strong>Quel type de mariage souhaitez-vous ?</strong> Intime (30-50 invit\u00e9s), classique (80-150), ou grand format (200+) ?</li>
  <li><strong>Quelle ambiance ?</strong> Champ\u00eatre, \u00e9l\u00e9gant, boh\u00e8me, multiculturel, minimaliste ?</li>
  <li><strong>Quel budget global ?</strong> En France, le budget moyen d\u2019un mariage se situe entre 12 000 \u20ac et 30 000 \u20ac. D\u00e9finissez votre fourchette r\u00e9aliste.</li>
</ul>

<p>Conseil : r\u00e9partissez votre budget par poste. Voici une r\u00e9partition courante :</p>

<ul>
  <li><strong>Lieu de r\u00e9ception :</strong> 30 \u00e0 40 % du budget</li>
  <li><strong>Traiteur :</strong> 20 \u00e0 30 %</li>
  <li><strong>Photographe / vid\u00e9aste :</strong> 8 \u00e0 12 %</li>
  <li><strong>Musique / DJ :</strong> 5 \u00e0 8 %</li>
  <li><strong>Fleuriste / d\u00e9coration :</strong> 5 \u00e0 10 %</li>
  <li><strong>Tenue (robe, costume) :</strong> 5 \u00e0 10 %</li>
  <li><strong>Divers (papeterie, transport, impr\u00e9vus) :</strong> 5 \u00e0 10 %</li>
</ul>

<p>Avec un outil comme le <strong>module Budget de NUPLY</strong>, vous pouvez suivre chaque d\u00e9pense par cat\u00e9gorie et visualiser en temps r\u00e9el la r\u00e9partition de votre budget.</p>

<h2>2. \u00c9tablir un planning r\u00e9aliste</h2>

<p>L\u2019organisation d\u2019un mariage s\u2019\u00e9tale g\u00e9n\u00e9ralement sur 12 \u00e0 18 mois. Voici un calendrier rep\u00e8re :</p>

<h3>12 \u00e0 18 mois avant</h3>
<ul>
  <li>D\u00e9finir la date et le nombre d\u2019invit\u00e9s</li>
  <li>Visiter et r\u00e9server le lieu de r\u00e9ception</li>
  <li>Choisir votre traiteur</li>
  <li>Commencer la recherche de prestataires cl\u00e9s (photographe, DJ)</li>
</ul>

<h3>9 \u00e0 12 mois avant</h3>
<ul>
  <li>R\u00e9server le photographe et le vid\u00e9aste</li>
  <li>Choisir votre officiant (mairie, c\u00e9r\u00e9monie la\u00efque, religieuse)</li>
  <li>Commencer les essayages de robe / costume</li>
  <li>Envoyer les save-the-date</li>
</ul>

<h3>6 \u00e0 9 mois avant</h3>
<ul>
  <li>S\u00e9lectionner le fleuriste et d\u00e9finir la d\u00e9coration</li>
  <li>Choisir le DJ ou le groupe de musique</li>
  <li>Organiser les d\u00e9tails logistiques (h\u00e9bergement invit\u00e9s, transport)</li>
  <li>Commander la papeterie (faire-part, menu, plan de table)</li>
</ul>

<h3>3 \u00e0 6 mois avant</h3>
<ul>
  <li>Envoyer les faire-part</li>
  <li>Finaliser le menu avec le traiteur</li>
  <li>Organiser l\u2019enterrement de vie (gar\u00e7on / fille)</li>
  <li>Pr\u00e9parer vos voeux si c\u00e9r\u00e9monie la\u00efque</li>
</ul>

<h3>Le dernier mois</h3>
<ul>
  <li>Confirmer tous les prestataires et horaires</li>
  <li>Pr\u00e9parer le plan de table d\u00e9finitif</li>
  <li>Rassembler tous les documents administratifs pour la mairie</li>
  <li>Pr\u00e9voir un planning minute du jour J</li>
</ul>

<h2>3. Choisir les bons prestataires</h2>

<p>Le choix des prestataires est l\u2019\u00e9tape la plus d\u00e9terminante. Voici comment proc\u00e9der efficacement :</p>

<ul>
  <li><strong>Comparez au moins 3 devis</strong> pour chaque prestation</li>
  <li><strong>V\u00e9rifiez les avis et portfolios</strong> avant de vous engager</li>
  <li><strong>Rencontrez-les en personne</strong> ou en visio pour \u00e9valuer le feeling</li>
  <li><strong>Lisez les contrats</strong> attentivement (conditions d\u2019annulation, acompte, d\u00e9lais)</li>
</ul>

<p>Sur <strong>NUPLY</strong>, vous pouvez rechercher des prestataires v\u00e9rifi\u00e9s par m\u00e9tier et par localisation, leur envoyer des demandes de devis directement, et suivre l\u2019\u00e9tat de chaque \u00e9change depuis votre messagerie int\u00e9gr\u00e9e.</p>

<h2>4. Les d\u00e9marches administratives</h2>

<p>Ne n\u00e9gligez pas la partie administrative. Voici les \u00e9tapes obligatoires en France :</p>

<ul>
  <li><strong>Retirer un dossier de mariage</strong> \u00e0 la mairie du lieu de c\u00e9l\u00e9bration ou de r\u00e9sidence</li>
  <li><strong>Fournir les documents requis :</strong> pi\u00e8ces d\u2019identit\u00e9, justificatifs de domicile, actes de naissance de moins de 3 mois, informations sur les t\u00e9moins</li>
  <li><strong>Publier les bans :</strong> la mairie affiche les bans au moins 10 jours avant le mariage</li>
  <li><strong>Contrat de mariage :</strong> si vous optez pour un r\u00e9gime autre que la communaut\u00e9 r\u00e9duite aux acqu\u00eats, consultez un notaire au moins 2 mois avant</li>
</ul>

<h2>5. Ne pas oublier le jour J</h2>

<p>Le jour du mariage, quelques bonnes pratiques pour que tout se passe bien :</p>

<ul>
  <li><strong>D\u00e9l\u00e9guez :</strong> confiez la coordination \u00e0 un proche ou un wedding planner</li>
  <li><strong>Pr\u00e9parez un kit d\u2019urgence :</strong> mouchoirs, \u00e9pingles, antidouleurs, chargeur de t\u00e9l\u00e9phone</li>
  <li><strong>Mangez et hydratez-vous :</strong> beaucoup de mari\u00e9s oublient de manger le jour J</li>
  <li><strong>Profitez de chaque instant :</strong> la journ\u00e9e passe tr\u00e8s vite</li>
</ul>

<h2>6. Mariages multiculturels : quelques sp\u00e9cificit\u00e9s</h2>

<p>Si vous organisez un mariage multiculturel, certains aspects m\u00e9ritent une attention particuli\u00e8re :</p>

<ul>
  <li><strong>Combiner les traditions :</strong> c\u00e9r\u00e9monie, tenues, musiques, plats de chaque culture</li>
  <li><strong>Pr\u00e9voir des traductions</strong> si certains invit\u00e9s ne parlent pas la m\u00eame langue</li>
  <li><strong>Adapter le menu</strong> aux r\u00e9gimes alimentaires culturels ou religieux (halal, casher, v\u00e9g\u00e9tarien)</li>
  <li><strong>Choisir des prestataires exp\u00e9riment\u00e9s</strong> dans les mariages multiculturels</li>
</ul>

<p>NUPLY est sp\u00e9cialement con\u00e7u pour accompagner les couples dans la pr\u00e9paration de mariages qui c\u00e9l\u00e8brent la diversit\u00e9 et la richesse de chaque culture.</p>

<h2>En r\u00e9sum\u00e9</h2>

<p>Pr\u00e9parer un mariage, c\u2019est un projet \u00e0 part enti\u00e8re. Avec de l\u2019organisation, un budget ma\u00eetris\u00e9 et les bons prestataires, vous pouvez transformer cette p\u00e9riode en une aventure sereine et agr\u00e9able. L\u2019important est de garder en t\u00eate ce qui compte vraiment : c\u00e9l\u00e9brer votre amour entour\u00e9 de vos proches.</p>
`,
  },
  {
    slug: 'mariage-multiculturel-allier-deux-traditions',
    title: 'Mariage multiculturel : comment allier deux traditions en une seule c\u00e9l\u00e9bration',
    description: 'D\u00e9couvrez nos conseils pour r\u00e9ussir un mariage qui m\u00eale deux cultures, de la c\u00e9r\u00e9monie au repas, en passant par la tenue et la musique.',
    author: 'NUPLY',
    publishedAt: '2025-09-15',
    updatedAt: '2025-09-15',
    tags: ['Multiculturel', 'Traditions', 'Conseils'],
    readingTime: '7 min',
    content: `
<p>Un mariage multiculturel est une belle occasion de c\u00e9l\u00e9brer l\u2019union de deux personnes, mais aussi de deux familles, de deux histoires et de deux cultures. C\u2019est aussi un d\u00e9fi d\u2019organisation qui demande de la sensibilit\u00e9, de la cr\u00e9ativit\u00e9 et une bonne communication.</p>

<h2>1. Communiquer en amont avec les deux familles</h2>

<p>Le premier r\u00e9flexe \u00e0 adopter est d\u2019ouvrir le dialogue avec les deux familles le plus t\u00f4t possible. Chaque c\u00f4t\u00e9 a ses attentes, ses symboles et ses traditions importantes. Voici quelques questions \u00e0 aborder :</p>

<ul>
  <li><strong>Quels rituels sont incontournables</strong> pour chacune des familles ?</li>
  <li><strong>Y a-t-il des contraintes religieuses</strong> ou culturelles sp\u00e9cifiques (lieu de c\u00e9r\u00e9monie, horaires, tenue) ?</li>
  <li><strong>Comment int\u00e9grer les deux langues</strong> dans le d\u00e9roulement de la journ\u00e9e ?</li>
  <li><strong>Quel degr\u00e9 de formalit\u00e9</strong> est attendu de chaque c\u00f4t\u00e9 ?</li>
</ul>

<p>L\u2019objectif n\u2019est pas de satisfaire tout le monde \u00e0 100 %, mais de trouver un \u00e9quilibre o\u00f9 chacun se sent repr\u00e9sent\u00e9 et respect\u00e9.</p>

<h2>2. Concevoir une c\u00e9r\u00e9monie qui fusionne les deux cultures</h2>

<p>La c\u00e9r\u00e9monie est le moment le plus symbolique. Plusieurs options s\u2019offrent \u00e0 vous :</p>

<ul>
  <li><strong>Deux c\u00e9r\u00e9monies distinctes :</strong> une c\u00e9r\u00e9monie religieuse ou traditionnelle pour chaque culture, suivie d\u2019une f\u00eate commune</li>
  <li><strong>Une c\u00e9r\u00e9monie la\u00efque fusionn\u00e9e :</strong> int\u00e9grer des rituels des deux c\u00f4t\u00e9s dans un seul moment (par exemple, un rituel du sable, un handfasting celtique, ou une c\u00e9r\u00e9monie du th\u00e9)</li>
  <li><strong>Un officiant bilingue :</strong> pour que les deux familles comprennent chaque moment cl\u00e9</li>
</ul>

<p>Pensez \u00e9galement \u00e0 pr\u00e9voir un livret de c\u00e9r\u00e9monie bilingue qui explique chaque rituel, pour que tous les invit\u00e9s puissent appr\u00e9cier la richesse des deux traditions.</p>

<h2>3. Le repas : un voyage entre deux gastronomies</h2>

<p>Le repas est un moment cl\u00e9 o\u00f9 les cultures se rencontrent le plus concr\u00e8tement. Quelques approches possibles :</p>

<ul>
  <li><strong>Menu fusionn\u00e9 :</strong> un traiteur qui propose des plats m\u00ealant les saveurs des deux cultures</li>
  <li><strong>Deux traiteurs :</strong> un pour chaque cuisine, avec un buffet ou des stations th\u00e9matiques</li>
  <li><strong>Entr\u00e9e d\u2019une culture, plat d\u2019une autre :</strong> une alternance naturelle dans le menu</li>
</ul>

<p>N\u2019oubliez pas de prendre en compte les restrictions alimentaires li\u00e9es \u00e0 chaque culture : halal, casher, v\u00e9g\u00e9tarien, sans porc, etc. Un bon traiteur saura adapter ses propositions.</p>

<h2>4. La tenue : entre modernit\u00e9 et tradition</h2>

<p>Pour les tenues, il est tout \u00e0 fait possible de porter des v\u00eatements traditionnels pour une partie de la journ\u00e9e et de changer pour la soir\u00e9e :</p>

<ul>
  <li><strong>C\u00e9r\u00e9monie :</strong> tenue traditionnelle d\u2019une des deux cultures</li>
  <li><strong>R\u00e9ception :</strong> robe de mari\u00e9e ou costume classique</li>
  <li><strong>Soir\u00e9e :</strong> tenue traditionnelle de l\u2019autre culture pour un changement marqu\u00e9</li>
</ul>

<p>Certains couturiers se sp\u00e9cialisent dans la cr\u00e9ation de tenues hybrides qui combinent des \u00e9l\u00e9ments de deux traditions vestimentaires.</p>

<h2>5. La musique et l\u2019ambiance</h2>

<p>La musique est un liant puissant pour faire se rencontrer deux cultures. Pr\u00e9voyez :</p>

<ul>
  <li><strong>Un DJ ou un orchestre</strong> qui ma\u00eetrise les deux r\u00e9pertoires musicaux</li>
  <li><strong>Des moments d\u00e9di\u00e9s</strong> \u00e0 chaque culture (danses traditionnelles, entr\u00e9es des mari\u00e9s avec musique de chaque c\u00f4t\u00e9)</li>
  <li><strong>Des transitions douces</strong> entre les deux univers musicaux pour que la f\u00eate reste fluide</li>
</ul>

<h2>6. Choisir des prestataires exp\u00e9riment\u00e9s</h2>

<p>Un mariage multiculturel demande des prestataires qui comprennent les enjeux de chaque culture. Privil\u00e9giez ceux qui ont d\u00e9j\u00e0 une exp\u00e9rience dans ce type de c\u00e9l\u00e9bration.</p>

<p>Sur <strong>NUPLY</strong>, vous pouvez filtrer les prestataires par cultures g\u00e9r\u00e9es. Notre algorithme de matching tient compte de vos pr\u00e9f\u00e9rences culturelles pour vous proposer les professionnels les plus adapt\u00e9s \u00e0 votre mariage unique.</p>

<h2>En r\u00e9sum\u00e9</h2>

<p>Un mariage multiculturel est un projet ambitieux mais profond\u00e9ment beau. En planifiant avec soin, en communiquant ouvertement et en s\u2019entourant des bons prestataires, vous pouvez cr\u00e9er une c\u00e9l\u00e9bration qui honore vos deux histoires et cr\u00e9e une nouvelle tradition : la v\u00f4tre.</p>
`,
  },
  {
    slug: 'tendances-mariage-2026',
    title: 'Les tendances mariage 2026 : ce qui change cette ann\u00e9e',
    description: 'Micro-mariages, \u00e9co-responsabilit\u00e9, IA et personnalisation\u2026 d\u00e9couvrez les grandes tendances qui fa\u00e7onnent les mariages en 2026.',
    author: 'NUPLY',
    publishedAt: '2026-01-10',
    updatedAt: '2026-01-10',
    tags: ['Tendances', 'Inspiration', '2026'],
    readingTime: '6 min',
    content: `
<p>Chaque ann\u00e9e apporte son lot de nouvelles tendances dans l\u2019univers du mariage. 2026 ne fait pas exception, avec des \u00e9volutions qui refl\u00e8tent les pr\u00e9occupations actuelles des couples : authenticit\u00e9, durabilit\u00e9 et personnalisation pouss\u00e9e.</p>

<h2>1. Les micro-mariages continuent de s\u00e9duire</h2>

<p>La tendance des petits mariages intimes, lanc\u00e9e pendant la p\u00e9riode post-Covid, s\u2019est ancr\u00e9e durablement. En 2026, environ 35 % des couples optent pour un mariage de moins de 50 invit\u00e9s.</p>

<ul>
  <li><strong>Avantages :</strong> budget mieux ma\u00eetris\u00e9, exp\u00e9rience plus personnalis\u00e9e, lieu de r\u00e9ception atypique possible</li>
  <li><strong>Tendance associ\u00e9e :</strong> les \u00ab \u00e9lopements \u00bb organis\u00e9s (mariages \u00e0 deux + photographe) gagnent en popularit\u00e9</li>
  <li><strong>Budget moyen :</strong> entre 5 000 \u20ac et 15 000 \u20ac pour un micro-mariage de qualit\u00e9</li>
</ul>

<h2>2. L\u2019\u00e9co-responsabilit\u00e9 au coeur des choix</h2>

<p>Les couples de 2026 sont de plus en plus soucieux de l\u2019impact environnemental de leur mariage. Voici les pratiques qui se d\u00e9mocratisent :</p>

<ul>
  <li><strong>Fleurs locales et de saison :</strong> fini les roses import\u00e9es du Kenya en plein hiver</li>
  <li><strong>D\u00e9coration r\u00e9utilis\u00e9e ou lou\u00e9e :</strong> les plateformes de location de d\u00e9co de mariage explosent</li>
  <li><strong>Menu locavore :</strong> des traiteurs qui privil\u00e9gient les circuits courts et les produits de saison</li>
  <li><strong>Faire-part num\u00e9riques :</strong> les invitations digitales remplac\u00e9es par des sites web de mariage personnalis\u00e9s</li>
  <li><strong>Robe de seconde main :</strong> de plus en plus de mari\u00e9es optent pour une robe vintage ou d\u2019occasion, sans compromis sur l\u2019\u00e9l\u00e9gance</li>
</ul>

<h2>3. L\u2019intelligence artificielle au service du mariage</h2>

<p>L\u2019IA s\u2019invite dans l\u2019organisation du mariage de mani\u00e8re concr\u00e8te :</p>

<ul>
  <li><strong>Matching intelligent :</strong> des plateformes comme NUPLY utilisent l\u2019IA pour connecter les couples aux prestataires les plus compatibles</li>
  <li><strong>G\u00e9n\u00e9ration de plans de table :</strong> des outils qui optimisent le placement en fonction des affinit\u00e9s entre invit\u00e9s</li>
  <li><strong>Gestion budg\u00e9taire pr\u00e9dictive :</strong> des algorithmes qui anticipent les d\u00e9passements de budget</li>
  <li><strong>Inspiration visuelle :</strong> des mood boards g\u00e9n\u00e9r\u00e9s par IA pour visualiser sa d\u00e9coration</li>
</ul>

<h2>4. La personnalisation extr\u00eame</h2>

<p>En 2026, le mot d\u2019ordre est : \u00ab aucun mariage ne doit ressembler \u00e0 un autre \u00bb. Les couples poussent la personnalisation :</p>

<ul>
  <li><strong>Parfum sur-mesure :</strong> cr\u00e9er un parfum unique pour le couple, diffus\u00e9 lors de la c\u00e9r\u00e9monie</li>
  <li><strong>Cocktails signature :</strong> des boissons cr\u00e9\u00e9es sp\u00e9cialement pour l\u2019\u00e9v\u00e9nement</li>
  <li><strong>Playlist autobiographique :</strong> une s\u00e9lection musicale qui retrace l\u2019histoire du couple</li>
  <li><strong>Voeux personnalis\u00e9s :</strong> de moins en moins de formules g\u00e9n\u00e9riques, de plus en plus de textes intimes lus devant les proches</li>
</ul>

<h2>5. Le retour des c\u00e9r\u00e9monies en plein air</h2>

<p>Les lieux de r\u00e9ception en ext\u00e9rieur sont plus demand\u00e9s que jamais :</p>

<ul>
  <li><strong>Domaines viticoles :</strong> mariage au milieu des vignes, avec d\u00e9gustation</li>
  <li><strong>For\u00eats et jardins botaniques :</strong> pour une atmosph\u00e8re enchant\u00e9e et naturelle</li>
  <li><strong>Rooftops urbains :</strong> pour les couples citadins qui veulent la ville en toile de fond</li>
  <li><strong>Plages priv\u00e9es :</strong> pieds dans le sable, ciel ouvert et coucher de soleil</li>
</ul>

<h2>6. La semaine de mariage</h2>

<p>De plus en plus de couples \u00e9talent les festivit\u00e9s sur plusieurs jours :</p>

<ul>
  <li><strong>Vendredi soir :</strong> d\u00eener de bienvenue informel pour les proches</li>
  <li><strong>Samedi :</strong> c\u00e9r\u00e9monie et grande r\u00e9ception</li>
  <li><strong>Dimanche :</strong> brunch de cl\u00f4ture en toute d\u00e9contraction</li>
</ul>

<p>Cette approche permet de passer plus de temps avec ses invit\u00e9s et de profiter pleinement de chaque moment.</p>

<h2>En r\u00e9sum\u00e9</h2>

<p>2026 est l\u2019ann\u00e9e de l\u2019authenticit\u00e9 et de la technologie au service de l\u2019humain. Les couples veulent un mariage qui leur ressemble, qui respecte l\u2019environnement et qui utilise les outils modernes pour simplifier l\u2019organisation. Avec NUPLY, vous avez acc\u00e8s \u00e0 des prestataires qui comprennent ces nouvelles tendances et peuvent vous accompagner dans la cr\u00e9ation de votre c\u00e9l\u00e9bration unique.</p>
`,
  },
  {
    slug: 'checklist-ultime-jour-j',
    title: 'La check-list ultime pour ne rien oublier le jour J',
    description: 'De la veille du mariage aux derni\u00e8res heures de la f\u00eate, voici tout ce que vous devez pr\u00e9voir pour que votre journ\u00e9e soit parfaite.',
    author: 'NUPLY',
    publishedAt: '2026-02-05',
    updatedAt: '2026-02-05',
    tags: ['Organisation', 'Jour J', 'Check-list'],
    readingTime: '5 min',
    content: `
<p>Le jour de votre mariage approche et vous voulez \u00eatre s\u00fbr de ne rien oublier ? Cette check-list compl\u00e8te, organis\u00e9e chronologiquement, vous aidera \u00e0 aborder le jour J avec s\u00e9r\u00e9nit\u00e9.</p>

<h2>1. La semaine avant le mariage</h2>

<p>Les derniers pr\u00e9paratifs sont cruciaux. Voici ce qu\u2019il faut boucler :</p>

<ul>
  <li><strong>Confirmer tous les prestataires :</strong> appelez chacun pour reconfirmer les horaires, lieux et d\u00e9tails logistiques</li>
  <li><strong>Plan de table d\u00e9finitif :</strong> finalisez le placement et transmettez-le au traiteur et au DJ</li>
  <li><strong>Essayage final :</strong> v\u00e9rifiez que la robe et le costume sont pr\u00eats et ajust\u00e9s</li>
  <li><strong>Pr\u00e9parer les enveloppes de paiement :</strong> certains prestataires demandent le solde le jour J</li>
  <li><strong>R\u00e9cup\u00e9rer les alliances :</strong> v\u00e9rifiez la gravure et la taille</li>
  <li><strong>Pr\u00e9parer les discours :</strong> relisez vos voeux et briefez les t\u00e9moins</li>
</ul>

<h2>2. La veille du mariage</h2>

<p>Le jour d\u2019avant, l\u2019objectif est simple : restez zen.</p>

<ul>
  <li><strong>D\u00e9poser la d\u00e9coration au lieu de r\u00e9ception</strong> si c\u2019est possible (ou d\u00e9l\u00e9guer)</li>
  <li><strong>Pr\u00e9parer un sac avec tout le n\u00e9cessaire</strong> pour le lendemain (voir le kit d\u2019urgence ci-dessous)</li>
  <li><strong>V\u00e9rifier les documents administratifs :</strong> livret de famille, pi\u00e8ces d\u2019identit\u00e9, dossier de mariage</li>
  <li><strong>D\u00eener l\u00e9ger</strong> et couchez-vous t\u00f4t</li>
  <li><strong>Charger t\u00e9l\u00e9phone et cam\u00e9ra :</strong> pr\u00e9voyez des batteries de rechange</li>
</ul>

<h2>3. Le kit d\u2019urgence indispensable</h2>

<p>Pr\u00e9parez un petit sac avec les essentiels qui peuvent sauver la journ\u00e9e :</p>

<ul>
  <li><strong>Sant\u00e9 :</strong> antidouleurs, pansements, antihistaminiques, pastilles pour la gorge</li>
  <li><strong>Couture :</strong> kit de couture d\u2019urgence, \u00e9pingles \u00e0 nourrice, ruban adh\u00e9sif double face</li>
  <li><strong>Beaut\u00e9 :</strong> d\u00e9tachant textile, brumisateur, mouchoirs, rouge \u00e0 l\u00e8vres de retouche</li>
  <li><strong>Pratique :</strong> chargeur de t\u00e9l\u00e9phone, batterie externe, stylo, esp\u00e8ces</li>
  <li><strong>Confort :</strong> chaussures plates de rechange, d\u00e9odorant, snacks \u00e9nerg\u00e9tiques</li>
</ul>

<h2>4. Le matin du jour J</h2>

<p>Votre planning minute commence. Voici un d\u00e9roulement type :</p>

<ul>
  <li><strong>R\u00e9veil :</strong> prenez un bon petit-d\u00e9jeuner, m\u00eame si le stress coupe l\u2019app\u00e9tit</li>
  <li><strong>Pr\u00e9paration :</strong> coiffure, maquillage, habillage (pr\u00e9voyez 2 \u00e0 3 heures)</li>
  <li><strong>Photos \u00ab getting ready \u00bb :</strong> le photographe capture les pr\u00e9paratifs</li>
  <li><strong>V\u00e9rification finale :</strong> alliances, documents, kit d\u2019urgence, num\u00e9ros des prestataires</li>
  <li><strong>D\u00e9part vers la c\u00e9r\u00e9monie :</strong> pr\u00e9voyez 30 minutes de marge</li>
</ul>

<h2>5. Pendant la c\u00e9r\u00e9monie et la r\u00e9ception</h2>

<p>Quelques rappels pour profiter pleinement :</p>

<ul>
  <li><strong>D\u00e9signez un \u00ab chef d\u2019orchestre \u00bb :</strong> une personne de confiance (ou un wedding planner) qui g\u00e8re la logistique \u00e0 votre place</li>
  <li><strong>Hydratez-vous r\u00e9guli\u00e8rement :</strong> gardez une bouteille d\u2019eau \u00e0 port\u00e9e de main</li>
  <li><strong>Mangez !</strong> Demandez au traiteur de vous mettre une assiette de c\u00f4t\u00e9</li>
  <li><strong>Prenez des moments \u00e0 deux :</strong> \u00e9chappez-vous quelques minutes ensemble pour souffler</li>
  <li><strong>Profitez de la piste de danse :</strong> c\u2019est VOTRE soir\u00e9e</li>
</ul>

<h2>6. Apr\u00e8s la f\u00eate</h2>

<p>Une fois les festivit\u00e9s termin\u00e9es, il reste quelques d\u00e9tails :</p>

<ul>
  <li><strong>R\u00e9cup\u00e9rer la d\u00e9coration</strong> et les objets personnels au lieu de r\u00e9ception</li>
  <li><strong>Remercier les prestataires :</strong> un message ou un avis en ligne fait toujours plaisir</li>
  <li><strong>Envoyer les remerciements</strong> aux invit\u00e9s dans les semaines qui suivent</li>
  <li><strong>Profiter de la lune de miel :</strong> vous l\u2019avez bien m\u00e9rit\u00e9e !</li>
</ul>

<h2>En r\u00e9sum\u00e9</h2>

<p>Avec cette check-list, vous avez toutes les cl\u00e9s pour vivre votre jour J sans stress. L\u2019anticipation et la d\u00e9l\u00e9gation sont vos meilleurs alli\u00e9s. Et avec la <strong>timeline de NUPLY</strong>, vous pouvez organiser chaque \u00e9tape visuellement et vous assurer de ne rien laisser au hasard.</p>
`,
  },
  {
    slug: 'mariage-chretien-guide-complet',
    title: 'Mariage chrétien : guide complet pour organiser une cérémonie religieuse inoubliable',
    description: 'Découvrez les étapes, traditions et conseils pratiques pour préparer votre mariage chrétien (catholique, protestant, orthodoxe). Trouvez les prestataires adaptés avec NUPLY.',
    author: 'NUPLY',
    publishedAt: '2025-11-18',
    updatedAt: '2025-11-18',
    tags: ['Mariage religieux', 'Chrétien', 'Traditions'],
    readingTime: '9 min',
    content: `
<p>Le mariage chrétien est bien plus qu'une simple fête : c'est un sacrement, un engagement devant Dieu et devant la communauté. Que vous soyez catholique, protestant ou orthodoxe, la cérémonie religieuse est le cœur de votre union. Voici tout ce que vous devez savoir pour organiser un mariage chrétien qui reflète votre foi et votre amour.</p>

<h2>1. Les fondements du mariage chrétien</h2>

<p>Dans la tradition chrétienne, le mariage est considéré comme une alliance sacrée. Il repose sur trois piliers fondamentaux :</p>

<ul>
  <li><strong>L'indissolubilité :</strong> le mariage est un engagement pour la vie, « ce que Dieu a uni, que l'homme ne le sépare pas » (Matthieu 19:6)</li>
  <li><strong>La fidélité :</strong> les époux se promettent un amour exclusif et sincère</li>
  <li><strong>L'ouverture à la vie :</strong> le couple s'engage à accueillir les enfants comme un don de Dieu</li>
</ul>

<p>Selon les confessions, certaines nuances existent. Le mariage catholique est un sacrement administré par les époux eux-mêmes devant le prêtre. Chez les protestants, c'est une bénédiction divine du couple. Dans l'orthodoxie, c'est le couronnement des époux, symbole de leur union avec le Christ.</p>

<h2>2. La préparation au mariage catholique</h2>

<p>En France, la préparation au mariage catholique débute généralement <strong>10 à 12 mois avant la date</strong>. Voici les étapes incontournables :</p>

<ul>
  <li><strong>Contacter la paroisse :</strong> prenez rendez-vous avec le curé de votre paroisse dès que possible. Les créneaux à l'église sont limités, surtout en saison haute (mai-septembre)</li>
  <li><strong>La préparation au mariage (CPM) :</strong> 4 à 6 séances avec d'autres couples et un couple accompagnateur. On y aborde la communication, la gestion des conflits, la foi et l'ouverture à la vie</li>
  <li><strong>Constituer le dossier :</strong> certificats de baptême de moins de 6 mois, acte de mariage civil (le mariage civil doit précéder le mariage religieux en France), formulaire de publication des bans</li>
  <li><strong>Choisir les lectures et les chants :</strong> vous sélectionnez généralement deux lectures bibliques, un psaume et un évangile avec l'aide du prêtre</li>
  <li><strong>Répétition :</strong> une répétition à l'église est organisée quelques jours avant le mariage</li>
</ul>

<h2>3. Le déroulement de la cérémonie</h2>

<p>La messe de mariage catholique dure environ 1 heure (45 minutes sans eucharistie). Voici les temps forts :</p>

<ul>
  <li><strong>L'entrée dans l'église :</strong> le cortège entre au son de l'orgue ou d'un chant. La mariée est traditionnellement accompagnée de son père</li>
  <li><strong>La liturgie de la Parole :</strong> lectures bibliques choisies par les époux, psaume chanté, homélie du prêtre</li>
  <li><strong>L'échange des consentements :</strong> le moment le plus solennel. Les époux se déclarent mutuellement « je te reçois comme époux/épouse et je me donne à toi »</li>
  <li><strong>La bénédiction et l'échange des alliances :</strong> le prêtre bénit les alliances, symboles de l'alliance éternelle</li>
  <li><strong>La prière universelle :</strong> intentions de prière lues par les proches</li>
  <li><strong>La bénédiction nuptiale :</strong> prière solennelle sur le couple</li>
  <li><strong>La signature des registres :</strong> les époux et les témoins signent le registre paroissial</li>
  <li><strong>La sortie :</strong> traditionnellement sous une haie d'honneur, avec lancé de pétales ou de riz</li>
</ul>

<h2>4. Les spécificités du mariage protestant</h2>

<p>Le mariage protestant, ou culte de bénédiction, présente quelques différences :</p>

<ul>
  <li><strong>Pas de sacrement :</strong> le mariage est une bénédiction, pas un sacrement. Le mariage civil suffit aux yeux de l'Église</li>
  <li><strong>Plus de liberté :</strong> le couple a davantage de latitude dans le choix des textes, des chants et du déroulement</li>
  <li><strong>Préparation plus courte :</strong> généralement 3 à 4 rencontres avec le pasteur</li>
  <li><strong>Le temple :</strong> la cérémonie peut avoir lieu dans un temple, mais aussi en extérieur ou dans un lieu atypique</li>
  <li><strong>Les témoignages :</strong> il est courant que des proches prennent la parole pendant la cérémonie pour témoigner</li>
</ul>

<h2>5. Le mariage orthodoxe : le couronnement</h2>

<p>Le mariage orthodoxe est l'une des cérémonies les plus riches visuellement et symboliquement :</p>

<ul>
  <li><strong>Les fiançailles :</strong> échange des alliances au début de la cérémonie, bénies par le prêtre</li>
  <li><strong>Le couronnement :</strong> des couronnes (stephana) sont posées sur la tête des époux, symbolisant leur union avec le Christ et leur royauté sur leur foyer</li>
  <li><strong>La coupe de vin :</strong> les époux boivent dans la même coupe, rappelant les noces de Cana</li>
  <li><strong>La marche d'Isaïe :</strong> le couple fait trois tours autour de l'autel, couronnés, symbolisant leur premier voyage ensemble</li>
  <li><strong>Durée :</strong> la cérémonie dure environ 1h à 1h30</li>
  <li><strong>Pas de mariage mixte sans autorisation :</strong> un mariage avec un non-orthodoxe nécessite une dispense de l'évêque</li>
</ul>

<h2>6. Choisir les bons prestataires pour un mariage chrétien</h2>

<p>Un mariage religieux demande des prestataires qui comprennent les codes et le rythme de la cérémonie :</p>

<ul>
  <li><strong>Photographe :</strong> il doit connaître le déroulement de la messe pour capturer les moments clés sans être intrusif. Certaines paroisses imposent des restrictions (pas de flash, zones interdites)</li>
  <li><strong>Fleuriste :</strong> la décoration de l'église (bout de bancs, autel, entrée) doit respecter les règles du lieu de culte</li>
  <li><strong>Musiciens / organiste :</strong> un organiste ou un groupe de gospel peut sublimer la cérémonie. Vérifiez avec le curé ce qui est autorisé</li>
  <li><strong>Traiteur :</strong> si vous enchaînez cérémonie et réception, le timing est crucial. Le traiteur doit s'adapter au planning</li>
</ul>

<p>Sur <strong>NUPLY</strong>, vous pouvez filtrer les prestataires par expérience culturelle et religieuse. Notre algorithme de <strong>Nuply Matching</strong> identifie automatiquement les professionnels habitués aux mariages chrétiens dans votre région, qu'il s'agisse de photographes respectueux du cadre liturgique, de fleuristes spécialisés dans la décoration d'église, ou de traiteurs maîtrisant le timing d'une cérémonie religieuse.</p>

<h2>7. Budget et conseils pratiques</h2>

<p>Quelques éléments budgétaires spécifiques au mariage chrétien :</p>

<ul>
  <li><strong>Offrande à la paroisse :</strong> entre 150 € et 500 € selon les paroisses (ce n'est pas un tarif fixe, mais une participation libre)</li>
  <li><strong>Organiste :</strong> entre 200 € et 500 € selon la durée et le répertoire</li>
  <li><strong>Décoration florale de l'église :</strong> entre 300 € et 1 500 € selon l'ampleur</li>
  <li><strong>Livret de messe :</strong> entre 100 € et 300 € pour l'impression (ou gratuit en version numérique)</li>
</ul>

<p>Avec le <strong>module Budget de NUPLY</strong>, vous pouvez créer une catégorie dédiée « Cérémonie religieuse » pour suivre ces dépenses spécifiques et garder le contrôle sur votre budget global.</p>

<h2>En résumé</h2>

<p>Le mariage chrétien est un moment de grâce et de joie qui demande une préparation à la fois spirituelle et logistique. Quelle que soit votre confession, l'essentiel est de vivre ce jour comme un vrai engagement de foi et d'amour. Avec NUPLY, vous trouverez les prestataires qui respecteront la solennité de votre cérémonie tout en créant une fête à votre image.</p>
`,
  },
  {
    slug: 'mariage-musulman-guide-traditions-organisation',
    title: 'Mariage musulman : traditions, étapes et organisation du nikah à la walima',
    description: 'Tout savoir sur le mariage musulman : le nikah, la mahr, la walima, les traditions culturelles et comment NUPLY vous aide à trouver des prestataires halal et expérimentés.',
    author: 'NUPLY',
    publishedAt: '2025-12-09',
    updatedAt: '2025-12-09',
    tags: ['Mariage religieux', 'Musulman', 'Traditions'],
    readingTime: '10 min',
    content: `
<p>Le mariage en islam (nikah) est un contrat sacré entre deux personnes, fondé sur l'amour, le respect mutuel et la volonté de construire une famille. C'est aussi une fête joyeuse qui rassemble les deux familles dans la célébration. Voici un guide complet pour organiser votre mariage musulman dans les meilleures conditions.</p>

<h2>1. Les fondements du mariage en islam</h2>

<p>Le mariage est fortement encouragé en islam. Le Prophète Muhammad (paix et bénédictions sur lui) a dit : « Le mariage fait partie de ma tradition. Celui qui ne suit pas ma tradition ne fait pas partie des miens » (Hadith rapporté par Ibn Majah). Le nikah repose sur plusieurs piliers :</p>

<ul>
  <li><strong>Le consentement mutuel :</strong> les deux époux doivent exprimer librement et clairement leur accord (ijab et qabul)</li>
  <li><strong>Le wali (tuteur) :</strong> la mariée est représentée par un tuteur, généralement son père. C'est une condition de validité dans la majorité des écoles juridiques</li>
  <li><strong>La mahr (dot) :</strong> le marié offre un cadeau à la mariée. Cela peut être une somme d'argent, un bijou, un voyage, ou tout bien convenu entre les deux parties. La mahr appartient exclusivement à la mariée</li>
  <li><strong>Les témoins :</strong> au minimum deux témoins musulmans majeurs doivent être présents</li>
  <li><strong>La publicité du mariage :</strong> le mariage ne doit pas être secret. C'est pourquoi la fête (walima) est vivement recommandée</li>
</ul>

<h2>2. Les étapes du mariage musulman</h2>

<p>L'organisation d'un mariage musulman se déroule généralement en plusieurs temps :</p>

<h3>La khotba (demande en mariage)</h3>
<p>La famille du futur marié se rend chez la famille de la future mariée pour demander officiellement sa main. C'est un moment solennel et joyeux, souvent accompagné de pâtisseries et de thé. Les deux familles discutent des conditions du mariage (mahr, date, lieu).</p>

<h3>La fatiha (lecture de la sourate d'ouverture)</h3>
<p>Une fois l'accord donné, une lecture de la sourate Al-Fatiha scelle l'engagement. Ce moment, souvent intime, réunit les proches des deux familles et un imam ou un aîné respecté.</p>

<h3>Le nikah (acte de mariage religieux)</h3>
<p>Le nikah est la cérémonie religieuse proprement dite. Il peut avoir lieu à la mosquée, au domicile familial, ou dans la salle de réception. L'imam prononce un sermon (khutbat al-nikah), puis les époux échangent leurs consentements. Le contrat de mariage est signé en présence des témoins.</p>

<h3>La walima (fête du mariage)</h3>
<p>La walima est le banquet qui suit le nikah. C'est une sunna (tradition prophétique) fortement recommandée. Elle peut avoir lieu le jour même ou le lendemain. La walima est l'occasion de célébrer l'union devant la communauté, avec un repas généreux, de la musique et des danses.</p>

<h2>3. Les traditions culturelles qui enrichissent le mariage</h2>

<p>Au-delà du cadre religieux, chaque culture musulmane apporte ses propres traditions. Voici les plus répandues en France :</p>

<ul>
  <li><strong>Le henné :</strong> une soirée dédiée (souvent la veille du mariage) où la mariée se fait appliquer du henné sur les mains et les pieds. C'est un moment festif entre femmes, avec musique et danse</li>
  <li><strong>Le hammam :</strong> la mariée se rend au hammam avec ses proches pour un rituel de purification et de beauté</li>
  <li><strong>Les tenues multiples :</strong> dans les traditions maghrébines, la mariée peut changer de tenue 5 à 7 fois pendant la soirée, portant des caftans et des robes de différentes régions</li>
  <li><strong>L'amariya (palanquin) :</strong> dans la tradition marocaine, la mariée est portée sur un palanquin à l'entrée de la salle</li>
  <li><strong>Le youyou (zagharit) :</strong> les femmes poussent des cris de joie traditionnels pour célébrer les moments forts</li>
  <li><strong>La negafa ou le neggaf :</strong> un(e) professionnel(le) qui accompagne la mariée tout au long de la soirée pour les changements de tenues et le maquillage</li>
</ul>

<h2>4. Le repas : halal et festif</h2>

<p>Le repas de mariage musulman obéit aux règles alimentaires islamiques :</p>

<ul>
  <li><strong>Viande halal obligatoire :</strong> la viande servie doit être certifiée halal. Vérifiez les certificats du traiteur</li>
  <li><strong>Pas d'alcool :</strong> selon la pratique des familles. Certains couples proposent des cocktails sans alcool élaborés, des jus frais et des mocktails créatifs</li>
  <li><strong>Générosité du repas :</strong> la sunna encourage un repas copieux. Les buffets sont très populaires, avec des plats variés (couscous, tajines, méchoui, pastilla, etc.)</li>
  <li><strong>La pièce montée :</strong> les choux à la crème, la pièce montée traditionnelle ou le wedding cake sont tous courants</li>
  <li><strong>Les pâtisseries orientales :</strong> cornes de gazelle, baklavas, makrouts, briouates sont souvent servis en accompagnement ou en pièce d'honneur</li>
</ul>

<h2>5. La musique et l'ambiance</h2>

<p>La fête de mariage musulman est réputée pour son énergie et sa convivialité :</p>

<ul>
  <li><strong>DJ spécialisé :</strong> un DJ qui maîtrise le répertoire oriental, raï, chaâbi, et aussi les tubes internationaux pour faire danser tout le monde</li>
  <li><strong>Orchestre :</strong> certains couples optent pour un orchestre live (derbouka, violon, oud) pour une ambiance authentique</li>
  <li><strong>Séparation hommes/femmes :</strong> selon les familles, la fête peut être mixte ou séparée. Prévoyez l'aménagement de la salle en conséquence</li>
  <li><strong>Les zeffas :</strong> entrées spectaculaires des mariés avec percussions et chants</li>
</ul>

<h2>6. Organisation et budget</h2>

<p>Les mariages musulmans sont souvent des événements de grande envergure. Voici les postes budgétaires spécifiques à anticiper :</p>

<ul>
  <li><strong>Nombre d'invités élevé :</strong> 200 à 500 invités ne sont pas rares. Le lieu et le traiteur représentent la part la plus importante du budget</li>
  <li><strong>Traiteur halal :</strong> comptez entre 40 € et 100 € par personne selon le menu et le service</li>
  <li><strong>Negafa / accompagnatrice :</strong> entre 500 € et 3 000 € selon les prestations et le nombre de tenues</li>
  <li><strong>Soirée henné :</strong> entre 500 € et 2 000 € (lieu, animation, henneuse professionnelle)</li>
  <li><strong>DJ / orchestre oriental :</strong> entre 800 € et 3 000 €</li>
  <li><strong>Décoration orientale :</strong> entre 1 000 € et 5 000 € (drapés, centres de table, éclairages)</li>
</ul>

<p>La <strong>gestion de budget intégrée à NUPLY</strong> vous permet de créer des catégories personnalisées (henné, negafa, traiteur halal) et de suivre chaque dépense en temps réel. Vous gardez ainsi une vision claire de votre budget, même pour un mariage de grande envergure.</p>

<h2>7. Trouver les bons prestataires avec NUPLY</h2>

<p>Organiser un mariage musulman implique de trouver des prestataires qui comprennent vos exigences religieuses et culturelles. C'est précisément la force de NUPLY :</p>

<ul>
  <li><strong>Filtrage par culture :</strong> recherchez des prestataires expérimentés dans les mariages musulmans, maghrébins, turcs, sub-sahariens ou d'autres traditions</li>
  <li><strong>Matching intelligent :</strong> notre algorithme prend en compte vos critères culturels, votre budget et votre localisation pour vous proposer les prestataires les plus adaptés</li>
  <li><strong>Messagerie intégrée :</strong> échangez directement avec les traiteurs halal, les DJ orientaux, les negafas et tous vos prestataires depuis la plateforme</li>
  <li><strong>Avis vérifiés :</strong> consultez les retours d'autres couples qui ont organisé un mariage similaire au vôtre</li>
</ul>

<h2>En résumé</h2>

<p>Le mariage musulman est un événement riche en émotions, en traditions et en partage. Du nikah à la walima, chaque étape a sa beauté et sa signification. Avec une bonne organisation et les bons prestataires, votre mariage sera à la hauteur de vos rêves. NUPLY est là pour vous accompagner à chaque étape, en vous connectant avec des professionnels qui respectent et comprennent vos traditions.</p>
`,
  },
  {
    slug: 'mariage-juif-guide-ceremonies-traditions',
    title: 'Mariage juif : de la houpa à la hora, guide des cérémonies et traditions',
    description: 'Tout savoir sur le mariage juif : la houpa, la ketouba, les 7 bénédictions, le verre brisé et les traditions. Trouvez vos prestataires casher avec NUPLY.',
    author: 'NUPLY',
    publishedAt: '2026-01-20',
    updatedAt: '2026-01-20',
    tags: ['Mariage religieux', 'Juif', 'Traditions'],
    readingTime: '9 min',
    content: `
<p>Le mariage juif est l'un des événements les plus joyeux et les plus symboliques de la vie juive. Riche en rituels millénaires, il célèbre l'union de deux âmes (« bashert ») sous le regard de Dieu et de la communauté. Que vous soyez pratiquant ou attaché aux traditions, voici un guide complet pour organiser un mariage juif mémorable.</p>

<h2>1. Les fondements du mariage dans le judaïsme</h2>

<p>Dans la tradition juive, le mariage (kiddoushin) est un acte sacré. Le terme hébreu signifie littéralement « sanctification », car le couple se consacre l'un à l'autre. Le mariage repose sur plusieurs principes :</p>

<ul>
  <li><strong>Le consentement mutuel :</strong> les deux époux doivent exprimer librement leur volonté de s'unir</li>
  <li><strong>La ketouba (contrat de mariage) :</strong> un document écrit en araméen qui détaille les obligations du mari envers son épouse. C'est un acte juridique religieux qui protège les droits de la femme</li>
  <li><strong>La présence de témoins :</strong> deux témoins juifs pratiquants sont requis pour valider le mariage</li>
  <li><strong>Le rabbin :</strong> il dirige la cérémonie, prononce les bénédictions et veille au respect des lois religieuses (halakha)</li>
</ul>

<h2>2. Avant le mariage : les préparatifs traditionnels</h2>

<p>Plusieurs traditions précèdent le jour du mariage :</p>

<h3>Le Vort (fiançailles)</h3>
<p>L'annonce officielle des fiançailles, souvent célébrée par un repas en famille. Les tenaim (conditions du mariage) peuvent être signés à cette occasion, accompagnés du bris symbolique d'une assiette.</p>

<h3>Le Shabbat Hatan (Shabbat du marié)</h3>
<p>Le shabbat précédant le mariage, le marié est appelé à la Torah à la synagogue. C'est un honneur appelé « aliyah ». La communauté lui chante des chants de joie et lui lance des bonbons.</p>

<h3>Le Mikvé</h3>
<p>La mariée se rend au mikvé (bain rituel) avant le mariage, un acte de purification spirituelle qui marque le début d'une nouvelle étape de sa vie.</p>

<h3>Le jeûne</h3>
<p>Le jour du mariage, les époux jeûnent traditionnellement jusqu'à la cérémonie, en signe de repentance et de renouveau spirituel (comme à Yom Kippour).</p>

<h2>3. Le déroulement de la cérémonie</h2>

<p>La cérémonie du mariage juif se compose de deux parties distinctes, aujourd'hui généralement combinées :</p>

<h3>Le Kabbalat Panim (accueil des invités)</h3>
<p>Avant la cérémonie, le marié et la mariée reçoivent séparément leurs invités. Le marié signe la ketouba en présence des témoins et du rabbin. La mariée, assise sur un trône, reçoit les bénédictions de ses proches.</p>

<h3>Le Bedeken (voile de la mariée)</h3>
<p>Le marié vient voiler la mariée, un geste qui rappelle l'histoire de Jacob et Rébecca. C'est un moment très émouvant, souvent accompagné de chants et de musique.</p>

<h3>La Houpa (dais nuptial)</h3>
<p>Le cœur de la cérémonie se déroule sous la houpa, un dais symbolisant le futur foyer du couple. La houpa est généralement soutenue par quatre personnes (famille ou amis proches). Elle peut être simple (un talith tendu) ou richement décorée de fleurs.</p>

<ul>
  <li><strong>L'entrée :</strong> le marié entre en premier, accompagné de ses parents. La mariée entre ensuite et fait sept tours (hakafot) autour du marié, symbolisant la construction de leur monde commun</li>
  <li><strong>Les Kiddoushin (sanctification) :</strong> le rabbin prononce la bénédiction sur le vin. Les époux boivent dans la même coupe. Le marié passe l'alliance au doigt de la mariée en déclarant : « Tu m'es consacrée par cet anneau selon la loi de Moïse et d'Israël »</li>
  <li><strong>Lecture de la Ketouba :</strong> le contrat de mariage est lu à voix haute devant l'assemblée</li>
  <li><strong>Les Sheva Berakhot (sept bénédictions) :</strong> sept bénédictions sont récitées sur une coupe de vin, évoquant la création, la joie et l'espoir de la reconstruction de Jérusalem. C'est un honneur distribué à des proches</li>
  <li><strong>Le verre brisé :</strong> le marié brise un verre sous son pied, en souvenir de la destruction du Temple de Jérusalem. L'assemblée s'exclame « Mazal Tov ! » et la fête peut commencer</li>
</ul>

<h3>Le Yihoud (intimité)</h3>
<p>Juste après la cérémonie, les époux se retirent quelques minutes dans une pièce privée. C'est leur premier moment d'intimité en tant que couple marié, et aussi l'occasion de rompre le jeûne ensemble.</p>

<h2>4. La fête : joie, danse et tradition</h2>

<p>La réception d'un mariage juif est réputée pour son énergie débordante :</p>

<ul>
  <li><strong>La Hora :</strong> la danse traditionnelle en cercle où les mariés sont soulevés sur des chaises. C'est le moment le plus festif et photographié du mariage</li>
  <li><strong>Le Mezinke :</strong> si la mariée ou le marié est le dernier enfant de la famille à se marier, les parents dansent au centre du cercle avec un balai, couronnés de fleurs</li>
  <li><strong>Musique klezmer :</strong> des musiciens jouant du violon, de la clarinette et de l'accordéon pour une ambiance festive et traditionnelle</li>
  <li><strong>Les Sheva Berakhot :</strong> pendant les sept jours suivant le mariage, des repas sont organisés en l'honneur des mariés, et les sept bénédictions sont récitées à nouveau</li>
</ul>

<h2>5. Le repas casher</h2>

<p>Le repas de mariage juif respecte les lois de la cacherout :</p>

<ul>
  <li><strong>Séparation viande et lait :</strong> pas de mélange de produits laitiers et de viande dans le même repas. La plupart des mariages optent pour un menu viande</li>
  <li><strong>Viande casher :</strong> la viande doit provenir d'animaux abattus selon les règles de la shehita et être certifiée par un Beth Din</li>
  <li><strong>Supervision rabbinique (mashgiach) :</strong> un surveillant casher peut être présent en cuisine pour s'assurer du respect des règles</li>
  <li><strong>Poisson et entrées :</strong> le saumon fumé, le gefilte fish, les salades variées sont des classiques des entrées de mariage juif</li>
  <li><strong>La hallah :</strong> le repas commence traditionnellement par la bénédiction sur le pain (motzi) avec une grande hallah tressée</li>
  <li><strong>Desserts :</strong> pièce montée casher, pâtisseries (rugelach, babka), fruits, sorbets (pour un repas viande)</li>
</ul>

<h2>6. Trouver les bons prestataires avec NUPLY</h2>

<p>Organiser un mariage juif nécessite des prestataires qui comprennent et respectent les exigences religieuses. NUPLY simplifie cette recherche :</p>

<ul>
  <li><strong>Traiteurs casher :</strong> trouvez des traiteurs certifiés casher dans votre ville, avec des avis d'autres couples</li>
  <li><strong>Musiciens klezmer et DJ :</strong> des professionnels qui connaissent le répertoire juif traditionnel et moderne</li>
  <li><strong>Photographes :</strong> des photographes habitués au déroulement d'un mariage juif, qui savent capturer le bedeken, la houpa, la hora et chaque moment clé</li>
  <li><strong>Fleuristes :</strong> des spécialistes de la décoration de houpa et des centres de table adaptés aux salles de réception casher</li>
  <li><strong>Matching intelligent :</strong> l'algorithme NUPLY prend en compte vos traditions et votre budget pour vous proposer les prestataires les plus pertinents</li>
</ul>

<p>Avec la <strong>messagerie intégrée de NUPLY</strong>, vous pouvez échanger directement avec chaque prestataire, demander des devis personnalisés et coordonner tous les détails depuis une seule plateforme.</p>

<h2>7. Budget et conseils pratiques</h2>

<p>Voici les postes budgétaires spécifiques à un mariage juif :</p>

<ul>
  <li><strong>Traiteur casher :</strong> entre 80 € et 200 € par personne (plus élevé qu'un traiteur classique en raison de la certification)</li>
  <li><strong>Rabbin et officiant :</strong> entre 300 € et 1 000 € selon la communauté</li>
  <li><strong>Houpa :</strong> entre 200 € et 2 000 € selon la décoration florale</li>
  <li><strong>Ketouba calligraphiée :</strong> entre 150 € et 1 500 € pour une ketouba artistique (certains couples en font une véritable œuvre d'art)</li>
  <li><strong>Musiciens klezmer :</strong> entre 500 € et 2 500 € pour un ensemble</li>
  <li><strong>Mashgiach (surveillant casher) :</strong> entre 200 € et 500 €</li>
</ul>

<p>Le <strong>module Budget de NUPLY</strong> vous permet de suivre tous ces postes spécifiques. Créez des catégories dédiées (houpa, ketouba, traiteur casher) et visualisez en temps réel où en est votre budget.</p>

<h2>En résumé</h2>

<p>Le mariage juif est une célébration profondément joyeuse, où chaque rituel porte une signification millénaire. De la signature de la ketouba au fracas du verre brisé, chaque instant est chargé d'émotion et de sens. Avec NUPLY, trouvez les prestataires qui respecteront vos traditions et feront de votre mariage un événement inoubliable. Mazal Tov !</p>
`,
  },
  {
    slug: 'mariage-indien-guide-traditions-ceremonies',
    title: 'Mariage indien : guide des traditions, cérémonies et organisation en France',
    description: 'Du mehendi au phera, découvrez les rituels du mariage indien (hindou, sikh, sud-indien). Conseils pratiques et prestataires spécialisés avec NUPLY.',
    author: 'NUPLY',
    publishedAt: '2026-02-14',
    updatedAt: '2026-02-14',
    tags: ['Mariage culturel', 'Indien', 'Traditions'],
    readingTime: '10 min',
    content: `
<p>Le mariage indien est l'une des célébrations les plus spectaculaires au monde. Étalé sur plusieurs jours, riche en couleurs, en musique et en rituels, il est bien plus qu'une union entre deux personnes : c'est l'alliance de deux familles. Que vous soyez d'origine indienne ou que vous souhaitiez intégrer des traditions indiennes à votre mariage, voici un guide complet pour tout comprendre et bien vous organiser.</p>

<h2>1. Les fondements du mariage hindou</h2>

<p>Dans la tradition hindoue, le mariage (vivah) est l'un des 16 sacrements (samskaras) de la vie. Il est considéré comme un lien sacré et éternel, qui unit non seulement les époux mais aussi leurs familles et leurs lignées. Le mariage repose sur plusieurs valeurs fondamentales :</p>

<ul>
  <li><strong>Dharma :</strong> le devoir et la vertu. Le couple s'engage à mener une vie juste ensemble</li>
  <li><strong>Artha :</strong> la prospérité. Le mariage est un partenariat pour construire un foyer stable</li>
  <li><strong>Kama :</strong> l'amour et le désir. L'épanouissement émotionnel et physique du couple</li>
  <li><strong>Moksha :</strong> la libération spirituelle. Le couple se soutient mutuellement dans sa quête spirituelle</li>
</ul>

<h2>2. Les cérémonies pré-mariage</h2>

<p>Un mariage indien traditionnel s'étale sur 3 à 5 jours avec de nombreuses cérémonies préliminaires :</p>

<h3>Le Roka et le Sagai (fiançailles)</h3>
<p>La famille du marié rend visite à celle de la mariée pour officialiser l'union. Des cadeaux, des fruits secs et des sucreries sont échangés. Les deux familles se rencontrent et bénissent le couple.</p>

<h3>Le Mehendi (cérémonie du henné)</h3>
<p>L'un des moments les plus attendus. La mariée et ses proches se font appliquer du henné aux motifs complexes sur les mains et les pieds. La soirée est festive, avec musique et danse. Tradition veut que le nom du marié soit caché dans les motifs du henné de la mariée.</p>

<h3>Le Sangeet (soirée musicale)</h3>
<p>Une fête en musique et en danse, souvent organisée la veille du mariage. Les familles préparent des chorégraphies bollywoodiennes, des sketchs et des performances. C'est l'occasion pour les deux familles de se connaître dans une ambiance détendue et joyeuse.</p>

<h3>Le Haldi (cérémonie du curcuma)</h3>
<p>Une pâte de curcuma, d'huile de santal et d'eau de rose est appliquée sur le visage et le corps des futurs mariés. Ce rituel de purification et de beauté est censé faire briller la peau et porter bonheur.</p>

<h2>3. La cérémonie de mariage hindou</h2>

<p>La cérémonie principale se déroule sous un mandap (structure décorée, similaire à un dais) en présence d'un pandit (prêtre hindou) et du feu sacré (Agni) :</p>

<ul>
  <li><strong>Le Baraat :</strong> l'arrivée du marié en procession. Traditionnellement à cheval ou à dos d'éléphant, en France souvent en voiture décorée. Le marié est accompagné de sa famille qui danse au rythme du dhol (tambour)</li>
  <li><strong>Le Jaimala :</strong> l'échange de guirlandes de fleurs entre les époux, symbolisant l'acceptation mutuelle</li>
  <li><strong>Le Kanyadaan :</strong> le père de la mariée « donne » symboliquement sa fille au marié. Un moment très émouvant</li>
  <li><strong>Le Mangal Phera :</strong> le couple fait quatre tours autour du feu sacré, chaque tour représentant un des quatre buts de la vie (dharma, artha, kama, moksha)</li>
  <li><strong>Le Saptapadi :</strong> les sept pas ensemble, chaque pas accompagné d'un vœu. C'est le moment qui scelle officiellement le mariage</li>
  <li><strong>Le Sindoor et le Mangalsutra :</strong> le marié applique du sindoor (poudre rouge) dans la raie des cheveux de la mariée et lui passe le mangalsutra (collier de mariage) autour du cou</li>
</ul>

<h2>4. Variations régionales et religieuses</h2>

<p>L'Inde est un pays aux traditions multiples. Voici quelques variations importantes :</p>

<h3>Mariage sikh (Anand Karaj)</h3>
<p>La cérémonie se déroule au gurdwara (temple sikh) autour du Guru Granth Sahib (livre saint). Le couple fait quatre tours (lavan) autour du livre sacré. La cérémonie est sobre, spirituelle et profondément émouvante.</p>

<h3>Mariage sud-indien</h3>
<p>Le Thaali (équivalent du mangalsutra) est noué autour du cou de la mariée. La cérémonie commence très tôt le matin à une heure auspicieuse (muhurtham). Les mariées portent des saris en soie de Kanchipuram aux couleurs vives.</p>

<h3>Mariage bengali</h3>
<p>Le rituel du Shubho Drishti où les mariés se voient pour la première fois en levant des feuilles de bétel devant leurs yeux. La mariée porte un sari rouge et blanc traditionnel.</p>

<h2>5. Le repas et les festivités</h2>

<p>La gastronomie est au cœur du mariage indien :</p>

<ul>
  <li><strong>Repas végétarien ou non :</strong> selon les communautés. Les mariages brahmanes et jains sont strictement végétariens. Les mariages pendjabis ou musulmans incluent souvent de la viande</li>
  <li><strong>Service en buffet :</strong> les grands buffets avec des dizaines de plats sont la norme. Comptez 15 à 30 plats différents</li>
  <li><strong>Plats incontournables :</strong> biryani, paneer tikka, dal makhani, naan, samosas, gulab jamun, rasgulla, jalebi</li>
  <li><strong>Le chai et les lassis :</strong> servis tout au long de la journée</li>
  <li><strong>Les sucreries (mithai) :</strong> ladoo, barfi, kaju katli sont distribués à tous les invités comme signe de bon augure</li>
</ul>

<h2>6. Organisation et budget en France</h2>

<p>Organiser un mariage indien en France demande une planification spécifique :</p>

<ul>
  <li><strong>Nombre d'invités :</strong> souvent entre 200 et 800 personnes. Prévoyez un lieu suffisamment grand, idéalement avec un espace extérieur pour le baraat</li>
  <li><strong>Traiteur indien :</strong> entre 35 € et 90 € par personne selon le menu et le nombre de plats</li>
  <li><strong>Décoration du mandap :</strong> entre 1 500 € et 8 000 € selon la complexité (fleurs fraîches, tissus, lumières)</li>
  <li><strong>DJ / groupe de dhol :</strong> entre 800 € et 3 000 €</li>
  <li><strong>Mehendi (henneuse professionnelle) :</strong> entre 300 € et 1 500 € selon le nombre de personnes</li>
  <li><strong>Pandit (prêtre hindou) :</strong> entre 300 € et 800 €</li>
  <li><strong>Tenues :</strong> lehenga pour la mariée (1 000 € à 10 000 €), sherwani pour le marié (500 € à 3 000 €)</li>
</ul>

<h2>7. Trouver les bons prestataires avec NUPLY</h2>

<p>Un mariage indien réussi repose sur des prestataires qui comprennent la richesse et la complexité de ces traditions. NUPLY vous connecte aux meilleurs professionnels :</p>

<ul>
  <li><strong>Traiteurs indiens :</strong> trouvez des traiteurs spécialisés dans la cuisine indienne, qu'elle soit végétarienne, pendjabi ou sud-indienne</li>
  <li><strong>Décorateurs :</strong> des professionnels capables de créer un mandap somptueux et une décoration à la hauteur de vos attentes</li>
  <li><strong>Photographes et vidéastes :</strong> des artistes habitués au rythme intense d'un mariage indien, qui captureront le baraat, le jaimala, le phera et chaque moment de danse</li>
  <li><strong>Musiciens et DJ :</strong> des spécialistes du répertoire bollywoodien et des joueurs de dhol pour une ambiance inoubliable</li>
</ul>

<p>Grâce au <strong>Nuply Matching</strong>, notre algorithme identifie les prestataires expérimentés dans les mariages indiens de votre région. Avec le <strong>module Timeline</strong>, planifiez chaque cérémonie (mehendi, sangeet, haldi, mariage) sur plusieurs jours sans rien oublier.</p>

<h2>En résumé</h2>

<p>Le mariage indien est une explosion de couleurs, de saveurs et d'émotions. Chaque rituel porte une signification profonde, et chaque détail compte. Que vous organisiez un mariage hindou traditionnel, un Anand Karaj sikh ou une célébration fusion, NUPLY vous aide à trouver les prestataires qui transformeront votre vision en réalité.</p>
`,
  },
  {
    slug: 'mariage-chinois-traditions-organisation-guide',
    title: 'Mariage chinois : traditions ancestrales, cérémonies du thé et organisation moderne',
    description: 'Guide complet du mariage chinois : cérémonie du thé, symbolique du rouge et de l\'or, banquet traditionnel. Organisez votre mariage avec les prestataires NUPLY.',
    author: 'NUPLY',
    publishedAt: '2026-02-24',
    updatedAt: '2026-02-24',
    tags: ['Mariage culturel', 'Chinois', 'Traditions'],
    readingTime: '9 min',
    content: `
<p>Le mariage chinois est un événement d'une richesse symbolique exceptionnelle, où chaque geste, chaque couleur et chaque plat porte une signification de bonheur, de prospérité et de longévité. Que vous soyez d'origine chinoise ou que vous souhaitiez intégrer ces belles traditions à votre union, voici tout ce qu'il faut savoir pour organiser un mariage chinois mémorable.</p>

<h2>1. Les fondements du mariage chinois</h2>

<p>Dans la culture chinoise, le mariage n'est pas seulement l'union de deux personnes, mais l'alliance de deux familles. Historiquement, le mariage reposait sur les « Six Rites » (六礼, liù lǐ), un protocole strict qui régissait chaque étape de l'union. Aujourd'hui, ces traditions ont évolué mais leur esprit perdure :</p>

<ul>
  <li><strong>Le respect des aînés :</strong> les parents jouent un rôle central dans l'organisation et la bénédiction du mariage</li>
  <li><strong>L'harmonie :</strong> le mariage vise à créer l'équilibre entre les deux familles</li>
  <li><strong>La prospérité :</strong> de nombreux symboles (double bonheur 囍, dragon et phénix, poissons) évoquent la richesse et l'abondance</li>
  <li><strong>La continuité :</strong> le mariage perpétue la lignée familiale, c'est un devoir filial</li>
</ul>

<h2>2. Les préparatifs traditionnels</h2>

<h3>Le choix de la date</h3>
<p>La date du mariage est souvent choisie en consultant le calendrier lunaire chinois ou un maître feng shui. Certaines dates sont considérées particulièrement auspicieuses. Le chiffre 8 (八, bā) est très recherché car il symbolise la prospérité. On évite le chiffre 4 (四, sì) qui ressemble phonétiquement au mot « mort ».</p>

<h3>La demande officielle (Guo Da Li 过大礼)</h3>
<p>La famille du marié apporte des cadeaux à la famille de la mariée : bijoux en or, gâteaux de mariage, fruits, thé et enveloppes rouges (hong bao). C'est un geste de respect et de gratitude envers la famille qui « offre » leur fille.</p>

<h3>Le trousseau de la mariée (Jia Zhuang 嫁妆)</h3>
<p>En retour, la famille de la mariée prépare un trousseau comprenant des objets pour le nouveau foyer, des bijoux et parfois des biens immobiliers. Le trousseau symbolise l'amour et le soutien de la famille.</p>

<h2>3. La symbolique des couleurs et des motifs</h2>

<p>Les couleurs jouent un rôle essentiel dans le mariage chinois :</p>

<ul>
  <li><strong>Le rouge (红, hóng) :</strong> couleur dominante du mariage chinois, symbolisant la chance, la joie et la prospérité. Invitations, décoration, tenue de la mariée : le rouge est omniprésent</li>
  <li><strong>L'or (金, jīn) :</strong> symbole de richesse et de noblesse. Les bijoux en or sont un cadeau de mariage traditionnel incontournable</li>
  <li><strong>Le blanc :</strong> traditionnellement associé au deuil en Chine, il est évité. Cependant, les mariages modernes intègrent souvent une robe blanche occidentale en plus de la tenue traditionnelle</li>
  <li><strong>Le double bonheur (囍, shuāng xǐ) :</strong> ce caractère est présent sur les invitations, la décoration, les cadeaux et la salle de réception</li>
  <li><strong>Le dragon et le phénix :</strong> symboles du marié et de la mariée, représentant la puissance et la grâce</li>
</ul>

<h2>4. Le déroulement du jour J</h2>

<h3>Le jeu de la porte (Chuang Men 闯门)</h3>
<p>Le marié doit « conquérir » la mariée en passant des épreuves imposées par les demoiselles d'honneur. Chants, défis physiques, énigmes, déclarations d'amour : tout est bon pour prouver sa valeur. Il doit aussi distribuer des enveloppes rouges pour « acheter » son passage. C'est un moment hilarant et bon enfant.</p>

<h3>La cérémonie du thé (Jing Cha 敬茶)</h3>
<p>C'est le cœur émotionnel du mariage chinois. Les mariés servent du thé à leurs parents et aînés à genoux, en signe de respect et de gratitude. En retour, les aînés offrent des bijoux en or et des enveloppes rouges. L'ordre de service suit la hiérarchie familiale : parents, grands-parents, oncles et tantes.</p>

<h3>Les tenues</h3>
<p>La mariée porte traditionnellement un qipao (旗袍) ou un kua (裙褂) rouge brodé de motifs dorés (dragon, phénix, pivoines). De nombreuses mariées modernes portent également une robe blanche pour la cérémonie civile ou les photos, puis changent pour la tenue traditionnelle rouge lors du banquet.</p>

<h2>5. Le banquet de mariage</h2>

<p>Le banquet est l'élément central de la célébration chinoise :</p>

<ul>
  <li><strong>Le nombre de plats :</strong> traditionnellement 8, 9 ou 10 plats (chiffres porte-bonheur). Le 8 symbolise la prospérité, le 9 la longévité</li>
  <li><strong>Les plats incontournables :</strong>
    <ul>
      <li>Homard ou crevettes (龙虾, symbole du dragon)</li>
      <li>Poulet entier (symbolisant le phénix et la complétude)</li>
      <li>Poisson entier servi en dernier (余, yú, homophone de « abondance »)</li>
      <li>Nouilles de longévité (长寿面, symbole de vie longue)</li>
      <li>Soupe de nids d'hirondelle ou de requin (pour les mariages haut de gamme)</li>
      <li>Desserts : tang yuan (boulettes de riz glutineux, symbole d'union) et gâteaux rouges</li>
    </ul>
  </li>
  <li><strong>Le toast (Jing Jiu 敬酒) :</strong> les mariés passent de table en table pour trinquer avec chaque groupe d'invités. Le cognac, le whisky ou le baijiu sont les boissons traditionnelles du toast</li>
  <li><strong>Les tables rondes :</strong> le banquet se fait sur des tables rondes de 10-12 personnes, symbole d'unité et d'harmonie</li>
</ul>

<h2>6. Les cadeaux et les enveloppes rouges</h2>

<p>Dans la tradition chinoise, les invités offrent des enveloppes rouges (hong bao 红包) contenant de l'argent :</p>

<ul>
  <li><strong>Montant :</strong> il doit être pair et contenir le chiffre 8 de préférence (88 €, 188 €, 288 €, 888 €). On évite les montants avec le chiffre 4</li>
  <li><strong>Le montant couvre le repas :</strong> traditionnellement, le montant de l'enveloppe doit au minimum couvrir le coût du repas de l'invité</li>
  <li><strong>Les billets neufs :</strong> on glisse des billets neufs dans l'enveloppe, symbole de fraîcheur et de nouveau départ</li>
</ul>

<h2>7. Organisation et budget en France</h2>

<ul>
  <li><strong>Banquet chinois (restaurant) :</strong> entre 50 € et 150 € par personne selon le restaurant et le menu</li>
  <li><strong>Traiteur chinois (en salle) :</strong> entre 60 € et 120 € par personne</li>
  <li><strong>Qipao ou kua traditionnel :</strong> entre 500 € et 5 000 € (fait sur mesure ou importé)</li>
  <li><strong>Décoration rouge et or :</strong> entre 800 € et 4 000 €</li>
  <li><strong>Photographe :</strong> un photographe habitué aux mariages chinois saura capturer la cérémonie du thé, le chuang men et les moments clés</li>
  <li><strong>MC / animateur bilingue :</strong> entre 500 € et 1 500 € pour un maître de cérémonie qui parle français et mandarin/cantonais</li>
</ul>

<h2>8. Trouver les bons prestataires avec NUPLY</h2>

<p>NUPLY facilite l'organisation de votre mariage chinois en vous connectant aux prestataires qui comprennent vos traditions :</p>

<ul>
  <li><strong>Traiteurs spécialisés :</strong> restaurants et traiteurs chinois capables de préparer un banquet traditionnel avec le nombre de plats requis</li>
  <li><strong>Photographes :</strong> des professionnels habitués aux séances pré-mariage (très populaires dans la culture chinoise) et aux rituels du jour J</li>
  <li><strong>Décorateurs :</strong> des spécialistes de la décoration rouge et or, du double bonheur aux compositions florales</li>
  <li><strong>Matching culturel :</strong> notre algorithme prend en compte vos traditions spécifiques pour vous proposer les prestataires les plus pertinents</li>
</ul>

<p>Avec le <strong>module Budget de NUPLY</strong>, suivez chaque poste de dépense et gardez une vision claire de votre budget. La <strong>messagerie intégrée</strong> vous permet de coordonner tous vos prestataires depuis une seule plateforme.</p>

<h2>En résumé</h2>

<p>Le mariage chinois est un magnifique hommage aux traditions familiales et à la symbolique du bonheur. Du jeu de la porte à la cérémonie du thé, du qipao rouge au poisson de l'abondance, chaque détail raconte une histoire. Avec NUPLY, trouvez les prestataires qui donneront vie à votre mariage chinois en France, dans le respect de vos traditions et de votre budget.</p>
`,
  },
  {
    slug: 'mariage-japonais-guide-shinto-traditions',
    title: 'Mariage japonais : cérémonies shinto, traditions et organisation en France',
    description: 'Découvrez le mariage japonais traditionnel : cérémonie shinto, san-san-kudo, kimono de mariage. Guide complet et prestataires spécialisés avec NUPLY.',
    author: 'NUPLY',
    publishedAt: '2026-03-03',
    updatedAt: '2026-03-03',
    tags: ['Mariage culturel', 'Japonais', 'Traditions'],
    readingTime: '9 min',
    content: `
<p>Le mariage japonais allie élégance, sobriété et profondeur spirituelle. Qu'il suive le rite shinto traditionnel, une cérémonie bouddhiste ou un style occidental adapté, il reflète la sensibilité esthétique unique du Japon. Voici un guide complet pour comprendre les traditions du mariage japonais et organiser une célébration qui honore cette culture raffinée.</p>

<h2>1. Les différents types de mariages au Japon</h2>

<p>Au Japon, plusieurs styles de cérémonie coexistent, et les couples choisissent souvent en fonction de leur sensibilité et de l'esthétique recherchée :</p>

<ul>
  <li><strong>Shinto (神前式, shinzen-shiki) :</strong> la cérémonie traditionnelle japonaise, célébrée dans un sanctuaire shinto. C'est le style le plus ancien et le plus symbolique</li>
  <li><strong>Bouddhiste (仏前式, butsuzen-shiki) :</strong> moins courant, il se déroule dans un temple bouddhiste. La cérémonie est sobre et méditative</li>
  <li><strong>Chrétien (教会式, kyōkai-shiki) :</strong> très populaire au Japon moderne, même parmi les non-chrétiens, pour son esthétique romantique (robe blanche, chapelle)</li>
  <li><strong>Civil (人前式, jinzen-shiki) :</strong> une cérémonie laïque devant les invités, de plus en plus populaire pour sa liberté de format</li>
</ul>

<h2>2. La cérémonie shinto traditionnelle</h2>

<p>La cérémonie shinto est le mariage japonais par excellence. Elle se déroule dans un sanctuaire (jinja) en présence d'un prêtre shinto (kannushi) et de deux assistantes (miko) :</p>

<h3>Le déroulement</h3>
<ul>
  <li><strong>La purification (修祓, shūbatsu) :</strong> le prêtre purifie les mariés et l'assemblée en agitant un bâton sacré orné de papier blanc (ōnusa)</li>
  <li><strong>La prière aux dieux (祝詞奏上, norito sōjō) :</strong> le prêtre récite une prière devant l'autel, invoquant la bénédiction des kami (divinités)</li>
  <li><strong>Le san-san-kudo (三三九度) :</strong> le rituel le plus emblématique. Les mariés boivent du saké sacré dans trois coupes de tailles croissantes, en trois gorgées chacune (3 × 3 = 9 gorgées). Ce rituel scelle l'union et symbolise les liens entre les deux familles</li>
  <li><strong>L'échange des alliances :</strong> un ajout moderne, inspiré de la tradition occidentale, mais désormais intégré à la cérémonie</li>
  <li><strong>Le serment (誓詞奏上, seishi sōjō) :</strong> le marié lit un serment solennel devant les dieux et l'assemblée</li>
  <li><strong>L'offrande de branches de sakaki (玉串拝礼, tamagushi hairei) :</strong> les mariés déposent des branches de l'arbre sacré sakaki sur l'autel en signe de dévotion</li>
  <li><strong>Le toast cérémoniel (親族固めの盃, shinzoku katame no sakazuki) :</strong> les membres des deux familles boivent du saké ensemble, scellant l'alliance entre les deux clans</li>
</ul>

<p>La cérémonie shinto dure environ 30 minutes et se caractérise par sa solennité et sa retenue. Seuls les proches y assistent (20 à 30 personnes maximum dans la plupart des sanctuaires).</p>

<h2>3. Les tenues traditionnelles</h2>

<p>Les tenues de mariage japonaises sont parmi les plus somptueuses au monde :</p>

<h3>La mariée</h3>
<ul>
  <li><strong>Le shiromuku (白無垢) :</strong> un kimono de mariage entièrement blanc, symbolisant la pureté et la volonté de la mariée de « teindre » ses couleurs avec celles de sa nouvelle famille. Il comprend un uchikake (sur-kimono) blanc richement brodé</li>
  <li><strong>Le tsunokakushi (角隠し) :</strong> une coiffe blanche qui dissimule les « cornes de jalousie » de la mariée, symbolisant sa douceur et son obéissance (tradition en évolution)</li>
  <li><strong>Le watabōshi (綿帽子) :</strong> un capuchon blanc semblable à un voile occidental, porté pendant la cérémonie</li>
  <li><strong>L'iro-uchikake (色打掛) :</strong> un kimono coloré (rouge, or, noir) richement brodé de grues, de pins et de fleurs, porté lors de la réception</li>
</ul>

<h3>Le marié</h3>
<ul>
  <li><strong>Le montsuki hakama (紋付袴) :</strong> un ensemble traditionnel composé d'un kimono noir orné des armoiries familiales (mon) et d'un hakama (pantalon large) rayé</li>
</ul>

<h2>4. La réception (披露宴, hirōen)</h2>

<p>La réception japonaise est un événement très structuré et chorégraphié :</p>

<ul>
  <li><strong>L'entrée des mariés :</strong> une entrée spectaculaire, souvent avec un éclairage dramatique et de la musique</li>
  <li><strong>Les discours (スピーチ) :</strong> le nakōdo (entremetteur, si présent), le patron ou le mentor du marié, et des amis proches prononcent des discours formels</li>
  <li><strong>Le kagami biraki (鏡開き) :</strong> les mariés brisent le couvercle d'un tonneau de saké à l'aide de maillets en bois. Le saké est ensuite servi à tous les invités</li>
  <li><strong>Le changement de tenue (お色直し, oironaoshi) :</strong> la mariée change de tenue au moins une fois pendant la réception (du shiromuku blanc à l'iro-uchikake coloré, puis souvent une robe occidentale)</li>
  <li><strong>Le bougie service :</strong> les mariés passent de table en table pour allumer des bougies, un moment intime et chaleureux</li>
  <li><strong>La lettre aux parents :</strong> la mariée lit une lettre émouvante à ses parents, les remerciant pour leur amour et leur éducation. C'est souvent le moment le plus émouvant de la soirée</li>
  <li><strong>Les cadeaux aux invités (引出物, hikidemono) :</strong> chaque invité repart avec un sac de cadeaux soigneusement choisis (vaisselle, sucreries, catalogue cadeau)</li>
</ul>

<h2>5. Le repas de mariage japonais</h2>

<p>Le repas suit souvent le style kaiseki (cuisine raffinée japonaise) ou un menu fusion :</p>

<ul>
  <li><strong>Kaiseki :</strong> un repas en plusieurs services (7 à 12 plats) d'une grande finesse : sashimi, tempura, soupe miso, poisson grillé, riz, légumes de saison</li>
  <li><strong>Plats porte-bonheur :</strong> le tai (daurade) est un classique du mariage japonais, car son nom évoque « medetai » (heureux). Les crevettes symbolisent la longévité (leur dos courbé évoque le grand âge)</li>
  <li><strong>Le wedding cake :</strong> souvent un gâteau occidental élaboré, parfois un croquembouche. Le gâteau est rarement découpé et mangé : il s'agit d'un gâteau décoratif pour la photo</li>
  <li><strong>Saké et champagne :</strong> les deux sont servis, le saké pour le côté traditionnel et le champagne pour les toasts</li>
</ul>

<h2>6. Organiser un mariage japonais en France</h2>

<p>Il est tout à fait possible de célébrer un mariage d'inspiration japonaise en France :</p>

<ul>
  <li><strong>Cérémonie :</strong> un officiant peut adapter la cérémonie du san-san-kudo et les rituels shinto en version laïque</li>
  <li><strong>Tenues :</strong> des kimonos de mariage peuvent être loués ou achetés dans des boutiques spécialisées ou importés du Japon</li>
  <li><strong>Décoration :</strong> cerisiers en fleurs (sakura), lanternes japonaises, ikebana (art floral), bambou, origami. L'esthétique japonaise est minimaliste et élégante</li>
  <li><strong>Traiteur :</strong> un traiteur japonais ou fusion peut proposer un menu kaiseki ou un buffet japonais (sushis, yakitoris, tempura, ramen)</li>
</ul>

<h3>Budget indicatif</h3>
<ul>
  <li><strong>Traiteur japonais :</strong> entre 60 € et 150 € par personne pour un menu kaiseki</li>
  <li><strong>Location de kimonos de mariage :</strong> entre 500 € et 3 000 € (shiromuku et montsuki hakama)</li>
  <li><strong>Décoration japonaise :</strong> entre 1 000 € et 5 000 € selon l'ampleur (sakura artificiels, lanternes, ikebana)</li>
  <li><strong>Calligraphe japonais :</strong> entre 200 € et 600 € pour les invitations et la décoration</li>
  <li><strong>Saké de cérémonie :</strong> entre 100 € et 400 € pour un saké premium de qualité</li>
</ul>

<h2>7. Trouver les bons prestataires avec NUPLY</h2>

<p>NUPLY vous aide à trouver des prestataires qui comprennent l'esthétique et les traditions japonaises :</p>

<ul>
  <li><strong>Traiteurs japonais :</strong> des chefs spécialisés dans la cuisine kaiseki ou les menus fusion, qui sauront respecter l'art de la présentation</li>
  <li><strong>Fleuristes :</strong> des artistes maîtrisant l'ikebana et la décoration zen pour créer une ambiance authentique</li>
  <li><strong>Photographes :</strong> des professionnels sensibles à l'esthétique japonaise, qui captureront la beauté des kimonos, la sérénité de la cérémonie et l'émotion de la lettre aux parents</li>
  <li><strong>Matching intelligent :</strong> l'algorithme NUPLY identifie les prestataires de votre région ayant l'expérience des mariages d'inspiration japonaise</li>
</ul>

<p>Le <strong>module Timeline de NUPLY</strong> vous permet de planifier chaque étape de votre mariage japonais : de la commande des kimonos à la réservation du traiteur, en passant par la décoration et la coordination du jour J. La <strong>messagerie intégrée</strong> centralise tous vos échanges avec vos prestataires.</p>

<h2>En résumé</h2>

<p>Le mariage japonais est un chef-d'œuvre de délicatesse et de symbolisme. Qu'il soit shinto, bouddhiste ou d'inspiration contemporaine, il célèbre l'harmonie, le respect et la beauté dans chaque détail. Avec NUPLY, trouvez les prestataires qui sauront honorer cette tradition et créer un mariage empreint de l'élégance japonaise, en France comme ailleurs.</p>
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
