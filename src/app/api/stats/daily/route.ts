import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  // Get today's stats
  const today = new Date().toISOString().split('T')[0]
  const { data: todayStats } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('stat_date', today)
    .single()

  // Get all-time totals from projects
  const { count: totalProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)

  const { count: totalAdoptions } = await supabase
    .from('adoptions')
    .select('*', { count: 'exact', head: true })

  const { count: totalResurrections } = await supabase
    .from('adoptions')
    .select('*', { count: 'exact', head: true })
    .not('resurrected_at', 'is', null)

  // Get death cause breakdown (all time)
  const { data: causeBreakdown } = await supabase
    .from('projects')
    .select('causes_of_death')
    .eq('is_public', true)

  const causeCounts: Record<string, number> = {}
  causeBreakdown?.forEach((project) => {
    project.causes_of_death.forEach((cause) => {
      causeCounts[cause] = (causeCounts[cause] ?? 0) + 1
    })
  })

  const topCause = Object.entries(causeCounts)
    .sort(([, a], [, b]) => b - a)[0]

  return NextResponse.json({
    today: {
      newProjects: todayStats?.new_projects_submitted ?? 0,
      newAdoptions: todayStats?.new_adoptions ?? 0,
      resurrected: todayStats?.projects_resurrected ?? 0,
    },
    allTime: {
      totalProjects: totalProjects ?? 0,
      totalAdoptions: totalAdoptions ?? 0,
      totalResurrections: totalResurrections ?? 0,
    },
    topCause: topCause ? { name: topCause[0], count: topCause[1] } : null,
    causeCounts,
  })
}
