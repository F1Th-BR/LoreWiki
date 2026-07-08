using Dapper;

public static class AuthEndpoints
{
    public static void MapRoutes(WebApplication app)
    {
        // POST /auth/register — cria novo usuário
        app.MapPost("/auth/register", async (RegisterRequest req) =>
        {
            using var conn = DbConnection.Criar();

            // Verifica se e-mail já está em uso
            var existe = await conn.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM users WHERE email = @Email)",
                new { req.Email });

            if (existe)
                return Results.Conflict("E-mail já cadastrado.");

            // Cria hash da senha e salva o usuário
            var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);

            await conn.ExecuteAsync(
                "INSERT INTO users (username, email, password_hash) VALUES (@U, @E, @H)",
                new { U = req.Username, E = req.Email, H = hash });

            return Results.Created("/", new { mensagem = "Usuário criado com sucesso!" });
        });

        // POST /auth/login — autentica e retorna o token
        app.MapPost("/auth/login", async (LoginRequest req, AuthService auth) =>
        {
            using var conn = DbConnection.Criar();

            var user = await conn.QueryFirstOrDefaultAsync<User>(
                "SELECT * FROM users WHERE email = @Email AND deleted_at IS NULL",
                new { req.Email });

            if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Results.Unauthorized();  // não diz se é email ou senha errada

            var token = auth.GenerateToken(user);
            return Results.Ok(new { token, expiraEm = "24 horas" });
        });
    }
}

// Records para receber os dados do front-end
public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Email, string Password);