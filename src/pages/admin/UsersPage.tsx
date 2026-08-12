import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Users } from 'lucide-react';
import { useUsers } from '../../hooks/useData';
import { db } from '../../backend';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/format';
import { Avatar, Badge, Button, EmptyState, SearchInput, Select, Table, THead, TH, TR, TD, SectionHeader } from '../../components/ui';
import type { AppUser } from '../../types';

export default function AdminUsers() {
  const { users, loading } = useUsers();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return users.filter((u) => {
      const matchesRole = role === 'All' || u.role === role;
      return matchesRole && [u.fullName, u.email, u.phone ?? ''].join(' ').toLowerCase().includes(q);
    });
  }, [users, query, role]);

  const toggleActive = async (u: AppUser) => {
    try {
      await db.users.update(u.uid, { isActive: !u.isActive });
      toast.success(`${u.fullName} ${u.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Unable to update the user.');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Client management" title="Clients & users" description="Manage accounts and access to the client portal." />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search users…" className="w-full sm:max-w-sm" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-full sm:w-44">
          <option value="All">All roles</option>
          <option value="client">Clients</option>
          <option value="admin">Admins</option>
        </Select>
      </div>

      {loading ? (
        <Table><THead><TR><TH>User</TH><TH>Role</TH><TH>Joined</TH><TH /></TR></THead></Table>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={22} />} title="No users found" description="Try a different search or role filter." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>User</TH>
              <TH>Role</TH>
              <TH>Joined</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((u) => (
              <TR key={u.uid}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.fullName} size={36} />
                    <div>
                      <p className="font-semibold text-agdark-800">
                        {u.fullName}
                        {u.uid === currentUser?.uid ? <span className="ml-1.5 text-xs text-agorange">(you)</span> : null}
                      </p>
                      <p className="text-xs text-agdark-400">{u.email}</p>
                    </div>
                  </div>
                </TD>
                <TD>
                  {u.role === 'admin' ? <Badge tone="dark"><ShieldCheck size={12} /> Admin</Badge> : <Badge tone="blue">Client</Badge>}
                </TD>
                <TD>{formatDate(u.createdAt)}</TD>
                <TD>
                  <Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                </TD>
                <TD>
                  {u.role === 'client' && u.uid !== currentUser?.uid ? (
                    <Button variant="outline" size="sm" onClick={() => toggleActive(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  ) : (
                    <span className="text-xs text-agdark-300">—</span>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
