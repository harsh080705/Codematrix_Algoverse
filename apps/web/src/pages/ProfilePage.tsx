import { AppButton, SectionHeading } from "../components/ui";

export function ProfilePage() {
  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="Profile" title="Account overview" description="Manage your identity, favorites, reviews, and payout wallet." />
      <div className="section-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Logged in as</p>
            <h3 className="mt-2 font-display text-2xl font-bold text-white">Anshul Sharma</h3>
            <p className="mt-2 text-sm text-slate-300">user@aihub.market</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AppButton variant="secondary">Edit profile</AppButton>
            <AppButton variant="secondary">Manage favorites</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
