import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'
import PageWrapper from '@/components/bureau/PageWrapper'
import EditProfileForm from '../profile/[username]/edit-form'
import PaymentSettingsForm from '@/components/settings/PaymentSettingsForm'

async function getProfileData(userId: string) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return profile as Profile | null
}

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfileData(user.id)

  if (!profile) redirect('/login')

  const initials = (profile.display_name ?? profile.username ?? '?').slice(0, 2).toUpperCase()

  return (
    <PageWrapper user={profile}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-500 
                         transition-colors text-xs sm:text-sm mb-4"
            >
              <span>←</span> Back to Dashboard
            </Link>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-slate-100 mb-2">Settings</h1>
              <p className="text-slate-500 text-sm sm:text-base">Manage your profile and account</p>
            </div>
          </div>

          {/* Profile Section */}
          <section className="mb-8 sm:mb-10">
            <div className="glass grain rounded-xl p-6 sm:p-8 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                {/* Profile Info */}
                <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0 mb-6 sm:mb-0">
                  {/* Avatar */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-bureau-gold/15 
                                  border border-bureau-gold/30 flex items-center justify-center 
                                  flex-shrink-0 overflow-hidden">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={`${profile.display_name ?? profile.username}'s avatar`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="font-serif text-lg sm:text-2xl text-bureau-gold">{initials}</span>
                    )}
                  </div>
                  
                  {/* Profile Details */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-xl sm:text-2xl text-slate-100 mb-1 truncate">
                      {profile.display_name ?? profile.username ?? 'Anonymous'}
                    </h2>
                    <p className="text-slate-500 text-sm break-all">@{profile.username}</p>
                    {profile.bio && (
                      <p className="text-slate-400 text-xs sm:text-sm mt-2 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <div className="w-full sm:w-auto">
                  <EditProfileForm profile={profile} />
                </div>
              </div>
            </div>
          </section>

          {/* Settings Grid */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* Account Security Section */}
            <section>
              <h3 className="font-serif text-lg text-slate-200 mb-4 flex items-center gap-2">
                <Lock size={18} className="text-amber-600" />
                Account & Security
              </h3>
              
              <div className="glass grain rounded-xl border border-white/10 overflow-hidden">
                {/* Email Address */}
                <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-white/5 hover:bg-white/[0.02] 
                                transition-colors">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Mail size={18} className="text-bureau-gold/60 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Email Address
                      </p>
                      <p className="text-sm sm:text-base text-slate-100 break-all">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="px-6 sm:px-8 py-5 sm:py-6 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-3 h-3 rounded-full bg-green-500/70 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Account Status
                      </p>
                      <p className="text-sm sm:text-base text-slate-100">Active and verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Settings Section */}
            <PaymentSettingsForm profile={profile} />

            {/* Danger Zone */}
            <section>
              <h3 className="font-serif text-lg text-red-400 mb-4 flex items-center gap-2">
                <LogOut size={18} />
                Sign Out
              </h3>
              
              <div className="glass grain rounded-xl border border-red-900/30 bg-red-900/5 p-6 sm:p-8">
                <p className="text-slate-400 text-sm sm:text-base mb-6">
                  Sign out from your account. You'll need to use magic link sign in to access The Bureau again.
                </p>

                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg 
                               bg-red-600/20 border border-red-600/50 text-red-400 text-sm font-medium
                               hover:bg-red-600/30 hover:border-red-500 transition-all active:scale-95
                               flex items-center justify-center sm:justify-start gap-2"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            </section>

          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
