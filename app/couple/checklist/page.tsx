import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { ChecklistView } from '@/components/checklist/ChecklistView'
import { getWeddingTasks } from '@/lib/supabase/queries/wedding-tasks.queries'

export default async function ChecklistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Récupérer la date de mariage pour calculer les due_dates
  const { data: coupleProfile } = await supabase
    .from('couple_profiles')
    .select('id, date_mariage')
    .eq('user_id', user.id)
    .single()

  const coupleId     = coupleProfile?.id ?? user.id
  const weddingDate  = coupleProfile?.date_mariage ?? null

  // Charger (et initialiser si vide) les tâches
  const tasks = await getWeddingTasks(coupleId, weddingDate)

  const done  = tasks.filter(t => t.completed).length
  const total = tasks.length

  return (
    <div className="w-full space-y-2">
      <PageTitle
        title="Checklist mariage"
        description={
          total > 0
            ? `${done}/${total} tâche${total > 1 ? 's' : ''} complétée${done > 1 ? 's' : ''}`
            : 'Toutes vos tâches de préparation au même endroit'
        }
      />
      <ChecklistView tasks={tasks} coupleId={coupleId} />
    </div>
  )
}
