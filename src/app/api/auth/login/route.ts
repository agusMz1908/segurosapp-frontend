import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password, rememberMe } = await request.json()

    // Validación básica
    if (!username || !password) {
      return NextResponse.json({ message: "Usuario y contraseña son requeridos" }, { status: 400 })
    }

    // Aquí implementarías la lógica de autenticación real
    // Por ahora, simulamos una validación básica
    if (username === "admin" && password === "admin123") {
      // Generar token JWT (en producción usar una librería como jose o jsonwebtoken)
      const token = "mock-jwt-token-" + Date.now()

      const response = NextResponse.json({
        success: true,
        token,
        user: {
          id: 1,
          username: "admin",
          role: "administrator",
        },
      })

      // Configurar cookie httpOnly para el token (más seguro)
      if (rememberMe) {
        response.cookies.set("seguros_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60, // 30 días
        })
      } else {
        response.cookies.set("seguros_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          // Sin maxAge para que sea una cookie de sesión
        })
      }

      return response
    } else {
      return NextResponse.json({ message: "Credenciales incorrectas" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
