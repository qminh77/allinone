import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUserProfile } from '@/lib/auth/session'

export default async function DashboardPage() {
    const profile = await getCurrentUserProfile()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Chào mừng {profile?.full_name || 'bạn'} đến với Tool Website
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>📝 Text Formatter</CardTitle>
                        <CardDescription>
                            Định dạng văn bản: uppercase, lowercase, capitalize
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>🖼️ Image Compressor</CardTitle>
                        <CardDescription>
                            Nén ảnh để giảm kích thước file
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>📋 JSON Validator</CardTitle>
                        <CardDescription>
                            Kiểm tra và format JSON
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin tài khoản</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div>
                            <span className="font-semibold">Họ tên:</span>{' '}
                            {profile?.full_name || 'Chưa cập nhật'}
                        </div>
                        <div>
                            <span className="font-semibold">Role:</span>{' '}
                            {/* @ts-ignore */}
                            {profile?.role?.name || 'Guest'}
                        </div>
                        <div>
                            <span className="font-semibold">Trạng thái:</span>{' '}
                            {profile?.is_active ? (
                                <span className="text-green-600">Hoạt động</span>
                            ) : (
                                <span className="text-red-600">Bị khóa</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
