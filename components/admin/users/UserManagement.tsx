'use client'

import { useState } from 'react'
import { UserList } from './UserList'
import { UserForm } from './UserForm'
import { UserImportDialog } from './UserImportDialog'

interface UserManagementProps {
    users: any[]
    roles: any[]
}

export function UserManagement({ users, roles }: UserManagementProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any | null>(null)

    const handleEdit = (user: any) => {
        setSelectedUser(user)
        setFormOpen(true)
    }

    const handleAdd = () => {
        setSelectedUser(null)
        setFormOpen(true)
    }

    const handleCloseForm = () => {
        setFormOpen(false)
        setSelectedUser(null)
    }

    return (
        <>
            <UserList
                users={users}
                onEdit={handleEdit}
                onAdd={handleAdd}
                onImport={() => setImportOpen(true)}
            />

            <UserForm
                open={formOpen}
                onClose={handleCloseForm}
                user={selectedUser}
                roles={roles}
            />

            <UserImportDialog
                open={importOpen}
                onClose={() => setImportOpen(false)}
            />
        </>
    )
}
