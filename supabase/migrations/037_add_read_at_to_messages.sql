-- Ajouter la colonne read_at à la table messages pour les accusés de lecture
alter table public.messages
add column if not exists read_at timestamptz;

-- Index pour améliorer les performances des requêtes sur les messages non lus
create index if not exists idx_messages_read_at 
on public.messages(conversation_id, read_at) 
where read_at is null;
