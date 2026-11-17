using Dapper;
using System.Security.Claims;

public static class CampaignsEndpoints
{
    public static void MapRoutes(WebApplication app)
    {
        // POST /worlds/{worldId}/campaigns — cria uma campanha dentro de um mundo
        app.MapPost("/worlds/{worldId}/campaigns", async (
            Guid worldId, CreateCampaignRequest req, HttpContext ctx) =>
        {
            var userId = Guid.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            using var conn = DbConnection.Criar();

            // ── Só o Criador do Mundo pode criar campanhas (RF-27) ──────────
            var isCreator = await conn.ExecuteScalarAsync<bool>(
                @"SELECT EXISTS(SELECT 1 FROM roles
                  WHERE user_id = @UserId AND role_type = 'creator'
                  AND scope_type = 'world' AND scope_id = @WorldId)",
                new { UserId = userId, WorldId = worldId });

            if (!isCreator)
                return Results.Forbid();

            await conn.OpenAsync();
            using var transacao = await conn.BeginTransactionAsync();

            try
            {
                // ── 1. Cria a campanha ───────────────────────────────────────
                // Quem cria já vira automaticamente o Mestre dela (req.MasterId
                // permite delegar a outro usuário na hora da criação, se quiser;
                // se vier null, o próprio Criador assume como Mestre também)
                var masterId = req.MasterId ?? userId;

                var campaignId = await conn.ExecuteScalarAsync<Guid>(
                    @"INSERT INTO campaigns (world_id, master_id, name, started_at)
                      VALUES (@WorldId, @MasterId, @Name, NOW())
                      RETURNING id",
                    new { WorldId = worldId, MasterId = masterId, req.Name },
                    transacao);

                // ── 2. Registra o papel 'master' pro Mestre da campanha ─────
                // Isso é o que faz o segundo ramo do RbacService.UserCanEdit()
                // (a checagem de role_type = 'master') funcionar de verdade.
                await conn.ExecuteAsync(
                    @"INSERT INTO roles (user_id, role_type, scope_type, scope_id)
                      VALUES (@MasterId, 'master', 'campaign', @CampaignId)",
                    new { MasterId = masterId, CampaignId = campaignId },
                    transacao);

                await transacao.CommitAsync();

                return Results.Created($"/campaigns/{campaignId}",
                    new { id = campaignId, mensagem = "Campanha criada!" });
            }
            catch
            {
                await transacao.RollbackAsync();
                throw;
            }

        }).RequireAuthorization();

        // GET /worlds/{worldId}/campaigns — lista campanhas de um mundo (leitura pública)
        app.MapGet("/worlds/{worldId}/campaigns", async (Guid worldId) =>
        {
            using var conn = DbConnection.Criar();
            var campaigns = await conn.QueryAsync<Campaign>(
                "SELECT * FROM campaigns WHERE world_id = @WorldId",
                new { WorldId = worldId });
            return Results.Ok(campaigns);
        });

        // POST /campaigns/{id}/assign-master — Criador transfere/atribui o Mestre (RF-05)
        app.MapPost("/campaigns/{id}/assign-master", async (
            Guid id, AssignMasterRequest req, HttpContext ctx) =>
        {
            var userId = Guid.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            using var conn = DbConnection.Criar();

            // Busca a campanha pra saber o mundo dela (precisa confirmar
            // que quem está chamando é o Criador DAQUELE mundo especificamente)
            var campaign = await conn.QueryFirstOrDefaultAsync<Campaign>(
                "SELECT * FROM campaigns WHERE id = @Id", new { Id = id });

            if (campaign is null) return Results.NotFound();

            var isCreator = await conn.ExecuteScalarAsync<bool>(
                @"SELECT EXISTS(SELECT 1 FROM roles
                  WHERE user_id = @UserId AND role_type = 'creator'
                  AND scope_type = 'world' AND scope_id = @WorldId)",
                new { UserId = userId, WorldId = campaign.WorldId });

            if (!isCreator)
                return Results.Forbid();

            await conn.OpenAsync();
            using var transacao = await conn.BeginTransactionAsync();

            try
            {
                // Atualiza quem é o Mestre na própria tabela campaigns
                await conn.ExecuteAsync(
                    "UPDATE campaigns SET master_id = @NewMasterId WHERE id = @Id",
                    new { req.NewMasterId, Id = id }, transacao);

                // Remove o papel de master do Mestre anterior (se havia)
                await conn.ExecuteAsync(
                    @"DELETE FROM roles
                      WHERE role_type = 'master' AND scope_type = 'campaign' AND scope_id = @Id",
                    new { Id = id }, transacao);

                // Registra o papel para o novo Mestre
                await conn.ExecuteAsync(
                    @"INSERT INTO roles (user_id, role_type, scope_type, scope_id)
                      VALUES (@NewMasterId, 'master', 'campaign', @Id)",
                    new { req.NewMasterId, Id = id }, transacao);

                await transacao.CommitAsync();
                return Results.Ok(new { mensagem = "Mestre atribuído com sucesso!" });
            }
            catch
            {
                await transacao.RollbackAsync();
                throw;
            }

        }).RequireAuthorization();
    }
}

public record CreateCampaignRequest(string Name, Guid? MasterId);
public record AssignMasterRequest(Guid NewMasterId);