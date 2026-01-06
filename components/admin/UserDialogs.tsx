'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateUser, deleteUser } from '@/lib/actions/users'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
    id: string
    full_name: string | null
    is_active: boolean
    role: { name: string } | null
    role_id: string | null
}

export function CreateUserDialog() {
    const [open, setOpen] = useState(false)
    const { register, handleSubmit, reset } = useForm()

    const onSubmit = async (data: any) => {
        // Placeholder for create action
        // const result = await createUser(data)
        toast.info('Tính năng tạo user đang được phát triển (Cần Service Role)')
        setOpen(false)
        reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Thêm người dùng</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Thêm người dùng mới</DialogTitle>
                    <DialogDescription>
                        Tạo tài khoản mới cho hệ thống
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" {...register('email')} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Mật khẩu</Label>
                        <Input type="password" {...register('password')} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Họ tên</Label>
                        <Input {...register('fullName')} required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Tạo tài khoản</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function EditUserDialog({ user }: { user: User }) {
    const [open, setOpen] = useState(false)
    const { register, handleSubmit } = useForm({
        defaultValues: {
            fullName: user.full_name || '',
            isActive: user.is_active,
            // roleId: user.role_id, // Need to fetch roles to populate select
        },
    })

    const onSubmit = async (data: any) => {
        const result = await updateUser({ id: user.id, ...data })
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('User updated')
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user details
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input {...register('fullName')} />
                    </div>
                    {/* Add Role Select here if we fetch roles */}
                    <div className="flex items-center justify-between">
                        <Label>Active Status</Label>
                        {/* Need manual controller for Switch with hook form if not using shadcn form wrapper fully */}
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function DeleteUserAlert({ userId }: { userId: string }) {
    const onDelete = async () => {
        const result = await deleteUser(userId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('User deactivated')
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will deactivate the user account. They will no longer be able to login.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                        Deactivate
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
