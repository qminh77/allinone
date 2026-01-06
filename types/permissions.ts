// Permission-related types

export type PermissionKey =
    // User Management
    | 'users.view'
    | 'users.edit'
    | 'users.delete'
    | 'users.assign_role'
    // Role Management
    | 'roles.view'
    | 'roles.create'
    | 'roles.edit'
    | 'roles.delete'
    | 'roles.assign_permissions'
    // Permission Management
    | 'permissions.view'
    | 'permissions.create'
    | 'permissions.delete'
    // Module Management
    | 'modules.view'
    | 'modules.toggle'
    // Settings
    | 'settings.view'
    | 'settings.edit'
    // Audit Logs
    | 'logs.view'
    // Backup & Restore
    | 'backup.create'
    | 'backup.restore'
    // Tools
    | 'tools.textformatter.access'
    | 'tools.imagecompressor.access'
    | 'tools.jsonvalidator.access'

export interface PermissionCheck {
    hasPermission: (key: PermissionKey) => boolean
    hasAnyPermission: (keys: PermissionKey[]) => boolean
    hasAllPermissions: (keys: PermissionKey[]) => boolean
    loading: boolean
}

export interface RoleWithPermissions extends import('./database').Role {
    permissions?: import('./database').Permission[]
}

export interface UserWithRole extends import('./database').UserProfile {
    role?: import('./database').Role
}
