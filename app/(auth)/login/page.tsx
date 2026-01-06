import { LoginForm } from "@/components/auth/LoginForm"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Đăng nhập | Tool Website",
    description: "Đăng nhập vào hệ thống quản lý công cụ",
}

export default function LoginPage() {
    return <LoginForm />
}
