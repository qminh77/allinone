import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <RegisterForm />
        </div>
    )
}
