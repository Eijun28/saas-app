/**
 * Traduit les messages d'erreur de Supabase en français
 * avec des explications claires pour l'utilisateur
 */
export function translateAuthError(errorMessage: string | null | undefined): string {
  if (!errorMessage) {
    return 'Une erreur est survenue. Veuillez réessayer.'
  }

  const message = errorMessage.toLowerCase()

  // Erreurs de connexion
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Les identifiants sont incorrects. Vérifiez votre email et votre mot de passe.'
  }

  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Votre email n\'a pas été confirmé. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.'
  }

  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.'
  }

  // Erreurs d'inscription
  if (message.includes('user already registered') || message.includes('already registered') || message.includes('email already exists')) {
    return 'Cet email est déjà utilisé. Si vous avez déjà un compte, connectez-vous. Sinon, utilisez une autre adresse email.'
  }

  if (message.includes('password') && message.includes('weak') || message.includes('password') && message.includes('too short')) {
    return 'Le mot de passe est trop faible. Il doit contenir au moins 8 caractères, une majuscule et un chiffre.'
  }

  if (message.includes('password') && message.includes('required')) {
    return 'Le mot de passe est requis.'
  }

  // Erreurs de format
  if (message.includes('invalid email') || message.includes('email format')) {
    return 'L\'adresse email n\'est pas valide. Veuillez vérifier le format (exemple: nom@domaine.com).'
  }

  if (message.includes('email') && message.includes('required')) {
    return 'L\'adresse email est requise.'
  }

  // Erreurs de configuration
  if (message.includes('invalid api key') || message.includes('api key') || message.includes('variables d\'environnement')) {
    return 'Erreur de configuration du serveur. Veuillez contacter le support technique.'
  }

  // Erreurs réseau
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Erreur de connexion au serveur. Vérifiez votre connexion internet et réessayez.'
  }

  if (message.includes('timeout')) {
    return 'La requête a pris trop de temps. Veuillez réessayer.'
  }

  // Erreurs de session
  if (message.includes('session') && message.includes('expired')) {
    return 'Votre session a expiré. Veuillez vous reconnecter.'
  }

  if (message.includes('auth session missing')) {
    return 'Session expirée. Veuillez vous reconnecter.'
  }

  // Erreurs d'envoi d'email
  if (message.includes('email') && (message.includes('send') || message.includes('failed'))) {
    return 'Impossible d\'envoyer l\'email de confirmation. Vérifiez que votre adresse email est correcte et réessayez.'
  }

  // Erreurs de création de compte
  if (message.includes('signup') && message.includes('failed') || message.includes('user creation failed')) {
    return 'Échec de la création du compte. Veuillez réessayer ou contacter le support si le problème persiste.'
  }

  // Erreurs de profil
  if (message.includes('profile') && message.includes('error')) {
    return 'Erreur lors de la création du profil. Veuillez réessayer.'
  }

  if (message.includes('couple') && message.includes('error')) {
    return 'Erreur lors de la création de votre compte couple. Veuillez réessayer.'
  }

  // Erreurs de contrainte de clé étrangère
  if (message.includes('foreign key') || message.includes('constraint') || message.includes('violates foreign key')) {
    return 'Erreur de référence dans la base de données. Veuillez contacter le support technique.'
  }

  // Erreurs de contrainte unique
  if (message.includes('unique constraint') || message.includes('duplicate key') || message.includes('already exists')) {
    return 'Cette information est déjà utilisée. Veuillez vérifier vos données.'
  }

  // Erreurs de colonne manquante
  if (message.includes('column') && (message.includes('does not exist') || message.includes('missing'))) {
    return 'Erreur de structure de base de données. Veuillez contacter le support technique.'
  }

  // Erreurs de table manquante
  if (message.includes('relation') && message.includes('does not exist')) {
    return 'Erreur de structure de base de données. Veuillez contacter le support technique.'
  }

  // Erreurs de callback
  if (message.includes('callback_error') || message.includes('callback')) {
    return 'Erreur lors de la confirmation de votre compte. Le lien de confirmation peut avoir expiré. Veuillez demander un nouveau lien ou réessayer de vous connecter.'
  }

  // Erreurs génériques Supabase
  if (message.includes('supabase') || message.includes('database')) {
    return 'Erreur de base de données. Veuillez réessayer dans quelques instants.'
  }

  // Si le message est déjà traduit en français (contient des accents ou commence par un mot français courant),
  // le retourner tel quel sans préfixer "Erreur:"
  if (/^(erreur|échec|cet |votre |impossible|trop )/i.test(errorMessage)) {
    return errorMessage
  }

  // Si aucun pattern ne correspond, retourner un message générique user-friendly
  return 'Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.'
}
