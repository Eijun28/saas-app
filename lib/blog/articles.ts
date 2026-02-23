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

  // ── Article 5 : Photographe mariage ──────────────────────────────────────
  {
    slug: 'choisir-photographe-mariage',
    title: 'Comment choisir son photographe de mariage : le guide complet',
    description: 'Style, tarifs, contrat, questions à poser... Tout ce que vous devez savoir pour trouver le photographe mariage idéal et ne pas rater vos souvenirs.',
    author: 'NUPLY',
    publishedAt: '2026-02-10',
    updatedAt: '2026-02-10',
    tags: ['Photographe', 'Prestataires', 'Conseils'],
    readingTime: '7 min',
    content: `
<p>Le photographe de mariage est l'un des prestataires les plus importants de votre jour J. Vos photos seront les seuls souvenirs tangibles qui traverseront les décennies. Voici comment faire le bon choix.</p>

<h2>1. Définir votre style de photographie</h2>

<p>Avant même de contacter des photographes, identifiez le style qui vous correspond :</p>

<ul>
  <li><strong>Reportage (ou photojournalisme) :</strong> Le photographe capte les moments spontanés sans mise en scène. Idéal si vous voulez des images authentiques et vivantes.</li>
  <li><strong>Posé (ou classique) :</strong> Photos composées, portraits soignés, approche traditionnelle. Parfait pour un mariage élégant et formel.</li>
  <li><strong>Lifestyle :</strong> Un mélange des deux — des mises en situation naturelles qui donnent l'impression de spontanéité tout en étant légèrement guidées.</li>
  <li><strong>Fine art :</strong> Traitement lumineux, couleurs douces, style film ou argentique. Tendance très recherchée pour les mariages bohèmes et champêtres.</li>
  <li><strong>Multiculturel :</strong> Certains photographes sont spécialisés dans les cérémonies mixtes (franco-africain, franco-indien, franco-maghrébin...). Une compétence précieuse si vous avez plusieurs traditions à valoriser.</li>
</ul>

<p><strong>Conseil :</strong> Créez un dossier Pinterest ou Instagram avec des photos qui vous inspirent. Cela vous aidera à définir et communiquer votre style à vos candidats.</p>

<h2>2. Définir votre budget photographe</h2>

<p>En France, les tarifs pour un photographe de mariage varient énormément :</p>

<ul>
  <li><strong>Débutant / étudiant :</strong> 500 à 1 200 €</li>
  <li><strong>Photographe intermédiaire :</strong> 1 200 à 2 500 €</li>
  <li><strong>Photographe expérimenté :</strong> 2 500 à 4 000 €</li>
  <li><strong>Photographe reconnu / primé :</strong> 4 000 € et plus</li>
</ul>

<p>Le budget moyen pour un photographe en France se situe autour de 1 800 à 2 500 € pour une journée complète. Prévoyez entre 8 et 12 % de votre budget mariage total pour ce poste.</p>

<p>Attention aux "bonnes affaires" : un photographe peu expérimenté peut ruiner vos souvenirs. La qualité a un prix.</p>

<h2>3. Où trouver de bons photographes de mariage ?</h2>

<ul>
  <li><strong>Bouche à oreille :</strong> Demandez à vos proches récemment mariés. C'est souvent la meilleure recommandation.</li>
  <li><strong>NUPLY :</strong> La plateforme vous met en relation avec des photographes mariage vérifiés selon vos critères (style, région, budget, disponibilité).</li>
  <li><strong>Instagram et Pinterest :</strong> De nombreux photographes présentent leur portfolio sur ces réseaux.</li>
  <li><strong>Salons du mariage :</strong> Vous pouvez rencontrer des photographes en direct et voir leurs albums physiques.</li>
</ul>

<h2>4. Les questions indispensables à poser</h2>

<p>Lors de votre premier contact ou rendez-vous, posez toujours ces questions :</p>

<ul>
  <li>Êtes-vous disponible à la date de mon mariage ?</li>
  <li>Combien de mariages photographiez-vous par an ?</li>
  <li>Avez-vous déjà photographié dans ce lieu ou ce type de cérémonie ?</li>
  <li>Combien de photos livrées (brutes et retouchées) ?</li>
  <li>Dans quel délai livrez-vous les photos ?</li>
  <li>Utilisez-vous des boitiers de secours ? (Très important !)</li>
  <li>Que se passe-t-il si vous êtes malade ou indisponible le jour J ?</li>
  <li>Comment sauvegardez-vous les fichiers ?</li>
  <li>Faites-vous aussi de la vidéo ? (ou recommandez-vous un vidéaste ?)</li>
</ul>

<h2>5. Bien lire le contrat</h2>

<p>Ne signez jamais sans contrat. Le contrat doit préciser :</p>

<ul>
  <li>Date, lieu et durée de la prestation</li>
  <li>Nombre de photos livrées et délai de livraison</li>
  <li>Format de livraison (galerie en ligne, clé USB, album papier...)</li>
  <li>Droits d'utilisation des photos (le photographe peut-il les utiliser dans son portfolio ?)</li>
  <li>Conditions d'annulation et de remboursement</li>
  <li>Montant de l'acompte (généralement 30 à 50 %)</li>
</ul>

<h2>6. L'importance de la rencontre humaine</h2>

<p>Au-delà du portfolio et du budget, le feeling avec votre photographe est crucial. Vous passerez votre journée entière avec lui ou elle. Assurez-vous d'être à l'aise, de pouvoir communiquer facilement et que sa personnalité s'accorde avec votre vision de la journée.</p>

<p>Organisez toujours un rendez-vous (physique ou vidéo) avant de signer. Et si possible, une séance engagement (séance photo avant le mariage) pour vous mettre à l'aise devant l'objectif.</p>

<h2>7. Utiliser NUPLY pour trouver votre photographe</h2>

<p>Avec <strong>NUPLY</strong>, vous pouvez envoyer votre brief à plusieurs photographes vérifiés simultanément, comparer leurs propositions et échanger directement via la messagerie intégrée. Fini les heures passées à chercher sur Google : notre algorithme de matching vous propose des profils adaptés à votre style, votre région et votre budget.</p>
`,
  },

  // ── Article 6 : Salle de mariage ─────────────────────────────────────────
  {
    slug: 'trouver-salle-mariage',
    title: 'Trouver la salle de mariage parfaite : nos conseils pour bien choisir',
    description: 'Château, mas, salle des fêtes, domaine... Comment choisir le lieu de réception de votre mariage ? Nos critères, astuces et questions à poser.',
    author: 'NUPLY',
    publishedAt: '2026-02-14',
    updatedAt: '2026-02-14',
    tags: ['Lieu de réception', 'Organisation', 'Conseils'],
    readingTime: '6 min',
    content: `
<p>Choisir la salle de mariage est souvent la première — et la plus importante — décision de votre organisation. Le lieu conditionne la date, la capacité d'accueil, l'ambiance et une grande partie de votre budget. Voici comment vous y prendre.</p>

<h2>1. Les différents types de lieux de mariage</h2>

<p>En France, les options sont nombreuses et très variées :</p>

<ul>
  <li><strong>Château ou manoir :</strong> L'élégance à la française. Idéal pour un mariage classique, romantique et impressionnant. Tarifs souvent élevés (3 000 à 15 000 € la location).</li>
  <li><strong>Domaine ou mas (Sud de la France) :</strong> Ambiance provençale, jardins, terrasses. Parfait pour les mariages en plein air.</li>
  <li><strong>Grange ou ferme rénovée :</strong> Très tendance pour les mariages champêtres ou bohèmes. Souvent plus accessible en termes de tarifs.</li>
  <li><strong>Salle des fêtes municipale :</strong> Budget maîtrisé. Demande plus de travail de décoration pour la personnaliser.</li>
  <li><strong>Hôtel ou restaurant :</strong> Pratique pour les petits comités. Traiteur souvent inclus dans la prestation.</li>
  <li><strong>Loft ou espace industriel :</strong> Tendance, modulable, idéal pour des mariages urbains et modernes.</li>
  <li><strong>Péniche ou rooftop :</strong> Pour un mariage original et inoubliable.</li>
</ul>

<h2>2. Les critères essentiels de sélection</h2>

<h3>La capacité</h3>
<p>Définissez d'abord votre nombre d'invités (au moins de façon approximative). Un lieu trop grand donnera une impression de vide ; trop petit, l'expérience sera désagréable. Prévoyez une marge de 10 à 15 %.</p>

<h3>La localisation</h3>
<ul>
  <li>Distance depuis votre ville ou celle de vos proches</li>
  <li>Accessibilité en transports et parking suffisant</li>
  <li>Possibilités d'hébergement à proximité pour les invités qui viennent de loin</li>
</ul>

<h3>La disponibilité</h3>
<p>Les meilleurs lieux se réservent 12 à 24 mois à l'avance, surtout pour les dates de mai à septembre (saison haute).</p>

<h3>Le cadre juridique</h3>
<ul>
  <li>Le lieu est-il déclaré pour recevoir du public (ERP) ?</li>
  <li>Y a-t-il des restrictions de bruit et des heures de fin de soirée imposées ?</li>
  <li>Avez-vous la liberté de choisir vos propres prestataires (traiteur libre) ?</li>
</ul>

<h2>3. Les questions à poser lors de la visite</h2>

<ul>
  <li>Quelle est la capacité maximale assise et en cocktail ?</li>
  <li>Y a-t-il une cuisine professionnelle ou un espace traiteur ?</li>
  <li>Y a-t-il une salle de préparation (pour la mariée) ?</li>
  <li>Y a-t-il des chambres ou un hébergement sur place ?</li>
  <li>À quelle heure doit se terminer la musique ?</li>
  <li>Êtes-vous disponible pour d'autres événements le même week-end ?</li>
  <li>Que comprend exactement la location (mobilier, vaisselle, linge de table) ?</li>
  <li>Quelles sont les conditions météo alternatives si la cérémonie est en plein air ?</li>
</ul>

<h2>4. Le budget : à quoi s'attendre ?</h2>

<p>La location d'un lieu de mariage représente en moyenne 30 à 40 % du budget total. En France :</p>

<ul>
  <li><strong>Salle des fêtes :</strong> 300 à 1 500 €</li>
  <li><strong>Domaine ou ferme :</strong> 2 000 à 6 000 €</li>
  <li><strong>Château :</strong> 3 000 à 15 000 € et plus</li>
  <li><strong>Hôtel 4-5 étoiles :</strong> variable selon le forfait</li>
</ul>

<p>Attention aux coûts cachés : état des lieux, caution, ménage, heures supplémentaires...</p>

<h2>5. Penser à la cérémonie</h2>

<p>Si vous souhaitez une cérémonie laïque ou religieuse sur place (avant le repas), vérifiez que le lieu dispose d'un espace extérieur ou d'une chapelle adaptée. De nombreux domaines proposent maintenant des espaces dédiés à la cérémonie.</p>

<h2>6. Trouver votre lieu via NUPLY</h2>

<p><strong>NUPLY</strong> vous permet d'accéder à des prestataires mariage vérifiés en France, dont des responsables de lieux de réception. Envoyez votre brief (date, nombre d'invités, style, budget) et recevez des propositions adaptées. Notre messagerie intégrée facilite les échanges et la comparaison des offres.</p>
`,
  },

  // ── Article 7 : Budget mariage ────────────────────────────────────────────
  {
    slug: 'budget-mariage-comment-economiser',
    title: 'Budget mariage : comment bien le répartir et réaliser des économies',
    description: 'Combien coûte un mariage en France ? Comment répartir son budget par poste et faire des économies sans sacrifier la qualité ? Notre guide complet.',
    author: 'NUPLY',
    publishedAt: '2026-02-17',
    updatedAt: '2026-02-17',
    tags: ['Budget', 'Organisation', 'Conseils'],
    readingTime: '8 min',
    content: `
<p>Le budget est souvent le sujet qui stresse le plus les futurs mariés. Combien faut-il vraiment prévoir ? Comment éviter de se ruiner sans renoncer à ses rêves ? Ce guide vous donne toutes les clés pour piloter votre budget mariage sereinement.</p>

<h2>1. Le budget moyen d'un mariage en France</h2>

<p>En France, le budget moyen d'un mariage est d'environ :</p>

<ul>
  <li><strong>Mariage intime (moins de 50 personnes) :</strong> 8 000 à 15 000 €</li>
  <li><strong>Mariage classique (80 à 150 personnes) :</strong> 15 000 à 30 000 €</li>
  <li><strong>Grand mariage (150 personnes et plus) :</strong> 30 000 € et plus</li>
</ul>

<p>Ces montants varient beaucoup selon la région (Paris et Île-de-France sont 30 à 50 % plus chers), la saison et vos prestataires.</p>

<h2>2. La répartition idéale par poste</h2>

<p>Voici une répartition courante pour un mariage de 100 personnes :</p>

<ul>
  <li><strong>Lieu de réception :</strong> 30 à 35 % du budget</li>
  <li><strong>Traiteur (repas + cocktail) :</strong> 25 à 30 %</li>
  <li><strong>Photographe et vidéaste :</strong> 8 à 12 %</li>
  <li><strong>Musique (DJ ou groupe) :</strong> 5 à 8 %</li>
  <li><strong>Décoration et fleurs :</strong> 5 à 8 %</li>
  <li><strong>Tenues (robe, costume, accessoires) :</strong> 5 à 10 %</li>
  <li><strong>Papeterie (faire-part, menus, plan de table) :</strong> 1 à 3 %</li>
  <li><strong>Transport (voiture de mariés, navettes) :</strong> 2 à 4 %</li>
  <li><strong>Divers et imprévus :</strong> 5 à 10 %</li>
</ul>

<p><strong>Règle d'or :</strong> Toujours prévoir 10 % de budget "imprévus". Les surprises font partie de tout événement.</p>

<h2>3. Les postes sur lesquels on peut économiser</h2>

<h3>Le traiteur</h3>
<ul>
  <li>Choisissez un menu en 2 ou 3 plats plutôt qu'en 5 plats.</li>
  <li>Optez pour un cocktail dînatoire plutôt qu'un repas assis si votre liste est longue.</li>
  <li>Comparez plusieurs traiteurs via NUPLY : les écarts de prix peuvent être de 30 à 50 % pour une qualité similaire.</li>
  <li>Privilégiez les produits de saison.</li>
</ul>

<h3>La décoration</h3>
<ul>
  <li>DIY (Do It Yourself) : beaucoup d'éléments déco peuvent être faits maison.</li>
  <li>Louez plutôt qu'achetez (chandeliers, arches florales...).</li>
  <li>Choisissez des fleurs de saison : moins chères et plus belles.</li>
  <li>Cherchez sur Le Bon Coin ou des groupes Facebook de revente de décoration mariage.</li>
</ul>

<h3>La papeterie</h3>
<ul>
  <li>Les faire-part numériques (email ou site de mariage) permettent d'économiser 500 à 1 500 €.</li>
  <li>Des sites comme Canva proposent des templates gratuits.</li>
</ul>

<h3>La musique</h3>
<ul>
  <li>Un bon DJ coûte souvent moins cher qu'un groupe live, pour un résultat tout aussi festif.</li>
  <li>Pour la cérémonie, de nombreux couples utilisent une playlist Spotify via une enceinte Bluetooth.</li>
</ul>

<h2>4. Les postes sur lesquels ne pas économiser</h2>

<p>Certains postes méritent un investissement sans trop rogner :</p>

<ul>
  <li><strong>Le photographe :</strong> Vos photos sont les seuls souvenirs qui traverseront le temps. Un photographe peu expérimenté peut gâcher votre mémoire de ce jour.</li>
  <li><strong>Le traiteur :</strong> Vos invités se souviennent de la qualité de la nourriture et du service.</li>
  <li><strong>Le lieu :</strong> Il donne le cadre général de la journée.</li>
</ul>

<h2>5. Comment gérer son budget au quotidien</h2>

<p>L'outil <strong>Budget de NUPLY</strong> vous permet de :</p>

<ul>
  <li>Définir un plafond global et des plafonds par poste</li>
  <li>Saisir chaque dépense au fur et à mesure (acomptes, soldes...)</li>
  <li>Visualiser en temps réel l'état de votre budget par catégorie</li>
  <li>Recevoir des alertes quand vous approchez d'un plafond</li>
</ul>

<p>Utiliser un outil dédié évite les mauvaises surprises et les dépenses non planifiées qui s'accumulent.</p>

<h2>6. Financer son mariage : les options</h2>

<ul>
  <li><strong>Épargne personnelle :</strong> L'option la plus saine financièrement.</li>
  <li><strong>Participation familiale :</strong> Les parents contribuent souvent. Définissez les montants dès le départ pour éviter les malentendus.</li>
  <li><strong>Liste de mariage monétaire :</strong> Via des plateformes comme Lydia ou Pot Commun, vos invités peuvent contribuer à votre voyage de noces ou à votre budget mariage.</li>
  <li><strong>Crédit à la consommation :</strong> À utiliser avec prudence. Pensez au remboursement mensuel après le mariage.</li>
</ul>
`,
  },

  // ── Article 8 : Liste de mariage ─────────────────────────────────────────
  {
    slug: 'liste-de-mariage-guide-complet',
    title: 'Liste de mariage : comment la créer, où l\'ouvrir et quoi y mettre',
    description: 'Liste de mariage classique, cagnotte voyage, liste expériences... Nos conseils pour créer une liste de mariage qui correspond vraiment à vos envies.',
    author: 'NUPLY',
    publishedAt: '2026-02-19',
    updatedAt: '2026-02-19',
    tags: ['Liste de mariage', 'Organisation', 'Conseils'],
    readingTime: '6 min',
    content: `
<p>La liste de mariage est une tradition bien ancrée, mais elle évolue. Fini la liste de vaisselle imposée par un grand magasin : aujourd'hui, les couples ont le choix entre une multitude de formats. Voici comment créer la liste de mariage qui vous ressemble.</p>

<h2>1. Les différents types de listes de mariage</h2>

<h3>La liste classique en magasin</h3>
<p>Ouverte dans un grand magasin (Maisons du Monde, Ikea, Cyrillus, BHV...), elle permet à vos invités d'acheter des articles que vous avez présélectionnés. Simple, sécurisé, mais parfois limitant.</p>

<h3>La liste de mariage en ligne</h3>
<p>Des plateformes comme Wish, Zankyou ou Amazon permettent de créer une liste multi-boutiques en ligne. Vos invités commandent directement depuis chez eux, en France ou à l'étranger.</p>

<h3>La cagnotte voyage ou "lune de miel"</h3>
<p>Très populaire chez les couples qui ont déjà tout l'équipement nécessaire. Vos invités contribuent à votre voyage de noces ou à un projet commun (apport immobilier, véhicule, rénovation...). Plateformes : Pot Commun, Lydia, Leetchi.</p>

<h3>La liste d'expériences</h3>
<p>Pour les couples qui préfèrent les moments aux objets : dîner dans un grand restaurant, cours de cuisine, week-end bien-être, activités... Des plateformes comme La Belle Adresse ou Wonderbox proposent ce type de liste.</p>

<h3>La liste mixte</h3>
<p>Combinez une liste d'objets utiles et une cagnotte voyage. De nombreuses plateformes permettent maintenant de gérer les deux simultanément.</p>

<h2>2. Quand ouvrir sa liste de mariage ?</h2>

<p>Idéalement, ouvrez votre liste :</p>
<ul>
  <li><strong>6 à 8 mois avant</strong> le mariage pour les proches qui préfèrent anticiper</li>
  <li><strong>En même temps que l'envoi des faire-part</strong> (3 à 4 mois avant), pour que l'information soit communiquée à tous les invités</li>
</ul>

<p>Incluez le lien ou l'adresse de la liste dans votre faire-part ou sur votre site de mariage.</p>

<h2>3. Quoi mettre dans sa liste ?</h2>

<h3>Les essentiels</h3>
<ul>
  <li>Articles pour la maison (vaisselle, linge de lit, électroménager)</li>
  <li>Décoration d'intérieur</li>
  <li>Cadeaux pratiques (robot culinaire, Thermomix, machine à café...)</li>
</ul>

<h3>Les idées originales</h3>
<ul>
  <li>Abonnements (Netflix, Spotify, box gastronomique, jardinerie...)</li>
  <li>Don à une association qui vous tient à cœur</li>
  <li>Cours (cuisine, danse, langue, dessin...)</li>
  <li>Contribution à un projet commun (première maison, voiture, travaux)</li>
</ul>

<h2>4. Combien d'articles prévoir ?</h2>

<p>Une règle simple : prévoyez environ 1,5 fois le nombre d'invités en articles ou contributions. Si vous avez 100 invités, proposez 130 à 150 articles ou tranches de cagnotte. Ainsi, tout le monde a le choix sans arriver trop tard.</p>

<p>Variez les gammes de prix : de 20 à 30 € pour les cadeaux simples, jusqu'à 200 à 500 € pour les articles premium ou les grosses contributions à la cagnotte.</p>

<h2>5. Comment communiquer sa liste à ses invités ?</h2>

<ul>
  <li><strong>Site de mariage :</strong> Créez une page dédiée avec le lien direct vers votre liste.</li>
  <li><strong>Faire-part :</strong> Mentionnez l'existence de la liste (sans y inclure le lien — trop long — mais en renvoyant vers votre site ou en précisant le nom du magasin).</li>
  <li><strong>Bouche à oreille :</strong> Les parents et témoins peuvent relayer l'information.</li>
</ul>

<h2>6. Après le mariage : les remerciements</h2>

<p>Envoyez des cartes de remerciements personnalisées dans les 2 mois suivant le mariage. Mentionnez le cadeau spécifique reçu pour montrer que vous avez bien noté qui a offert quoi. Un petit geste qui fait toute la différence et que vos invités apprécieront vraiment.</p>
`,
  },

  // ── Article 9 : Wedding planner ───────────────────────────────────────────
  {
    slug: 'wedding-planner-ou-organisation-solo',
    title: 'Wedding planner ou organisation solo : que choisir pour votre mariage ?',
    description: 'Faire appel à un wedding planner ou tout organiser soi-même ? Découvrez les avantages, les inconvénients et les alternatives pour organiser votre mariage sereinement.',
    author: 'NUPLY',
    publishedAt: '2026-02-21',
    updatedAt: '2026-02-21',
    tags: ['Wedding Planner', 'Organisation', 'Conseils'],
    readingTime: '7 min',
    content: `
<p>Faire appel à un wedding planner ou organiser soi-même son mariage : c'est l'une des premières questions que se posent les couples après les fiançailles. La réponse dépend de votre budget, de votre temps disponible et de votre appétit pour l'organisation.</p>

<h2>1. Qu'est-ce qu'un wedding planner ?</h2>

<p>Un wedding planner (ou coordinateur de mariage) est un professionnel qui vous accompagne dans l'organisation de votre mariage. Il existe plusieurs niveaux de prestation :</p>

<ul>
  <li><strong>Organisation complète (full wedding planning) :</strong> Le wedding planner prend en charge tout, du concept à la coordination le jour J. Idéal si vous manquez de temps ou habitez loin du lieu.</li>
  <li><strong>Accompagnement partiel :</strong> Vous gérez certaines parties, le wedding planner intervient sur des aspects spécifiques (prestataires, logistique...).</li>
  <li><strong>Coordination jour J :</strong> Le wedding planner n'intervient que le jour du mariage pour s'assurer que tout se passe comme prévu. C'est l'option la plus abordable.</li>
</ul>

<h2>2. Combien coûte un wedding planner en France ?</h2>

<ul>
  <li><strong>Coordination jour J uniquement :</strong> 1 000 à 2 500 €</li>
  <li><strong>Accompagnement partiel :</strong> 2 000 à 5 000 €</li>
  <li><strong>Organisation complète :</strong> 5 000 à 15 000 € (souvent calculé en pourcentage du budget total, 10 à 15 %)</li>
</ul>

<h2>3. Les avantages du wedding planner</h2>

<ul>
  <li><strong>Gain de temps considérable :</strong> Un wedding planner gère les recherches, les négociations, les relances et la coordination entre prestataires.</li>
  <li><strong>Carnet d'adresses :</strong> Il ou elle connaît les meilleurs prestataires de la région et peut obtenir des tarifs préférentiels.</li>
  <li><strong>Zéro stress le jour J :</strong> Vous profitez de votre mariage pendant qu'il coordonne les équipes dans les coulisses.</li>
  <li><strong>Gestion des imprévus :</strong> Traiteur en retard, météo capricieuse, oubli d'un élément de décor... Le wedding planner gère.</li>
  <li><strong>Budget maîtrisé :</strong> Paradoxalement, un bon wedding planner peut vous faire économiser de l'argent grâce à ses négociations et ses conseils.</li>
</ul>

<h2>4. Les inconvénients du wedding planner</h2>

<ul>
  <li><strong>Un coût supplémentaire :</strong> Il faut intégrer ses honoraires dans votre budget global.</li>
  <li><strong>Perte de contrôle perçue :</strong> Certains couples tiennent à tout gérer eux-mêmes et trouvent difficile de déléguer.</li>
  <li><strong>Trouver le bon :</strong> Tous les wedding planners ne se valent pas. Il faut prendre le temps de sélectionner quelqu'un qui comprend vraiment votre vision.</li>
</ul>

<h2>5. L'organisation en solo : pour qui ?</h2>

<p>Organiser seul son mariage est tout à fait possible, surtout si :</p>
<ul>
  <li>Vous êtes naturellement organisé(e) et aimez les projets</li>
  <li>Votre mariage est de taille moyenne (moins de 80 invités)</li>
  <li>Vous disposez de temps (week-ends, soirées pour les recherches et démarches)</li>
  <li>Vous avez de l'aide de proches fiables (témoins impliqués)</li>
</ul>

<p>Dans ce cas, des outils comme <strong>NUPLY</strong> peuvent vous aider à centraliser toute l'organisation : recherche de prestataires, budget, timeline, messagerie. Vous bénéficiez d'une plateforme structurée sans passer par un intermédiaire humain.</p>

<h2>6. La solution intermédiaire : les outils d'organisation en ligne</h2>

<p>Entre le wedding planner haut de gamme et la feuille Excel, des plateformes comme NUPLY offrent une troisième voie :</p>

<ul>
  <li>Matching intelligent avec des prestataires vérifiés</li>
  <li>Suivi du budget en temps réel</li>
  <li>Timeline et checklist personnalisables</li>
  <li>Messagerie centralisée avec tous vos prestataires</li>
</ul>

<p>C'est idéal pour les couples qui veulent garder le contrôle tout en bénéficiant d'outils professionnels.</p>

<h2>7. Notre recommandation</h2>

<p>Si votre budget le permet, optez au minimum pour une <strong>coordination jour J</strong>. Le jour de votre mariage, vous méritez d'être présent(e) à 100 % dans vos émotions, pas en train de coordonner des prestataires par téléphone.</p>

<p>Pour l'organisation en amont, <strong>NUPLY</strong> peut vous faire économiser de nombreuses heures tout en accédant à des prestataires de qualité vérifiée.</p>
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
