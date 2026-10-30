import { AdminSectionsNavigation } from "@/app/admin/admin-sections-navigation";
import { getAuthenticatedUser, isActiveMember, userHasPermission } from "@/lib/auth";

export async function MemberAreaShell({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) return <>{children}</>;
  const activeMember = isActiveMember(user);

  return (
    <main className="xv-page-shell xv-admin-shell">
      <div className="flex w-full flex-col gap-4 px-3 py-3 lg:flex-row lg:items-stretch lg:px-5">
        <AdminSectionsNavigation
          canManageSports={userHasPermission(user, "sports.manage")}
          canManagePlatform={userHasPermission(user, "permission.manage")}
          canManagePlayers={userHasPermission(user, "player.manage")}
          canManageMembers={userHasPermission(user, "member.read")}
          canManageResults={userHasPermission(user, "match.result.manage")}
          canApproveAccounts={userHasPermission(user, "member.account.approve")}
          canAccessMemberArea={activeMember}
          canAccessPool={activeMember && userHasPermission(user, "pool.read")}
          canManagePool={userHasPermission(user, "pool.manage")}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
