using Dapper;
using System.Security.Claims;

public static class WorldsEndpoints
{
    public static void MapRoutes(WebApplication app)
    {
        // POST /worlds — cria um mundo novo e torna o usuário logado o "creator"
        app.MapPost("/worlds", async (CreateWorldRequest req, HttpContext ctx) =>
        {
            // Pega o ID do usuário logado (vem de dentro do token JWT)
            var userId = Guid.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            using var conn = DbConnection.Criar();
            await conn.OpenAsync();
            using var transacao = await conn.BeginTransactionAsync();

            try
            {
                // 1. Cria o mundo
                var worldId = await conn.ExecuteScalarAsync<Guid>(
                    @"INSERT INTO worlds (creator_id, name, description, is_public)
                      VALUES (@CreatorId, @Name, @Description, @IsPublic)
                      RETURNING id",
                    new { CreatorId = userId, req.Name, req.Description, req.IsPublic },
                    transacao);

                // 2. Registra o papel 'creator' pra esse usuário nesse mundo
                await conn.ExecuteAsync(
                    @"INSERT INTO roles (user_id, role_type, scope_type, scope_id)
                      VALUES (@UserId, 'creator', 'world', @WorldId)",
                    new { UserId = userId, WorldId = worldId },
                    transacao);

                await transacao.CommitAsync();

                return Results.Created($"/worlds/{worldId}", new { id = worldId, mensagem = "Mundo criado!" });
            }
            catch
            {
                await transacao.RollbackAsync();
                throw;
            }
        }).RequireAuthorization();  // ← exige token JWT válido

        // GET /worlds — lista mundos públicos (não exige login)
        app.MapGet("/worlds", async () =>
        {
            using var conn = DbConnection.Criar();
            var worlds = await conn.QueryAsync<World>(
                "SELECT * FROM worlds WHERE is_public = true");
            return Results.Ok(worlds);
        });
    }
}

public record CreateWorldRequest(string Name, string? Description, bool IsPublic);