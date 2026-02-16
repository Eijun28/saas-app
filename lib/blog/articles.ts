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
]

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return articles.find(a => a.slug === slug)
}

export function getAllArticles(): BlogArticle[] {
  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}
