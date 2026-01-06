import { RegisterForm } from "@/components/auth/RegisterForm"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Đăng ký | Tool Website",
    description: "Đăng ký tài khoản mới",
}

export default function RegisterPage() {
    return <RegisterForm />
}
