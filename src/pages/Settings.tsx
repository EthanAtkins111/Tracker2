import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRoles } from "@/hooks/use-roles";
import { Plus, X, Pencil, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { allRoles, defaultRoles, customRoles, addRole, removeRole, renameRole } = useRoles();
  const [newRole, setNewRole] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
    const trimmed = newRole.trim();
    if (!trimmed) return;
    if (allRoles.includes(trimmed)) {
      toast.error("Role already exists");
      return;
    }
    addRole(trimmed);
    setNewRole("");
    toast.success(`Role "${trimmed}" added`);
  };

  const handleRename = (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingRole(null);
      return;
    }
    if (allRoles.includes(trimmed)) {
      toast.error("Role already exists");
      return;
    }
    renameRole(oldName, trimmed);
    setEditingRole(null);
    toast.success(`Role renamed to "${trimmed}"`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Contact Roles</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage the roles available when adding or editing contacts. Default roles cannot be removed.
        </p>

        {/* Add new role */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="New role name..."
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="max-w-xs"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newRole.trim()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {/* Default roles */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Default Roles</p>
          <div className="flex flex-wrap gap-2">
            {defaultRoles.map(role => (
              <Badge key={role} variant="secondary" className="text-sm py-1 px-3">
                {role}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom roles */}
        {customRoles.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Custom Roles</p>
            <div className="flex flex-wrap gap-2">
              {customRoles.map(role => (
                <div key={role} className="flex items-center">
                  {editingRole === role ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleRename(role)}
                        className="h-7 w-32 text-sm"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRename(role)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingRole(null)}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-sm py-1 px-3 gap-1.5">
                      {role}
                      <button
                        onClick={() => { setEditingRole(role); setEditValue(role); }}
                        className="hover:text-foreground text-muted-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => { removeRole(role); toast.success(`Role "${role}" removed`); }}
                        className="hover:text-destructive text-muted-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
